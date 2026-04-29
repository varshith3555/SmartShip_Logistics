using Microsoft.EntityFrameworkCore;
using SmartShip.AdminService.Models;

namespace SmartShip.AdminService.Data;

/// <summary>
/// Seeds baseline admin data (hubs/locations) into the Admin database.
/// </summary>
public static class AdminDbSeeder
{
    /// <summary>
    /// Inserts or updates the default hubs and their locations.
    /// </summary>
    public static void Seed(AdminDbContext db)
    {
        if (db is null) throw new ArgumentNullException(nameof(db));

        UpsertHub(db,
            hubName: "Mumbai Central Hub",
            city: "Mumbai",
            state: "Maharashtra",
            country: "India",
            pincode: "400001",
            capacity: 500);

        UpsertHub(db,
            hubName: "Delhi Logistics Hub",
            city: "New Delhi",
            state: "Delhi",
            country: "India",
            pincode: "110001",
            capacity: 750);

        UpsertHub(db,
            hubName: "Bangalore Distribution Center",
            city: "Bengaluru",
            state: "Karnataka",
            country: "India",
            pincode: "560001",
            capacity: 600);

        UpsertHub(db,
            hubName: "Hyderabad Warehouse Hub",
            city: "Hyderabad",
            state: "Telangana",
            country: "India",
            pincode: "500001",
            capacity: 450);

        UpsertHub(db,
            hubName: "Chennai Port Hub",
            city: "Chennai",
            state: "Tamil Nadu",
            country: "India",
            pincode: "600001",
            capacity: 700);

        db.SaveChanges();
    }

    private static void UpsertHub(
        AdminDbContext db,
        string hubName,
        string city,
        string state,
        string country,
        string pincode,
        int capacity)
    {
        var normalizedHubName = hubName.Trim();

        var hub = db.Hubs
            .Include(h => h.Location)
            .FirstOrDefault(h => h.HubName.ToLower() == normalizedHubName.ToLower());

        if (hub is null)
        {
            var location = FindOrCreateLocation(db, city, state, country, pincode);

            db.Hubs.Add(new Hub
            {
                HubId = Guid.NewGuid(),
                HubName = normalizedHubName,
                LocationId = location.LocationId,
                Location = location,
                Capacity = capacity,
            });

            return;
        }

        hub.HubName = normalizedHubName;
        hub.Capacity = capacity;

        if (hub.Location is null)
        {
            var location = FindOrCreateLocation(db, city, state, country, pincode);
            hub.LocationId = location.LocationId;
            hub.Location = location;
        }
        else
        {
            hub.Location.City = city.Trim();
            hub.Location.State = state.Trim();
            hub.Location.Country = country.Trim();
            hub.Location.Pincode = pincode.Trim();
        }
    }

    private static Location FindOrCreateLocation(
        AdminDbContext db,
        string city,
        string state,
        string country,
        string pincode)
    {
        var normalizedCity = city.Trim();
        var normalizedState = state.Trim();
        var normalizedCountry = country.Trim();
        var normalizedPincode = pincode.Trim();

        var existing = db.Locations.FirstOrDefault(l =>
            l.City.ToLower() == normalizedCity.ToLower() &&
            l.State.ToLower() == normalizedState.ToLower() &&
            l.Country.ToLower() == normalizedCountry.ToLower() &&
            l.Pincode == normalizedPincode);

        if (existing is not null) return existing;

        var location = new Location
        {
            LocationId = Guid.NewGuid(),
            City = normalizedCity,
            State = normalizedState,
            Country = normalizedCountry,
            Pincode = normalizedPincode,
        };

        db.Locations.Add(location);
        return location;
    }
}
