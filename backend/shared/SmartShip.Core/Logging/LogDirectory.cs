using Microsoft.Extensions.Configuration;

namespace SmartShip.Core.Logging;

public static class LogDirectory
{
    private const string EnvVarName = "SMARTSHIP_LOG_DIR";

    public static string Resolve(IConfiguration configuration)
    {
        var configured = Environment.GetEnvironmentVariable(EnvVarName)
            ?? configuration["Serilog:LogDirectory"];

        if (!string.IsNullOrWhiteSpace(configured))
        {
            var full = Path.GetFullPath(configured);
            Directory.CreateDirectory(full);
            return full;
        }

        var baseDir = AppContext.BaseDirectory;
        var binSegment = $"{Path.DirectorySeparatorChar}bin{Path.DirectorySeparatorChar}";
        var idx = baseDir.IndexOf(binSegment, StringComparison.OrdinalIgnoreCase);

        // If we're running from /bin/... (common in local dev), store logs at the project root (outside bin).
        // Otherwise, store alongside the app.
        var root = idx > 0
            ? baseDir[..idx]
            : baseDir.TrimEnd(Path.DirectorySeparatorChar, Path.AltDirectorySeparatorChar);

        var logDir = Path.Combine(root, "logs");
        Directory.CreateDirectory(logDir);
        return logDir;
    }

    public static void MigrateLegacyBinLogs(string targetLogDir)
    {
        try
        {
            var oldDir = Path.Combine(AppContext.BaseDirectory, "logs");
            if (!Directory.Exists(oldDir)) return;

            var oldFull = Path.GetFullPath(oldDir).TrimEnd(Path.DirectorySeparatorChar, Path.AltDirectorySeparatorChar);
            var targetFull = Path.GetFullPath(targetLogDir).TrimEnd(Path.DirectorySeparatorChar, Path.AltDirectorySeparatorChar);
            if (string.Equals(oldFull, targetFull, StringComparison.OrdinalIgnoreCase)) return;

            foreach (var file in Directory.EnumerateFiles(oldDir, "*.txt"))
            {
                var name = Path.GetFileName(file);
                var dest = Path.Combine(targetLogDir, name);

                if (File.Exists(dest))
                {
                    var stamp = DateTime.UtcNow.ToString("yyyyMMddHHmmss");
                    var unique = $"{Path.GetFileNameWithoutExtension(name)}-{stamp}{Path.GetExtension(name)}";
                    dest = Path.Combine(targetLogDir, unique);
                }

                File.Move(file, dest);
            }

            // Best-effort cleanup; ignore failures.
            if (!Directory.EnumerateFileSystemEntries(oldDir).Any())
            {
                Directory.Delete(oldDir);
            }
        }
        catch
        {
            // Ignore migration errors.
        }
    }
}
