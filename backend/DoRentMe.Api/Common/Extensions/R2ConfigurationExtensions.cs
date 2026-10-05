namespace DoRentMe.Api.Common.Extensions;

public static class R2ConfigurationExtensions
{
    private static readonly HashSet<string> Keys =
        ["R2_ACCOUNT_ID", "R2_ACCESS_KEY_ID", "R2_SECRET_ACCESS_KEY", "R2_BUCKET"];

    // Development only: reuse the asset uploader's local configuration.
    // Values already supplied by environment variables or user secrets win.
    public static void AddLocalR2Defaults(this ConfigurationManager configuration, string contentRoot)
    {
        for (var directory = new DirectoryInfo(contentRoot); directory != null; directory = directory.Parent)
        {
            var path = Path.Combine(directory.FullName, ".env.r2.local");
            if (!File.Exists(path)) continue;
            var defaults = new Dictionary<string, string?>();
            foreach (var line in File.ReadLines(path))
            {
                var text = line.Trim();
                if (text.Length == 0 || text.StartsWith('#')) continue;
                var separator = text.IndexOf('=');
                if (separator < 1) continue;
                var key = text[..separator].Trim();
                if (!Keys.Contains(key) || !string.IsNullOrWhiteSpace(configuration[key])) continue;
                var value = text[(separator + 1)..].Trim();
                if (value.Length >= 2 && ((value[0] == '"' && value[^1] == '"') || (value[0] == '\'' && value[^1] == '\'')))
                    value = value[1..^1];
                else
                {
                    var comment = value.IndexOf(" #", StringComparison.Ordinal);
                    if (comment >= 0) value = value[..comment].TrimEnd();
                }
                if (value.Length > 0) defaults[key] = value;
            }
            configuration.AddInMemoryCollection(defaults);
            return;
        }
    }
}
