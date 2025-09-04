using Umbraco.Cms.Infrastructure.Migrations;

namespace Articulate.Migrations.Upgrade;

// TODO: Why are Tags and Categories delimited by null?: '{"group":"ArticulateTags","storageType":"Json","delimiter":"\u0000"}
// TODO: Check Editor start node for correct guid { .. "startNodeId":"d923fffc-e62f-4fe4-8762-b83bb8d40df1" .. }
// TODO: Do Tags and Categories still need ArticulateTagRepository or can use core from Umbraco?

/// <summary>
/// Represents the Articulate migration plan.
/// </summary>
/// <seealso cref="Umbraco.Cms.Infrastructure.Migrations.MigrationPlan" />
public sealed class ArticulatePlan : MigrationPlan
{
    /// <summary>
    /// Initializes a new instance of the <see cref="ArticulatePlan" /> class.
    /// </summary>
    public ArticulatePlan()
        : base(ArticulateConstants.Migration.ArticulatePackageMigrationPlan)
    {

        From(InitialState);
        DefinePlan();
    }



    private void DefinePlan()
    {
        To<Articulate.Migrations.Upgrade.V_6_0_0.MigrateArticulateRichText>("{5B6B5B4C-F79A-4CC7-9D77-5F0326BD94FE}");
        // To<Articulate.Migrations.Upgrade.V_6_0_0.MigrateImageCropperToJson>("{F21DA998-30EF-4E16-86EA-97A212DE509F}");
    }
}
