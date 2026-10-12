import { defineConfig } from '@playwright/test';

const baseURL = process.env.ARTICULATE_E2E_BASE_URL;
const candidateProject = process.env.ARTICULATE_E2E_CANDIDATE_PROJECT;
const candidatePort = process.env.ARTICULATE_E2E_CANDIDATE_PORT;
const canonical = baseURL === 'https://localhost:19444';
const candidateMatch = /^https:\/\/localhost:(\d{1,5})$/.exec(baseURL ?? '');
const candidatePortIsValid = candidateMatch !== null && candidatePort === candidateMatch[1]
  && Number(candidatePort) >= 1024 && Number(candidatePort) <= 65535
  && candidatePort !== '19444';
const candidateIsValid = /^art_e2e_native_v18_[a-f0-9]{32}$/.test(candidateProject ?? '');

if (canonical) {
  if (candidateProject || candidatePort) throw new Error('Candidate settings cannot be combined with the manual E2E port');
} else if (!candidateIsValid || !candidatePortIsValid) {
  throw new Error('E2E requires the manual port 19444 or an owned native v18 candidate host');
}

const reportDirectory = process.env.PLAYWRIGHT_HTML_OUTPUT_DIR ?? 'e2e-report-v18';
const resultsDirectory = process.env.PLAYWRIGHT_OUTPUT_DIR ?? 'e2e-results-v18';

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
