import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests/browser',
  outputDir: 'test-results',
  workers: 1,
  use: { baseURL: 'http://127.0.0.1:8787', channel: 'chrome', headless: true },
  webServer: {
    command:
      'node node_modules/wrangler/bin/wrangler.js dev --local --ip 127.0.0.1 --port 8787 --show-interactive-dev-session false',
    url: 'http://127.0.0.1:8787',
    reuseExistingServer: false,
    timeout: 60000,
    env: { WRANGLER_SEND_METRICS: 'false' },
  },
});
