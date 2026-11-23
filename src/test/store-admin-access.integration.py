"""Verify restored store-admin access using the explicitly selected browser session."""
import asyncio
from pathlib import Path
from playwright.async_api import async_playwright
from lovable_playwright_defaults import signed_in_context


async def main():
    async with async_playwright() as playwright:
        browser = await playwright.chromium.launch(headless=True)
        context = await signed_in_context(browser)
        page = await context.new_page()
        await page.goto("http://localhost:8080/admin", wait_until="networkidle")
        result = await page.evaluate("""async () => {
          const { supabase } = await import('/src/integrations/supabase/client.ts');
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) return { email: null, admin: false };
          const { data, error } = await supabase.rpc('has_role', {
            _user_id: user.id, _role: 'admin'
          });
          return { email: user.email, admin: !error && data === true };
        }""")
        assert result['email'] == 'manojenterprisesinfo@gmail.com', 'Wrong verification account'
        assert result['admin'] is True, 'Designated verified account must have admin access'
        await page.get_by_role('heading', name='Products', exact=True).wait_for()
        assert await page.get_by_role('button', name='Add product', exact=True).is_visible()
        assert await page.get_by_role('button', name='Import CSV', exact=True).is_enabled()
        assert await page.get_by_role('button', name='Edit Karam Safety Helmet', exact=True).is_visible()
        await page.get_by_role('button', name='Add product', exact=True).click()
        await page.get_by_role('heading', name='Add a new product', exact=True).wait_for()
        screenshots = Path('/tmp/browser/store-admin-access')
        screenshots.mkdir(parents=True, exist_ok=True)
        await page.screenshot(path=str(screenshots / 'admin-product-form.png'))
        print('PASS: designated admin role, saved catalogue, CSV import and product editor available')
        await browser.close()


asyncio.run(main())