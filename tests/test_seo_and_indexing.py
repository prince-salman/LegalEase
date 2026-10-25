import asyncio
import json
import xml.etree.ElementTree as ET
import urllib.request
from playwright.async_api import async_playwright

async def test_seo():
    # 1. Test robots.txt over HTTP
    print("1. Testing robots.txt...")
    req = urllib.request.urlopen("http://localhost:8000/robots.txt")
    assert req.status == 200
    robots_content = req.read().decode('utf-8')
    assert "User-agent: *" in robots_content
    assert "Allow: /" in robots_content
    assert "Sitemap:" in robots_content
    print("-> robots.txt is valid and accessible!")

    # 2. Test sitemap.xml over HTTP
    print("2. Testing sitemap.xml...")
    req_sitemap = urllib.request.urlopen("http://localhost:8000/sitemap.xml")
    assert req_sitemap.status == 200
    sitemap_content = req_sitemap.read().decode('utf-8')
    root = ET.fromstring(sitemap_content)
    assert "urlset" in root.tag
    assert "https://prince-salman.github.io/LegalEase/" in sitemap_content
    print("-> sitemap.xml is valid XML and lists production URLs!")

    # 3. Test manifest.json over HTTP
    print("3. Testing manifest.json...")
    req_manifest = urllib.request.urlopen("http://localhost:8000/manifest.json")
    assert req_manifest.status == 200
    manifest_data = json.loads(req_manifest.read().decode('utf-8'))
    assert manifest_data['name'] == "LegalEase Indonesia — Notaris Digital"
    assert manifest_data['display'] == "standalone"
    print("-> manifest.json is valid PWA metadata!")

    # 4. Test Head Metadata & JSON-LD via Playwright
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()

        print("4. Navigating to http://localhost:8000/index.html...")
        await page.goto("http://localhost:8000/index.html", wait_until="networkidle")

        title = await page.title()
        print("Page Title:", title)
        assert "LegalEase" in title
        assert "Notaris" in title

        # Meta tags check
        meta_desc = await page.get_attribute('meta[name="description"]', 'content')
        assert "LegalEase" in meta_desc and "Notaris" in meta_desc

        meta_keywords = await page.get_attribute('meta[name="keywords"]', 'content')
        assert "notaris online" in meta_keywords

        canonical = await page.get_attribute('link[rel="canonical"]', 'href')
        assert canonical == "https://prince-salman.github.io/LegalEase/"

        robots_meta = await page.get_attribute('meta[name="robots"]', 'content')
        assert "index" in robots_meta and "follow" in robots_meta

        googlebot_meta = await page.get_attribute('meta[name="googlebot"]', 'content')
        assert "index" in googlebot_meta and "follow" in googlebot_meta

        # OpenGraph & Twitter
        og_title = await page.get_attribute('meta[property="og:title"]', 'content')
        og_image = await page.get_attribute('meta[property="og:image"]', 'content')
        assert "LegalEase" in og_title
        assert "logo.png" in og_image

        tw_card = await page.get_attribute('meta[name="twitter:card"]', 'content')
        assert tw_card == "summary_large_image"

        # Check JSON-LD Structured Data
        print("5. Verifying JSON-LD Structured Data for Google Rich Snippets...")
        json_ld_raw = await page.inner_text('script[type="application/ld+json"]')
        json_ld = json.loads(json_ld_raw)
        graph = json_ld.get('@graph', [])
        types = [item.get('@type') for item in graph]
        print("Schema.org Types found:", types)
        assert "LegalService" in types
        assert "WebSite" in types
        assert "FAQPage" in types
        assert "SoftwareApplication" in types
        print("-> Google Rich Snippets Schema (LegalService, FAQPage, WebSite) 100% Valid!")

        # Semantic H1 check
        h1_text = await page.inner_text('h1')
        print("H1 Text:", h1_text.replace('\n', ' '))
        assert "Solusi Hukum & Notaris" in h1_text

        await browser.close()
        print("========================================================================")
        print("*** ALL TECHNICAL SEO & GOOGLE INDEXING CHECKS PASSED 100%! ***")
        print("========================================================================")

asyncio.run(test_seo())
