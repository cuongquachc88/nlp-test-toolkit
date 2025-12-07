import { test, expect } from '@playwright/test';

test('Generated Test', async ({ page }) => {
    await page.goto('https://www.google.com');
    await page.waitForSelector('input[aria-label='Search']');
    await page.locator('input[aria-label='Search']').fill('playwright');
    // press: Submit the search
    await page.waitForSelector('#search');
    await expect(page.locator('title')).toContainText('playwright');
});