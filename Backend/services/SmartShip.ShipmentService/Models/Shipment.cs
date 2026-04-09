namespace SmartShip.ShipmentService.Models;

public class Shipment
{
    public Guid ShipmentId { get; set; }
    public string TrackingNumber { get; set; } = string.Empty;
    public Guid UserId { get; set; }
    public Guid SenderAddressId { get; set; }
    public Guid ReceiverAddressId { get; set; }
    public string HubId { get; set; } = string.Empty;
    public string Status { get; set; } = "Draft"; // Draft, Booked, PickedUp, InTransit, OutForDelivery, Delivered
    public decimal TotalWeight { get; set; }
    public decimal Price { get; set; }
    public DateTime CreatedAt { get; set; }

    public Address SenderAddress { get; set; } = null!;
    public Address ReceiverAddress { get; set; } = null!;
    public ICollection<ShipmentItem> Items { get; set; } = new List<ShipmentItem>();
    public PickupDetails? PickupDetails { get; set; }
    public Payment? Payment { get; set; }
}
