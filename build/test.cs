#!/usr/bin/env -S dotnet --
#:property NoWarn=SA1400,SA1503,SA1519,SA1116,SA1117,SA1122,SA1649,IDE0008,IDE0011,IDE0040,SA1500

#nullable enable

using System.Diagnostics;

try
{
    if (args.Length == 0 || args[0] is "help" or "-h" or "--help")
    {
        Help();
        return 0;
    }

    var command = args[0];
    var options = Options.Parse(args[1..]);
    return command switch
    {
        "e2e" => await RunE2e(options),
        "report" => await ShowReport(options),
        _ => throw new ArgumentException($"Unknown command '{command}'. Run with 'help'.")
    };
}
catch (Exception error)
{
    Console.Error.WriteLine($"ERROR: {error.Message}");
    return 1;
}

static void Help()
{
    var root = FindRepositoryRoot();
    Console.WriteLine(File.ReadAllText(Path.Combine(root, "build", "test-help.md")));
}

static async Task<int> RunE2e(Options options)
{
    options.Validate("e2e", "lane");
    var lanes = options.Get("lane", "all") switch
    {
        "v17" => new[] { "v17" },
        "v18" => new[] { "v18" },
        "all" => new[] { "v17", "v18" },
        var lane => throw new ArgumentException($"--lane must be v17, v18 or all (got '{lane}').")
    };

    var root = FindRepositoryRoot();
    var client = Path.Combine(root, "src", "Articulate.Web", "Client");
    var cli = Path.Combine(client, "node_modules", "@playwright", "test", "cli.js");
    RequireFile(cli, "Playwright is not installed. Install the Client dependencies first (see src/Articulate.Web/Client/e2e/README.md).");

    foreach (var lane in lanes)
    {
        var port = lane == "v17" ? "19443" : "19444";
        var psi = new ProcessStartInfo("node") { WorkingDirectory = client, UseShellExecute = false };
        psi.ArgumentList.Add(cli);
        psi.ArgumentList.Add("test");
        psi.ArgumentList.Add("--config");
        psi.ArgumentList.Add("playwright.config.ts");
        psi.Environment["ARTICULATE_E2E_BASE_URL"] = $"https://localhost:{port}";
        psi.Environment["PLAYWRIGHT_HTML_OUTPUT_DIR"] = Path.Combine(client, $"e2e-report-{lane}");
        psi.Environment["PLAYWRIGHT_OUTPUT_DIR"] = Path.Combine(client, $"e2e-results-{lane}");
        Console.WriteLine($"E2E {lane}: https://localhost:{port}");
        using var process = Process.Start(psi) ?? throw new InvalidOperationException("Could not start Node.");
        await process.WaitForExitAsync();
        if (process.ExitCode != 0) return process.ExitCode;
    }
    return 0;
}

static async Task<int> ShowReport(Options options)
{
    options.Validate("report", "lane");
    var lane = options.Get("lane") ?? throw new ArgumentException("report requires --lane v17 or v18.");
    if (lane is not ("v17" or "v18")) throw new ArgumentException("--lane must be v17 or v18.");
    var root = FindRepositoryRoot();
    var client = Path.Combine(root, "src", "Articulate.Web", "Client");
    var report = Path.Combine(client, $"e2e-report-{lane}");
    RequireFile(Path.Combine(report, "index.html"), $"No {lane} HTML report exists at '{report}'. Run 'e2e --lane {lane}' first.");
    var cli = Path.Combine(client, "node_modules", "@playwright", "test", "cli.js");
    RequireFile(cli, "Playwright is not installed. Install the Client dependencies first (see src/Articulate.Web/Client/e2e/README.md).");

    var psi = new ProcessStartInfo("node") { WorkingDirectory = client, UseShellExecute = false };
    psi.ArgumentList.Add(cli);
    psi.ArgumentList.Add("show-report");
    psi.ArgumentList.Add(report);
    psi.ArgumentList.Add("--host");
    psi.ArgumentList.Add("127.0.0.1");
    psi.ArgumentList.Add("--port");
    psi.ArgumentList.Add("0");
    psi.Environment["PLAYWRIGHT_HTML_OUTPUT_DIR"] = report;
    Console.WriteLine($"Starting {lane} report server (Ctrl+C to stop). Playwright prints the actual local URL.");
    using var process = Process.Start(psi) ?? throw new InvalidOperationException("Could not start Node.");
    await process.WaitForExitAsync();
    return process.ExitCode;
}

static string FindRepositoryRoot()
{
    for (var directory = new DirectoryInfo(Environment.CurrentDirectory); directory is not null; directory = directory.Parent)
        if (File.Exists(Path.Combine(directory.FullName, "build", "test.cs"))) return directory.FullName;
    throw new DirectoryNotFoundException("Run this command from the repository or one of its subdirectories.");
}

static void RequireFile(string path, string message)
{
    if (!File.Exists(path)) throw new FileNotFoundException(message, path);
}

sealed class Options
{
    private readonly Dictionary<string, string?> values;
    private Options(Dictionary<string, string?> values) => this.values = values;

    public static Options Parse(string[] args)
    {
        var values = new Dictionary<string, string?>();
        for (var i = 0; i < args.Length; i++)
        {
            var key = args[i];
            if (!key.StartsWith("--", StringComparison.Ordinal)) throw new ArgumentException($"Unexpected argument '{key}'.");
            key = key[2..];
            if (!values.TryAdd(key, null)) throw new ArgumentException($"Duplicate option '--{key}'.");
            if (i + 1 >= args.Length || args[i + 1].StartsWith("--", StringComparison.Ordinal))
                throw new ArgumentException($"Option '--{key}' requires a value.");
            values[key] = args[++i];
        }
        return new Options(values);
    }

    public void Validate(string command, params string[] allowed)
    {
        var unknown = values.Keys.Except(allowed, StringComparer.Ordinal).FirstOrDefault();
        if (unknown is not null) throw new ArgumentException($"Unknown option '--{unknown}' for {command}.");
    }

    public string? Get(string key, string? fallback = null) => values.TryGetValue(key, out var value) ? value : fallback;
}
