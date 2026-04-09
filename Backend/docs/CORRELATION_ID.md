## Quick Interview Answer

I implemented Correlation ID using middleware and delegating handlers to generate and propagate a unique request ID across all microservices for end-to-end tracing and debugging.

# Correlation ID in SmartShip Logistics

## Problem (Why we use it)

In a microservices architecture, a single user request can pass through multiple services such as the API Gateway, Identity, Shipment, Tracking, and Document services. Logs for that one request end up scattered across different services, which makes debugging issues and tracing failures slow and difficult.

## Overview

To solve this, the SmartShip Logistics backend uses a Correlation ID (a GUID) to trace a single request as it travels through the gateway and microservices. The Correlation ID is not stored in any database; it is managed in-memory and passed via HTTP headers and logging scopes.

- HTTP header name: `X-Correlation-ID`
- Context key: `CorrelationId`
- Log property name: `CorrelationId`

## Where it is implemented

Core implementation lives in the shared library:

- Middleware and helpers: `SmartShip.Core.Correlation`
  - CorrelationIdMiddleware
  - CorrelationIdAccessor / ICorrelationIdAccessor
  - CorrelationIdDelegatingHandler
  - CorrelationIdHttpContextExtensions
  - CorrelationIdServiceCollectionExtensions (AddCorrelationId)
  - CorrelationIdConstants

The API Gateway has its own lightweight correlation components under:

- `Backend/gateway/SmartShip.Gateway/Correlation`

## How it works

### 1. Incoming request (Middleware)

1. `CorrelationIdMiddleware` runs early in the pipeline in each microservice.
2. It tries to read `X-Correlation-ID` from the incoming HTTP request headers.
3. If the header is missing or empty, it generates a new GUID.
4. The chosen Correlation ID is then:
   - Stored in `HttpContext.Items["CorrelationId"]`
   - Set on the request headers as `X-Correlation-ID`
   - Ensured on the response headers via `context.Response.OnStarting`
5. A correlation scope is opened using `ICorrelationIdAccessor.BeginScope(correlationId)` and a Serilog log property `CorrelationId` is pushed to `LogContext`.

### 2. Per-request storage (in-memory)

- `CorrelationIdAccessor` uses `AsyncLocal<string?>` to hold the current Correlation ID for the logical execution flow.
- This means any code running within the current request scope (including outgoing HTTP calls) can access `ICorrelationIdAccessor.CorrelationId` without passing it manually.
- No database or persistent storage is used for the Correlation ID.

### 3. Outgoing HTTP calls

- `CorrelationIdDelegatingHandler` is registered via `AddCorrelationId()` and added as an `HttpClient` message handler.
- Before sending an outgoing HTTP request, it reads the current Correlation ID from `ICorrelationIdAccessor` and, if present, adds the `X-Correlation-ID` header to the request.
- This ensures the same Correlation ID flows across service-to-service calls.

### 4. Accessing the Correlation ID in code

- For middleware/controllers that have an `HttpContext`, you can call:
  - `context.GetCorrelationId()` (extension method) to read the current Correlation ID.
- For services that do not have direct access to `HttpContext`, you can inject `ICorrelationIdAccessor` and read:
  - `correlationIdAccessor.CorrelationId`

### 5. Logging and error responses

- Because the Correlation ID is pushed into the Serilog `LogContext`, all logs written within the request scope automatically include a `CorrelationId` property.
- The global exception handler (`GlobalExceptionHandler`) uses `HttpContext.GetCorrelationId()` to include the Correlation ID in:
  - The error log message
  - The structured error response payload (e.g., a `correlationId` field)

## Where it is wired in

Each microservice calls `AddCorrelationId()` and uses the middleware in `Program.cs`, for example in Document Service:

```csharp
builder.Services.AddJwtAuthentication(builder.Configuration);

builder.Services.AddCorrelationId();

var app = builder.Build();

app.UseMiddleware<CorrelationIdMiddleware>();
```

Similar wiring exists in AdminService, ShipmentService, TrackingService, and IdentityService.

The API Gateway also registers its own `CorrelationIdMiddleware` and `CorrelationIdDelegatingHandler` so the `X-Correlation-ID` header is respected at the edge and propagated into downstream services.

## Interview-style summary

- The Correlation ID is a GUID used to trace requests end-to-end.
- It is passed via the `X-Correlation-ID` HTTP header and stored per-request in `HttpContext.Items` and an `AsyncLocal` accessor.
- It is **not** persisted in any database; it only lives for the lifetime of a request.
- Middleware sets/reads it on every incoming request, and a delegating handler propagates it on outgoing `HttpClient` calls.
- Logging and error responses include the Correlation ID so issues can be traced across services.