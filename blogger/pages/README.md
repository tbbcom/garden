# Site pages (Blogger static pages)

Paste-in HTML for the main site's trust pages. They use the theme's existing styles (`hgl-answer`, `hgl-note`, `hgl-sources`) and shortcodes (`{getToc}`, `{contactForm}`).

## How to publish (5 minutes per page)

1. Blogger → **Pages** → open the page (or **New page**).
2. Switch the editor to **HTML view**, delete everything, paste the file's contents. Fill anything marked ✏️, then delete the top `<!-- … -->` comment.
3. **Page settings → Search description**: paste the description from the file's comment.
4. **Publish** / **Update**. Keep existing pages (same URL), don't delete and recreate them.

| File | Title in Blogger | URL | Status |
|---|---|---|---|
| `about.html` | About | /p/about.html | Update existing. ✏️ Fill in the author section with true details |
| `contact.html` | Contact | /p/contact.html | Update existing |
| `privacy-policy.html` | Privacy Policy | /p/privacy-policy.html | Update existing |
| `disclaimer.html` | Disclaimer & Affiliate Disclosure | /p/disclaimer.html | Update existing (first save title "Disclaimer" if the URL isn't set yet) |
| `editorial-policy.html` | Editorial Policy | /p/editorial-policy.html | **New**: publish with exactly this title |
| `terms.html` | Terms of Use | /p/terms.html | **New**: publish titled **Terms** first (sets the URL), then rename to "Terms of Use" |

Blogger makes a new page's URL from its title the first time it's published, which is why `terms.html` is published as "Terms" first.

## Also do once (Blogger → Settings)
- **Title:** change "Home and Garden" to **Home Garden Lot**, so the site name, logo, footer and structured data all match. Google uses this to recognize your brand.
- **Description:** "Practical, tested guides and free calculators for growing food, caring for lawns and plants, and improving your home on a budget."
- **Privacy → Enable search engines:** On. **Crawlers and indexing → Custom robots header tags:** leave off unless needed.

## Keep these true
- If you add a newsletter, comment plugin, ad network or affiliate program, update `privacy-policy.html` and `disclaimer.html` **before** it goes live.
- When approved for Amazon Associates, uncomment the required sentence in `disclaimer.html`.
