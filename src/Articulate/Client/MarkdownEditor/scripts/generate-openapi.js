import { createRequire } from 'module';
import path from 'path';

// --- Argument Parsing ---
const args = process.argv.slice(2);

const swaggerUrl = args[0];
const outputPath = args[1];
const includeTagsArg = args.find(arg => arg.startsWith('--includeTags'));

if (!swaggerUrl || !outputPath) {
  console.error('ERROR: Missing required arguments.');
  console.error('Usage: node generate-openapi.js <swaggerUrl> <outputPath> [--includeTags Tag1,Tag2]');
  process.exit(1);
}

// --- Dynamic Dependency Loading ---
// Use createRequire to load dependencies from the current project's node_modules.
const require = createRequire(import.meta.url);

const { createClient, defaultPlugins } = require('@hey-api/openapi-ts');
const chalk = require('chalk');
const fetch = require('node-fetch');

// Start notifying user we are generating the TypeScript client
console.log(chalk.green("Generating OpenAPI client..."));

const includeTags = includeTagsArg ? includeTagsArg.split('=')[1].split(',') : undefined;

// Needed to ignore self-signed certificates from running Umbraco on https on localhost
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

// Start checking to see if we can connect to the OpenAPI spec
console.log("Ensure your Umbraco instance is running");
console.log(`Fetching OpenAPI definition from ${chalk.yellow(swaggerUrl)}`);

fetch(swaggerUrl).then(async (response) => {
  if (!response.ok) {
    console.error(chalk.red(`ERROR: OpenAPI spec returned with a non OK (200) response: ${response.status} ${response.statusText}`));
    console.error(`The URL to your Umbraco instance may be wrong or the instance is not running`);
    console.error(`Please verify or change the URL in the ${chalk.yellow('package.json')} for the script ${chalk.yellow('generate-client')}`);
    console.error(`Or review back office logs, ${chalk.yellow('Swagger')} may not be able to generate a valid schema due to ${chalk.yellow('route conflicts or duplicate API attributes')}.`);
    process.exit(1);
  }

  console.log(`OpenAPI spec fetched successfully`);
  console.log(`Calling ${chalk.yellow('hey-api')} to generate TypeScript client`);

  const config = {
    input: {
      path: swaggerUrl,
    },
    output: {
      path: outputPath,
    },
    plugins: [
      ...defaultPlugins,
      '@hey-api/client-fetch',
      {
        name: '@hey-api/typescript',
        enums: 'typescript'
      },
      {
        name: '@hey-api/sdk',
        asClass: true
      }
    ],
  };

  if (includeTags) {
    config.input.filters = {
      tags: {
        include: includeTags,
      },
    };
  }

  await createClient(config);

  // Exit the process successfully
  process.exit(0);

})
  .catch(error => {
    console.error(`ERROR: Failed to connect to the OpenAPI spec: ${chalk.red(error.message)}`);
    console.error(`The URL to your Umbraco instance may be wrong or the instance is not running`);
    console.error(`Please verify or change the URL in the ${chalk.yellow('package.json')} for the script ${chalk.yellow('generate-client')}`);
    process.exit(1);
  });
