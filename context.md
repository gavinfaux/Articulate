# Code Context

## Files Retrieved

1. `G:/Articulate-18/src/Articulate.Tests/Integration/ArticulateFixtureIntegrationTests.cs:1-53` - existing real Umbraco integration fixture; already creates a Blog node, copies BlogML into `ArticulateTempFileSystem`, imports it, and asserts imported counts/content.
2. `G:/Articulate-18/src/Articulate.Tests/Articulate.Tests.csproj:1-53` - test project references `Umbraco.Cms.Tests.Integration`, copies the BlogML fixture, and is otherwise ready for the integration test.
3. `G:/Articulate-18/src/Articulate.Tests/Smoke/IntegrationProjectSmokeTests.cs:1-27` - confirms the integration host currently boots with `Database=None`; it is not a database test.
4. `G:/Articulate-18/src/Articulate.Tests/CustomGlobalSetupTeardown.cs:1-21` - invokes Umbraco's `GlobalSetupTeardown`; do not duplicate lifecycle setup.
5. `G:/Articulate-18/src/Articulate.Tests/appsettings.Tests.json:1` - empty; database selection comes from Umbraco integration defaults/configuration or environment.
6. `E:/ext/Umbraco-CMS/tests/Umbraco.Tests.Integration/Testing/UmbracoIntegrationTest.cs:37-130` - host setup calls `UseTestDatabase` before start and exposes DI services.
7. `E:/ext/Umbraco-CMS/tests/Umbraco.Tests.Integration/Testing/UmbracoIntegrationTestBase.cs:114-191` - database selection and per-fixture schema lifecycle; `NewSchemaPerFixture` is the appropriate isolation mode.
8. `E:/ext/Umbraco-CMS/tests/Umbraco.Tests.Integration/Testing/TestDatabaseFactory.cs:13-38` - `Sqlite` selects Umbraco's in-memory SQLite database implementation; SQL Server/Docker is optional machinery.
9. `E:/ext/Umbraco-CMS/tests/Umbraco.Tests.Integration/Testing/SqliteTestDatabase.cs:20-155` - SQLite uses shared in-memory connections, prepares schema databases, and detaches/recycles them.
10. `G:/Articulate-18/docker/src/Services/ArticulateHarnessFixtureController.cs:1-27` - authenticated Docker-only endpoint invoking a separate harness fixture.
11. `G:/Articulate-18/docker/src/Services/ArticulateHarnessPermissionsFixture.cs:1-~240` - Docker harness permissions fixture; depends on an already imported BlogML archive and creates media/content/users/permissions.

## Key Code

The existing test is already the smallest viable real fixture test in substance:

```csharp
[UmbracoTest(Database = UmbracoTestOptions.Database.NewSchemaPerFixture)]
public sealed class ArticulateFixtureIntegrationTests : UmbracoIntegrationTest
```

It resolves the real `IUserService`, `IContentTypeService`, `IContentService`, `ArticulateTempFileSystem`, and `BlogMlImporter` from the host; creates/saves an Articulate root; imports `Fixtures/blogml-fixture.xml`; and asserts `Completed`, 2 authors, 3 posts, and author descendants. This is materially stronger than a mock test and already exercises Umbraco schema, Articulate registrations/migrations, persistence, and importer behavior.

Umbraco's machinery selects SQLite through `Tests:Database:DatabaseType = Sqlite` and creates the schema through `SqliteTestDatabase`. `NewSchemaPerFixture` attaches one prepared schema database for the class and detaches it at fixture teardown. No custom Docker, SQL Server, WebApplicationFactory, or database fixture is needed.

## Architecture

NUnit starts the global Umbraco test setup. `UmbracoIntegrationTest.Setup` builds an Umbraco host, calls `UseTestDatabase`, then starts the host. The integration attribute selects a schema-per-fixture database; the package's `TestDatabaseFactory` supplies an in-memory SQLite implementation. Articulate's package project reference and service registration make the importer and temp filesystem resolvable from DI. The copied XML is read from the test output directory.

## Findings / Recommendation

- **No blocker (existing test):** `ArticulateFixtureIntegrationTests` already implements the requested real SQLite Articulate fixture. Do not add another fixture class or custom setup. If it is failing only because configuration does not select SQLite, set the test run's `Tests__Database__DatabaseType=Sqlite` (and use the Umbraco package's normal SQLite defaults); do not build Docker machinery.
- **Low severity:** `appsettings.Tests.json` is empty, so SQLite selection is implicit rather than documented in-repo. Verify the actual test command/environment before changing it; adding config is only needed if the package default is not SQLite in the targeted lane.
- **Medium severity / residual:** The test asserts import counts and names but not the archive/post publication state or representative property values. That is sufficient for a smallest smoke fixture; add one persisted/published assertion only if the bug under test concerns publishing or property mapping.
- **Docker deletion:** Do **not** delete `docker/src/Services/ArticulateHarnessFixtureController.cs` or `docker/src/Services/ArticulateHarnessPermissionsFixture.cs` merely because the SQLite test exists. They are separate authenticated Docker/e2e permissions machinery and the permissions fixture explicitly consumes the imported archive. They can be deleted only if the Docker harness permission workflow and its callers are intentionally retired. The Umbraco SQL Server Docker cheat-sheet is upstream package documentation, not repository machinery to remove.
- **What can be avoided:** Any proposed custom Docker Compose database, SQL Server container, test Web host, fixture seed endpoint, or duplicate teardown around `ArticulateFixtureIntegrationTests` is unnecessary overhead.

## Start Here

Open `G:/Articulate-18/src/Articulate.Tests/Integration/ArticulateFixtureIntegrationTests.cs` first. It is already the target implementation; next verify the test runner resolves `Tests:Database:DatabaseType` to SQLite and runs this class.

## Validation

Read-only inspection only; no files other than this report were changed and no tests were run.

## Acceptance report

```acceptance-report
{
  "criteriaSatisfied": [
    {
      "id": "criterion-1",
      "status": "satisfied",
      "evidence": "Concrete findings with severity and exact paths are listed above; existing test and upstream SQLite lifecycle are traced end to end."
    }
  ],
  "changedFiles": ["G:/Articulate-18/context.md"],
  "testsAddedOrUpdated": [],
  "commandsRun": [],
  "validationOutput": ["Read-only inspection completed; no test execution requested or performed."],
  "residualRisks": ["SQLite selection is implicit because appsettings.Tests.json is empty; verify the runner/package default or explicitly set Tests__Database__DatabaseType=Sqlite.", "Docker harness fixture remains required for its separate permissions/e2e workflow."],
  "noStagedFiles": true,
  "diffSummary": "No source changes; inspection report only.",
  "reviewFindings": ["low: G:/Articulate-18/src/Articulate.Tests/appsettings.Tests.json:1 - SQLite database selection is not documented in project config.", "no blockers: existing integration fixture is already real Umbraco/SQLite-capable."],
  "manualNotes": "The smallest viable implementation is already present; avoid duplicate fixture and Docker database work."
}
```
