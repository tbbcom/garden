# Posting and editing on the static site

Every page is a file in this repo. Commit a change to `main` and **Deploy www** publishes it in about a minute.

## Edit a post
1. On GitHub, open `site/content/posts/YYYY/MM/slug.html` (pages: `site/content/pages/slug.html`).
2. Click the pencil icon, edit, then **Commit changes**.
3. Change the `updated:` date in the front matter when the edit is meaningful (it shows as "Updated" and tells Google).

## New post
Create `site/content/posts/2026/11/your-slug.html`. The folder and file name are the URL: `/2026/11/your-slug.html`.

```
---
title: How to Grow Spinach: Planting, Care and Harvest
description: One sentence, 140–155 characters, that answers the search and makes people click.
date: 2026-11-09T08:00:00+08:00
updated: 2026-11-09T08:00:00+08:00
hub: grow-food
image: /images/how-to-grow-spinach/featured.webp
imageAlt: What the featured image shows
author: Fadzilla
draft: true
---
<p>The direct answer first…</p>
<h2>…</h2>
```

- `hub`: one of `grow-food`, `garden-design`, `soil-compost`, `pests-weeds`, `houseplants`, `home-diy`.
- `draft: true` shows the post on preview.homegardenlot.com only. Delete the line to publish.
- The featured image (`image` + `imageAlt`) opens the post automatically. Notes inside `<!-- -->` (image briefs, reminders) never appear on the page.
- The table of contents (before the first H2), FAQ schema (from `.hgl-faq`), related guides, breadcrumbs, schema, sitemap, feed and search are added automatically.

## Images
1. Make the image (prompts are in each post brief), export **WebP**, 1200 px wide, under ~150 KB (squoosh.app is free).
2. On GitHub: **Add file → Upload files** into `site/images/<post-slug>/` (type the folder name in the path box), commit.
3. Use it in the post: `<img src="/images/<post-slug>/featured.webp" alt="What the picture shows">`
4. For the featured image (cards, Pinterest, Google Discover, social), also set `image:` in the front matter to the same path.

The build adds width/height (no layout shift) and lazy loading, and **fails** if an image is missing or has no `alt`, so a typo never reaches the live site.
AI illustrations: say so in the caption or alt (our Disclaimer promises this), never present them as real results.
