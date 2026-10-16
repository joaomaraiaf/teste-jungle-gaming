import { type Page, expect } from '@playwright/test';
export interface NetworkRule {
  path: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  search?: string;
  delayMs?: number;
  gate?: string;
  status?: number;
  times?: number;
}
export async function networkRules(page: Page, rules: NetworkRule[]) {
  await expect(page.locator('main')).toBeVisible();
  expect(
    await page.evaluate(
      async (rules) =>
        (
          await fetch('/api/__mock/network', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ rules }),
          })
        ).status,
      rules
    )
  ).toBe(204);
}
export async function resetMocks(page: Page, scenario = 'default') {
  await expect(page.locator('main')).toBeVisible();
  expect(
    await page.evaluate(
      async (scenario) =>
        (
          await fetch('/api/__mock/reset', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ scenario }),
          })
        ).status,
      scenario
    )
  ).toBe(200);
}

export async function releaseNetwork(page: Page, gate: string) {
  expect(
    await page.evaluate(
      async (gate) =>
        (
          await fetch('/api/__mock/network/release', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ gate }),
          })
        ).status,
      gate
    )
  ).toBe(204);
}
