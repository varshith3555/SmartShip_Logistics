# SmartShip Logistics

Monorepo for the SmartShip Logistics system.

## Structure
- `Backend/` — .NET microservices + API gateway
- `frontend/` — Angular UI

## Secrets / local config
This repo intentionally does **not** commit secret-bearing config.

For each backend service and the gateway, copy `appsettings.example.json` to `appsettings.json` and fill in the required values (JWT secret, email credentials, OAuth secrets, etc.).



