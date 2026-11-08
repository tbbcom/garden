// Old URL → new URL for the static migration. Used by build.mjs (fallback pages) and cloudflare-rules.mjs (301s).
// Old URLs that moved (also served as Cloudflare 301s; see scripts/site/cloudflare-rules.mjs).
export const MOVED = {
  '/p/terms.html': '/p/terms-of-service.html',
  '/p/contact-us.html': '/p/contact.html',
  '/p/tools.html': '/tools/',
  // Links that were already broken on Blogger (renamed posts); 301s also recover any backlinks.
  '/2022/09/how-to-plant-garlic-at-home.html': '/2025/10/how-to-grow-garlic.html',
  '/2022/11/how-to-grow-watermelon-from-seed.html': '/2022/11/how-to-grow-watermelon.html',
  '/2022/10/how-to-grow-broccoli-from-seeds.html': '/2025/10/how-to-grow-broccoli.html',
  '/2022/09/how-to-plant-cabbage.html': '/2025/10/how-to-grow-cabbage.html',
  '/2022/11/best-tips-on-gardening-for-beginners.html': '/2025/10/gardening-for-beginners.html',
  '/2025/11/how-to-make-raised-garden-bed.html': '/2022/09/how-to-build-raised-bed-garden.html',
};
// Links to guides that were never published: keep the text, drop the link.
export const DEAD = new Set(['/2025/10/diy-subfloor-repair-guide.html', '/2025/10/how-to-install-lvp-flooring.html', '/2025/10/solid-vs-engineered-hardwood.html']);
// Tool-site pages merged into the blog's versions.
export const TOOL_MERGE = { '/about/': '/p/about.html', '/privacy/': '/p/privacy-policy.html', '/terms/': '/p/terms-of-service.html', '/contact/': '/p/contact.html' };

