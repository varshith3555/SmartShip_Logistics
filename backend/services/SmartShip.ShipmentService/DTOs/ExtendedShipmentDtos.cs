namespace SmartShip.ShipmentService.DTOs;

public class UpdateShipmentRequest
{
    public decimal TotalWeight { get; set; }
    // Other updatable fields as necessary
}

public class AddPackageRequest
{
    public string ItemName { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public decimal Weight { get; set; }
}

public class UpdatePackageRequest
{
    public string ItemName { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public decimal Weight { get; set; }
}

public class CalculateRateRequest
{
    public decimal TotalWeight { get; set; }
    public string OriginPincode { get; set; } = string.Empty;
    public string DestinationPincode { get; set; } = string.Empty;
}

public class CalculateRateResponse
{
    public decimal EstimatedPrice { get; set; }
}

public class ServiceTypeDto
{
    public string ServiceName { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public decimal BasePrice { get; set; }
}
