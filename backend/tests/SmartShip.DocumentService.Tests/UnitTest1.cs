using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Moq;
using SmartShip.DocumentService.Models;
using SmartShip.DocumentService.Repositories;
using DocumentServiceImpl = SmartShip.DocumentService.Services.DocumentService;

namespace SmartShip.DocumentService.Tests;

public class DocumentServiceTests
{
    [Test]
    public async Task UpdateDocumentAsync_WhenDocumentExists_UpdatesFileType()
    {
        var repo = new Mock<IDocumentRepository>(MockBehavior.Strict);
        var env = new Mock<IWebHostEnvironment>(MockBehavior.Strict);
        var logger = new Mock<ILogger<DocumentServiceImpl>>();

        var docId = Guid.NewGuid();
        var existing = new Document { DocumentId = docId, FileType = "OLD" };

        repo.Setup(r => r.GetDocumentAsync(docId)).ReturnsAsync(existing);
        Document? updated = null;
        repo.Setup(r => r.UpdateDocumentAsync(It.IsAny<Document>()))
            .Callback<Document>(d => updated = d)
            .Returns(Task.CompletedTask);

        env.SetupGet(e => e.WebRootPath).Returns(Path.Combine(Path.GetTempPath(), Guid.NewGuid().ToString("N")));

        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?> { ["AppSettings:BaseUrl"] = "" })
            .Build();

        var sut = new DocumentServiceImpl(repo.Object, env.Object, logger.Object, config);

        await sut.UpdateDocumentAsync(docId, "INVOICE");

        Assert.That(updated, Is.Not.Null);
        Assert.That(updated!.FileType, Is.EqualTo("INVOICE"));

        repo.VerifyAll();
    }

    [Test]
    public async Task UpdateDocumentAsync_WhenDocumentMissing_DoesNotUpdate()
    {
        var repo = new Mock<IDocumentRepository>(MockBehavior.Strict);
        var env = new Mock<IWebHostEnvironment>(MockBehavior.Strict);
        var logger = new Mock<ILogger<DocumentServiceImpl>>();

        var docId = Guid.NewGuid();
        repo.Setup(r => r.GetDocumentAsync(docId)).ReturnsAsync((Document?)null);
        env.SetupGet(e => e.WebRootPath).Returns(Path.Combine(Path.GetTempPath(), Guid.NewGuid().ToString("N")));

        var config = new ConfigurationBuilder().Build();

        var sut = new DocumentServiceImpl(repo.Object, env.Object, logger.Object, config);

        await sut.UpdateDocumentAsync(docId, "INVOICE");

        repo.Verify(r => r.GetDocumentAsync(docId), Times.Once);
        repo.Verify(r => r.UpdateDocumentAsync(It.IsAny<Document>()), Times.Never);
        repo.VerifyAll();
    }

    [Test]
    public async Task DeleteDocumentAsync_WhenDocumentExists_DeletesFileAndMetadata()
    {
        var repo = new Mock<IDocumentRepository>(MockBehavior.Strict);
        var env = new Mock<IWebHostEnvironment>(MockBehavior.Strict);
        var logger = new Mock<ILogger<DocumentServiceImpl>>();

        var docId = Guid.NewGuid();
        var webRoot = Path.Combine(Path.GetTempPath(), "smartship-doc-tests", Guid.NewGuid().ToString("N"));
        var relative = Path.Combine("uploads", "documents", "test.txt");
        var absolute = Path.Combine(webRoot, relative);

        Directory.CreateDirectory(Path.GetDirectoryName(absolute)!);
        await File.WriteAllTextAsync(absolute, "hello");

        env.SetupGet(e => e.WebRootPath).Returns(webRoot);

        var existing = new Document
        {
            DocumentId = docId,
            FileUrl = "/uploads/documents/test.txt",
            FileType = "ANY",
            FileName = "test.txt",
        };

        repo.Setup(r => r.GetDocumentAsync(docId)).ReturnsAsync(existing);
        repo.Setup(r => r.DeleteDocumentAsync(existing)).Returns(Task.CompletedTask);

        var config = new ConfigurationBuilder().Build();
        var sut = new DocumentServiceImpl(repo.Object, env.Object, logger.Object, config);

        await sut.DeleteDocumentAsync(docId);

        Assert.That(File.Exists(absolute), Is.False);

        repo.VerifyAll();
    }
}
