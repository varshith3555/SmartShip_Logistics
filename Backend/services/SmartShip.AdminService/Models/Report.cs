namespace SmartShip.AdminService.Models;

public class Report
{
    public Guid ReportId { get; set; }
    public string ReportType { get; set; } = string.Empty;
    public DateTime GeneratedAt { get; set; }
    public string DataJson { get; set; } = string.Empty; // Storing aggregate metrics
}
