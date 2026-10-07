import { defineConfig } from '@playwright/test';

const baseURL = process.env.ARTICULATE_E2E_BASE_URL;
if (!baseURL || !/^https:\/\/localhost:(?:19443|19444)$/.test(baseURL)) {
  throw new Error('ARTICULATE_E2E_BASE_URL must target an isolated HTTPS localhost site on port 19443 or 19444');
}

const lane = baseURL.endsWith(':19443') ? 'v17' : 'v18';
const reportDirectory = process.env.PLAYWRIGHT_HTML_OUTPUT_DIR ?? `e2e-report-${lane}`;
const resultsDirectory = process.env.PLAYWRIGHT_OUTPUT_DIR ?? `e2e-results-${lane}`;

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [['list'], ['html', { outputFolder: reportDirectory, open: 'never' }]],
  outputDir: resultsDirectory,
  use: {
    baseURL,
    ignoreHTTPSErrors: true,
    extraHTTPHeaders: { Accept: 'text/html,application/rss+xml,application/xml,*/*' },
  },
});
