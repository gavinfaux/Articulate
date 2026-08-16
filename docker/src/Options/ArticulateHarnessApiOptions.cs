namespace ArticulateDockerSite.Options
{
    /// <summary>
    /// Configuration for bootstrapping the Articulate harness API user and client credentials.
    /// </summary>
    public sealed class ArticulateHarnessApiOptions
    {
        /// <summary>
        /// The configuration section that maps to <see cref="ArticulateHarnessApiOptions"/>.
        /// </summary>
        public const string SectionName = "Articulate:Harness:Api";

        /// <summary>
        /// Gets or sets whether the bootstrap is enabled.
        /// </summary>
        public bool Enabled { get; set; }

        /// <summary>Gets or sets the client secret used by the harness API.</summary>
        public string? ClientSecret { get; set; }

    }
}
