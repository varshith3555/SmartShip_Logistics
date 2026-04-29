
using System.ComponentModel.DataAnnotations;

namespace SmartShip.AdminService.DTOs;

/// <summary>
/// Request payload for creating/updating locations.
/// </summary>
public class LocationDto
{
    [Required(ErrorMessage = "City is required")]
    public string City { get; set; } = string.Empty;
    [Required(ErrorMessage = "State is required")]
    public string State { get; set; } = string.Empty;
    [Required(ErrorMessage = "Country is required")]
    public string Country { get; set; } = string.Empty;
    [Required(ErrorMessage = "Pincode is required")]
    [StringLength(6, MinimumLength = 6, ErrorMessage = "Pincode must be 6 digits")]
    [RegularExpression(@"^\d{6}$", ErrorMessage = "Pincode must be 6 digits")]
    public string Pincode { get; set; } = string.Empty;
}
