using System.Net;

namespace SmartShip.Core.Exceptions;

/// <summary>
/// Base exception type for application errors mapped to HTTP status codes.
/// </summary>
public abstract class SmartShipException : Exception
{
    protected SmartShipException(HttpStatusCode statusCode, string message, string? errorCode = null, Exception? innerException = null)
        : base(message, innerException)
    {
        StatusCode = (int)statusCode;
        ErrorCode = errorCode;
    }

    public int StatusCode { get; }

    public string? ErrorCode { get; }
}

/// <summary>
/// Represents a 400 Bad Request error.
/// </summary>
public sealed class SmartShipBadRequestException : SmartShipException
{
    public SmartShipBadRequestException(string message, string? errorCode = null, Exception? innerException = null)
        : base(HttpStatusCode.BadRequest, message, errorCode, innerException)
    {
    }
}

/// <summary>
/// Represents a 401 Unauthorized error.
/// </summary>
public sealed class SmartShipUnauthorizedException : SmartShipException
{
    public SmartShipUnauthorizedException(string message, string? errorCode = null, Exception? innerException = null)
        : base(HttpStatusCode.Unauthorized, message, errorCode, innerException)
    {
    }
}

/// <summary>
/// Represents a 403 Forbidden error.
/// </summary>
public sealed class SmartShipForbiddenException : SmartShipException
{
    public SmartShipForbiddenException(string message, string? errorCode = null, Exception? innerException = null)
        : base(HttpStatusCode.Forbidden, message, errorCode, innerException)
    {
    }
}

/// <summary>
/// Represents a 404 Not Found error.
/// </summary>
public sealed class SmartShipNotFoundException : SmartShipException
{
    public SmartShipNotFoundException(string message, string? errorCode = null, Exception? innerException = null)
        : base(HttpStatusCode.NotFound, message, errorCode, innerException)
    {
    }
}

/// <summary>
/// Represents a 409 Conflict error.
/// </summary>
public sealed class SmartShipConflictException : SmartShipException
{
    public SmartShipConflictException(string message, string? errorCode = null, Exception? innerException = null)
        : base(HttpStatusCode.Conflict, message, errorCode, innerException)
    {
    }
}

/// <summary>
/// Represents a 400 validation error with a field-to-errors map.
/// </summary>
public sealed class SmartShipValidationException : SmartShipException
{
    public SmartShipValidationException(
        string message,
        IReadOnlyDictionary<string, string[]> errors,
        string? errorCode = null,
        Exception? innerException = null)
        : base(HttpStatusCode.BadRequest, message, errorCode, innerException)
    {
        Errors = errors;
    }

    public IReadOnlyDictionary<string, string[]> Errors { get; }
}
