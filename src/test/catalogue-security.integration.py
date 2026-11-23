"""Live access regression tests. Requires temporary SECURITY-TEST-* products.

Mint a temporary test account and run with SECURITY_TEST_ROLE=admin, then
remove its admin grant and run with SECURITY_TEST_ROLE=regular. The admin
phase creates a temporary storage image; remove it after both phases.
Run: python3 src/test/catalogue-security.integration.py
"""
import asyncio
import os
from pathlib import Path
from playwright.async_api import async_playwright
from lovable_playwright_defaults import signed_in_context

ORIGIN = "http://localhost:8080"
IMAGE_PATH = "security-test-access.png"
PUBLIC_ID = "11111111-2222-4333-8444-555555555551"
PRIVATE_ID = "11111111-2222-4333-8444-555555555552"


async def client_call(page, expression, argument=None):
    return await page.evaluate(
        "async (arg) => { const { supabase } = await import('/src/integrations/supabase/client.ts'); "
        + expression + " }", argument,
    )


async def test_catalogue_access(page, expected):
    result = await client_call(page, """
      const { data, error } = await supabase.from('products').select('id')
        .in('id', arg);
      return { ids: (data ?? []).map(p => p.id).sort(), failed: Boolean(error) };
    """, [PUBLIC_ID, PRIVATE_ID])
    assert not result["failed"], "Catalogue query failed"
    assert result["ids"] == sorted(expected), "Product visibility rule failed"


async def test_direct_image_access(page, allowed):
    result = await client_call(page, """
      const { data, error } = await supabase.storage.from('product-images')
        .createSignedUrl(arg, 60);
      return { allowed: !error && Boolean(data?.signedUrl) };
    """, IMAGE_PATH)
    assert result["allowed"] == allowed, "Private image access rule failed"


async def main():
    role = os.environ.get("SECURITY_TEST_ROLE")
    assert role in ("admin", "regular"), "Choose the temporary test account role"
    async with async_playwright() as playwright:
        browser = await playwright.chromium.launch(headless=True)
        signed = await signed_in_context(browser)
        signed_page = await signed.new_page()
        await signed_page.goto(ORIGIN + "/admin", wait_until="networkidle")
        identity = await client_call(signed_page, """
          const { data } = await supabase.auth.getUser();
          return Boolean(data.user?.email?.startsWith('agent-test+'));
        """)
        assert identity, "Tests must use a temporary test account"
        if role == "admin":
            await signed_page.get_by_role("heading", name="Products", exact=True).wait_for()
            upload = await client_call(signed_page, """
              const bytes = Uint8Array.from(atob('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a5VQAAAAASUVORK5CYII='), c => c.charCodeAt(0));
              const { error } = await supabase.storage.from('product-images')
                .upload(arg.path, new Blob([bytes], {type:'image/png'}), {upsert:true});
              if (error) return false;
              const { error: updateError } = await supabase.from('products')
                .update({images:[arg.path]}).eq('id', arg.id);
              return !updateError;
            """, {"path": IMAGE_PATH, "id": PUBLIC_ID})
            assert upload, "Admin upload and product update must still work"
            await test_catalogue_access(signed_page, [PUBLIC_ID, PRIVATE_ID])
            await test_direct_image_access(signed_page, True)
        else:
            await signed_page.get_by_role("heading", name="Admin access required", exact=True).wait_for(timeout=30000)
            await test_catalogue_access(signed_page, [PUBLIC_ID])
            await test_direct_image_access(signed_page, False)
        public = await browser.new_context()
        page = await public.new_page()
        await page.goto(ORIGIN + "/shop", wait_until="networkidle")
        await test_catalogue_access(page, [PUBLIC_ID])
        await test_direct_image_access(page, False)
        await page.goto(ORIGIN + "/product/security-test-public-product", wait_until="networkidle")
        await page.get_by_role("heading", name="Security Test Public Product", exact=True).wait_for()
        image = page.get_by_role("img", name="Security Test Public Product", exact=True).first
        await image.evaluate("img => img.decode()")
        assert await image.evaluate("img => img.naturalWidth > 0"), "Approved storefront photo must render"
        screenshots = Path("/tmp/browser/catalogue-security")
        screenshots.mkdir(parents=True, exist_ok=True)
        await image.screenshot(path=str(screenshots / (role + "-approved-photo.png")))
        print(f"PASS: {role} catalogue and image permissions; approved storefront image loads")
        await browser.close()


asyncio.run(main())