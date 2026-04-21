import { test, expect } from '@playwright/test';

test.describe('Relay Platform Smoke Tests', () => {
  test('homepage should load and show the hero section', async ({ page }) => {
    await page.goto('/');
    
    // Check for the main headline in HeroSection
    const headline = page.locator('h1');
    await expect(headline).toContainText(/Where student-athletes meet to\s*network/i);
    
    // Check for login and signup buttons in the Hero
    const loginLink = page.getByRole('link', { name: /log in/i }).first();
    const signupLink = page.getByRole('link', { name: /sign up to start connecting/i }).first();
    
    await expect(loginLink).toBeVisible();
    await expect(signupLink).toBeVisible();
  });

  test('login page should be accessible', async ({ page }) => {
    await page.goto('/login');
    await expect(page).toHaveURL(/.*login/);
    // Button is physically present even if disabled by captcha
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
  });

  test('signup page should be accessible', async ({ page }) => {
    await page.goto('/signup');
    await expect(page).toHaveURL(/.*signup/);
    await expect(page.getByRole('button', { name: /create account/i })).toBeVisible();
  });
});
