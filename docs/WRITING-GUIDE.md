# Writing guide: homegardenlot.com posts

Every file in `content/posts/` follows this guide. The reference post is `content/posts/how-much-mulch-do-i-need.html`: match its structure, tone and quality.

**Audience:** US homeowners and home gardeners (global English second). US units first (feet, inches, cubic yards, °F, lb, $), metric in brackets where useful.
**Voice:** practical, specific, friendly expert. Short paragraphs (2–4 sentences). No fluff intros, no "In today's world…", no "In conclusion".

---

## 1. File format

```html
---
title: Primary Keyword Phrase: Specific Benefit (≤ 65 characters)
labels: One Label
description: 150–160 characters, primary keyword in the first 60, states the answer or benefit.
---
<!-- BEFORE PUBLISHING … (copy the 4-step block from the reference post, with this post's slug) -->
<!-- IMAGE BRIEF … (section 5) -->
…post HTML…
```

- **File name** = the slug in `content/PLAN.md` = the Blogger permalink.
- **Exactly one label**, taken from the PLAN row (Blogger sorts labels A–Z; the theme uses the first one for breadcrumbs and related posts).
- Body is plain HTML. No `<h1>` (the theme prints the title), no inline styles, no `<script>`, no external images, no shortcodes like `{getToc}` (the theme builds the table of contents itself).

## 2. Structure (in this order)

1. **Quick answer box**: 40–60 words that fully answer the main query, with the key number in bold. This targets the featured snippet and Google AI Overviews.
   ```html
   <div class="hgl-answer"><span class="hgl-answer__label">Quick answer</span><p>…</p></div>
   ```
2. **Intro**: 2 short paragraphs on who this is for and what they'll be able to do. Link the matching calculator once here.
3. **Key takeaways**: 4–5 bullets with concrete numbers (`<div class="hgl-takeaways">`).
4. **Body**: 5–8 H2 sections, **phrased as the questions people actually search** ("How long should you water…?", "When is the best time to…?"). H3 for steps or sub-points. At least:
   - one **comparison or reference table** (`<table>` with `<thead>`), with real, checkable numbers;
   - one **step-by-step** section (numbered `<ol>` or H3 steps);
   - one **tool CTA box** linking the PLAN row's calculator:
     ```html
     <div class="hgl-tool-cta"><span>🧮</span><p>… <a href="/p/…">descriptive anchor</a> …</p></div>
     ```
   - one **warning or common-mistakes** section (`<div class="hgl-warning">` or a numbered list).
5. **Experience slot**: an HTML comment where the owner adds first-hand detail:
   `<!-- ADD YOUR EXPERIENCE: 1–3 sentences about … (what you did, measured, paid or would change) -->`
   Also 1–2 `<!-- ADD YOUR PHOTO: … Alt: "…" -->` comments at natural spots, plus the inline-image markers from the image brief.
6. **FAQ**: 4–6 questions in `<div class="hgl-faq"><details>…</details></div>` (first one `open="open"`). Answers 1–3 sentences, self-contained (each must make sense quoted alone by an AI answer engine). **Do not repeat FAQ questions already used in other posts or on the calculator pages.**
7. **Bottom line**: one short H2 paragraph restating the answer + calculator link.
8. **Related links**: 2–3 links, either to other posts in this plan (by planned slug, e.g. `/2026/11/how-deep-should-mulch-be.html` is unknown, so link **tools and pages only**, never guessed post URLs) or to `/p/…` tool pages.
9. **Sources** (`<div class="hgl-sources">`): name real authorities only (university extension services, USDA, EPA, manufacturer guidance, ISA, etc.) **without inventing URLs**. End with `<em>Last reviewed: Month YYYY.</em>`

**Length:** 1,500–2,200 words. Longer only if the topic truly needs it.

## 3. Accuracy rules (non-negotiable)

