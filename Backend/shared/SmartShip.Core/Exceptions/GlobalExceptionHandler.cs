using System.Net;
using System.Text.Json;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using System.Text.Json.Serialization;
using SmartShip.Core.Correlation;

namespace SmartShip.Core.Exceptions;

public class GlobalExceptionHandler
{
    private readonly RequestDelegate _next;
    private readonly ILogger<GlobalExceptionHandler> _logger;

    public GlobalExceptionHandler(RequestDelegate next, ILogger<GlobalExceptionHandler> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext httpContext)
    {
        try
        {
            await _next(httpContext);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex,
                "Unhandled exception occurred. TraceId: {TraceId}, CorrelationId: {CorrelationId}",
                httpContext.TraceIdentifier,
                httpContext.GetCorrelationId());
            await HandleExceptionAsync(httpContext, ex);
        }
    }

    private static Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        context.Response.ContentType = "application/json";

        var statusCode = exception switch
        {
            SmartShipException ssEx => ssEx.StatusCode,
            ArgumentException => (int)HttpStatusCode.BadRequest,
            UnauthorizedAccessException => (int)HttpStatusCode.Unauthorized,
            KeyNotFoundException => (int)HttpStatusCode.NotFound,
            InvalidOperationException => (int)HttpStatusCode.BadRequest,
            _ => (int)HttpStatusCode.InternalServerError
        };

        context.Response.StatusCode = statusCode;

        var correlationId = context.GetCorrelationId();

        var response = new Dictionary<string, object?>
        {
            ["status"] = statusCode,
            ["message"] = exception.Message,
            ["traceId"] = context.TraceIdentifier,
            ["correlationId"] = correlationId,
            ["timestamp"] = DateTime.UtcNow
        };

        if (exception is SmartShipException smartShipException && !string.IsNullOrWhiteSpace(smartShipException.ErrorCode))
        {
            response["errorCode"] = smartShipException.ErrorCode;
        }

        if (exception is SmartShipValidationException validationException)
        {
            response["errors"] = validationException.Errors;
        }

        var result = JsonSerializer.Serialize(response, new JsonSerializerOptions
        {
            DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull
        });
        return context.Response.WriteAsync(result);
    }
}
