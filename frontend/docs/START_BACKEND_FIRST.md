# ⚠️ IMPORTANT: Start Backend Services First!

## You're seeing connection errors because the backend is not running.

### Quick Fix (3 Steps):

#### 1️⃣ Start Infrastructure
```bash
cd Backend/infrastructure
docker-compose up -d
```
Wait 10 seconds for databases to start.

#### 2️⃣ Start Gateway
```bash
cd Backend/gateway/SmartShip.Gateway
dotnet run
```
Wait until you see: "Now listening on: http://localhost:5279"

#### 3️⃣ Start Identity Service
```bash
cd Backend/services/SmartShip.IdentityService
dotnet run
```
Wait until you see: "Now listening on: http://localhost:5028"

### ✅ Now refresh your browser!

The login page should work without errors.

---

## What's Happening?

Your frontend (Angular) is running on: `http://localhost:4200` ✅

But it's trying to connect to:
- Gateway API: `http://localhost:5279` ❌ (Not running)
- Identity API: `http://localhost:5028` ❌ (Not running)

**Result:** Connection refused errors in console.

---

## Verify Services Are Running

Open these URLs in your browser:
- http://localhost:5279/swagger (Gateway)
- http://localhost:5028/swagger (Identity)

If you see Swagger documentation, services are running! ✅

---

## Still Having Issues?

See `TROUBLESHOOTING.md` for detailed help.
