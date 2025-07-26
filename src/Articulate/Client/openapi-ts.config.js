import { defineConfig } from '@hey-api/openapi-ts';

export default defineConfig({
    logs: {
        level: 'debug',
    },
    input: 'http://localhost:44169/umbraco/swagger/articulate/swagger.json',
    output: {
      indexFile: false,
      path: 'src/api',
    },
    plugins: [
        {
            name: '@hey-api/client-fetch',
            bundle: false,
            exportFromIndex: true,
            throwOnError: true,
        },
        {
            name: '@hey-api/typescript',
            enums: 'typescript',
        },
        {
            name: '@hey-api/sdk',
            asClass: true,
        },
    ],
});

