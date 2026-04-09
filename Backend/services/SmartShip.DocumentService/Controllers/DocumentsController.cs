using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SmartShip.DocumentService.Services;

namespace SmartShip.DocumentService.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class DocumentsController : ControllerBase
{
    private readonly IDocumentService _documentService;

    public DocumentsController(IDocumentService documentService)
    {
        _documentService = documentService;
    }

    private Guid GetUserId()
    {
        var claim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        return claim != null ? Guid.Parse(claim) : Guid.Empty;
    }

    // COMMON VALIDATION METHOD
    private IActionResult ValidateFile(IFormFile file)
    {
        if (file == null || file.Length == 0)
            return BadRequest("No file provided");

        return null!;
    }

    // GENERIC UPLOAD
    [HttpPost("upload")]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> UploadDocument([FromForm] Guid shipmentId, IFormFile file)
    {
        var validation = ValidateFile(file);
        if (validation != null) return validation;

        var doc = await _documentService.UploadDocumentAsync(shipmentId, GetUserId(), file, "General");
        return Ok(doc);
    }

    [HttpPost("upload-invoice")]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> UploadInvoice([FromForm] Guid shipmentId, IFormFile file)
    {
        var validation = ValidateFile(file);
        if (validation != null) return validation;

        var doc = await _documentService.UploadDocumentAsync(shipmentId, GetUserId(), file, "Invoice");
        return Ok(doc);
    }

    [HttpPost("upload-label")]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> UploadLabel([FromForm] Guid shipmentId, IFormFile file)
    {
        var validation = ValidateFile(file);
        if (validation != null) return validation;

        var doc = await _documentService.UploadDocumentAsync(shipmentId, GetUserId(), file, "Label");
        return Ok(doc);
    }

    [HttpPost("upload-customs")]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> UploadCustoms([FromForm] Guid shipmentId, IFormFile file)
    {
        var validation = ValidateFile(file);
        if (validation != null) return validation;

        var doc = await _documentService.UploadDocumentAsync(shipmentId, GetUserId(), file, "Customs");
        return Ok(doc);
    }

    // GET DOCUMENT
    [HttpGet("{id}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetDocumentById(Guid id)
    {
        var doc = await _documentService.GetDocumentAsync(id);
        if (doc == null) return NotFound("Document not found");

        return Ok(doc);
    }

    [HttpGet("shipment/{shipmentId}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetByShipment(Guid shipmentId)
    {
        var docs = await _documentService.GetShipmentDocumentsAsync(shipmentId);
        return Ok(docs);
    }

    [HttpGet("customer/{customerId}")]
    [Authorize(Roles = "ADMIN,CUSTOMER")]
    public async Task<IActionResult> GetByCustomer(Guid customerId)
    {
        var docs = await _documentService.GetCustomerDocumentsAsync(customerId);
        return Ok(docs);
    }

    // UPDATE
    [HttpPut("{id}")]
    [Authorize(Roles = "ADMIN")]
    public async Task<IActionResult> UpdateDocument(Guid id, [FromQuery] string fileType)
    {
        if (string.IsNullOrWhiteSpace(fileType))
            return BadRequest("FileType required");

        await _documentService.UpdateDocumentAsync(id, fileType);
        return NoContent();
    }

    // DELETE
    [HttpDelete("{id}")]
    [Authorize(Roles = "ADMIN")]
    public async Task<IActionResult> DeleteDocument(Guid id)
    {
        await _documentService.DeleteDocumentAsync(id);
        return Ok(new { message = "Deleted successfully" });
    }

    // DELIVERY PROOF
    [HttpPost("delivery-proof/{shipmentId}")]
    [Consumes("multipart/form-data")]
    [Authorize(Roles = "ADMIN")]
    public async Task<IActionResult> UploadDeliveryProof(Guid shipmentId, IFormFile image, IFormFile signature)
    {
        if (image == null || signature == null)
            return BadRequest("Missing image or signature");

        var proof = await _documentService.UploadDeliveryProofAsync(shipmentId, image, signature);
        return Ok(proof);
    }

    [HttpGet("delivery-proof/{shipmentId}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetDeliveryProof(Guid shipmentId)
    {
        var proof = await _documentService.GetDeliveryProofAsync(shipmentId);
        if (proof == null) return NotFound("Proof not found");

        return Ok(proof);
    }
}