- **Compute every number** (areas, volumes, rates, conversions, costs) with a quick script before writing it. Rounding must be stated ("about", "round up").
- Rates, timings and temperatures must match mainstream US extension guidance. When advice varies by region or grass type, say so and give the range by USDA zone or grass type.
- Prices are always labeled as examples or typical US ranges, never as exact quotes.
- **Never invent:** first-hand experiences, test results, quotes, statistics, studies, reviews, ratings, credentials or URLs. First-hand content comes only from the owner via the `ADD YOUR EXPERIENCE` slot.
- No medical, legal or pesticide-dosage advice beyond "follow the product label".

## 4. SEO / AEO / LLM checklist (each post)

- Primary keyword in: title (front), description (first 60 chars), quick answer, first paragraph, one H2.
- 2–4 secondary/long-tail phrasings used naturally in H2s and FAQ (PAA-style).
- Internal links: calculator ≥ 2 times with descriptive anchors (never "click here"), plus 2–3 other `/p/` tools.
- Tables and lists carry the facts (easy for AI answers to extract and cite).
- No keyword stuffing; read it aloud. Would a real gardener bookmark it?

## 5. Image brief (HTML comment at the top of every post)

AI images are **illustrations**. Never present them as the owner's garden or results. The owner's real photos go in the `ADD YOUR PHOTO` spots.

Each post has 3 images: **featured** (the first image in the post, which is also the LCP element), **Pinterest pin** (for Pinterest only, not inserted in the post) and **one inline** image.

```html
<!--
IMAGE BRIEF (generate, compress to WebP under 150 KB, then upload in the Blogger editor)

1. FEATURED: insert as the FIRST element of the post. 1200×675 (16:9)
   Filename: <primary-keyword-slug>.webp
   Alt:      <what the image literally shows, includes the keyword naturally, ≤ 125 chars>
   Title:    <short human title, ≤ 60 chars>
   Prompt A (photorealistic): <subject, setting, US suburban context, season, light, lens, composition, mood> --ar 16:9 --style raw
   Prompt B (editorial overhead / lifestyle): <…> --ar 16:9
   Prompt C (clean flat illustration, no text): <…> --ar 16:9
   Negative (SD): text, watermark, logo, blurry, distorted hands, extra fingers, oversaturated

2. PINTEREST PIN: upload to Pinterest, linking to this post. 1000×1500 (2:3)
   Filename: <slug>-pin.webp
   Overlay text (add in Canva, free): "<5–8 word hook>"
   Prompt: <vertical composition with empty top third for text> --ar 2:3

3. INLINE: insert at the <!-- INLINE IMAGE --> marker. 1200×800 (3:2)
   Filename: <descriptive-slug>.webp
   Alt / Title: …
   Prompt: <…> --ar 3:2
-->
```

Rules:
- **Filenames:** lowercase, hyphens, 3–6 words, keyword first, `.webp`. No dates, no "image1".
- **Alt:** describe what is visible for a screen-reader user; keyword once if natural; no "image of".
- **Prompts:** 40–80 words each, hyper-descriptive (subject, materials, plants that suit the US season, camera/lens, light, color palette, composition). **No text inside AI images** (models garble it); text overlays are added in Canva. Variation A must be realistic enough to pass as a stock photo but must not depict a specific real brand or person.
- Put `<!-- INLINE IMAGE -->` in the body where the inline image belongs (usually after the step-by-step section).

## 6. Self-check before committing

- `DRY_RUN=1 node scripts/blogger-drafts.mjs <files>` parses every file.
- Every number verified; every table renders (thead/tbody); HTML tags balanced.
- Each post has: quick answer, takeaways, ≥ 1 table, steps, tool CTA, warning/mistakes, experience slot, image brief, 4–6 FAQs, sources + Last reviewed.
- One label; title ≤ 65 chars; description 150–160 chars.
- No two posts in the batch (or existing posts) target the same primary keyword.
