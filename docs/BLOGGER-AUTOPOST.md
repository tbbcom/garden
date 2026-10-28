# Auto-draft posts from GitHub to Blogger, safely

**Flow:** write post in `content/posts/` → open a PR → merge → GitHub Action creates a **draft** in Blogger → you add real photos, the search description and the permalink → **you** click Publish.

Nothing is ever auto-published. That one rule removes almost every way a Blogger site gets locked.

---

## Why your other site got blocked (most likely causes)

| Symptom | Real cause | How this setup avoids it |
|---|---|---|
| Worked for ~7 days, then "invalid_grant" / stopped | OAuth consent screen left in **Testing**: Google kills refresh tokens after **7 days** | Step 3 below: set it to **In production** (free, no review needed for your own account) |
| Blog locked: "flagged as spam" / captcha on posting | Blogger's spam classifier: many posts published in a short burst, near-duplicate or spun text, link-heavy posts | Drafts only, max 5 per run, 8 s apart; you publish by hand, 3–4 per week |
| Worked through Zapier/IFTTT/Make, then stopped | Third-party apps hit shared quotas, change pricing or lose Google approval | Your own Google Cloud project + official Blogger API v3, $0 |
| Email-to-Blogger / browser bots broke | Unofficial methods break with any Google UI change | Official API only |

**The bigger, long-term risk is content, not tooling.** Google's *scaled content abuse* policy (since March 2024) targets sites that mass-produce unedited AI or templated pages. Rankings drop site-wide, and AdSense rejects such sites as "low value content". The pipeline is safe; what you push through it decides whether the site grows. The rules are in §5.

---

## 1. One-time setup (~20 min, free)

### 1. Google Cloud project
1. Go to <https://console.cloud.google.com/>, sign in with the **same Google account that owns the blog**.
2. **Select project → New project** → name it `homegardenlot-publisher` → Create.
3. **APIs & Services → Library** → search **Blogger API v3** → **Enable**.

### 2. OAuth consent screen
1. **APIs & Services → OAuth consent screen** (or "Google Auth Platform → Branding").
2. User type **External** → app name `HGL Publisher`, your email as support and developer contact → Save.
3. **Scopes / Data access**: add `https://www.googleapis.com/auth/blogger`. This is the only scope needed; never add Gmail/Drive scopes.

### 3. Publish the app ⚠️ the step that prevents the 7-day block
**Audience / OAuth consent screen → Publishing status → "Publish app" → In production.**
You may see "verification required". You can skip verification because only you will ever sign in. Google shows an "unverified app" warning once when you authorize; click **Advanced → Go to HGL Publisher (unsafe)**. That warning is about Google not having reviewed the app, and it's your own app.

### 4. OAuth client
1. **Credentials → Create credentials → OAuth client ID** → type **Web application**.
2. **Authorized redirect URIs** → add `https://developers.google.com/oauthplayground`.
3. Create, then copy the **Client ID** and **Client secret**.

### 5. Get the refresh token (works from a phone browser)
1. Open <https://developers.google.com/oauthplayground>.
2. ⚙️ (top right) → tick **Use your own OAuth credentials** → paste Client ID + secret.
3. Left box "Input your own scopes": `https://www.googleapis.com/auth/blogger` → **Authorize APIs** → choose the blog's account → Allow.
4. **Exchange authorization code for tokens** → copy the **Refresh token**.
5. ⚙️ → untick "Use your own OAuth credentials" afterwards (keeps the playground from holding your token).

### 6. Blog ID
Blogger dashboard → the URL contains `blogID=1234567890123456789`. Copy the number.

### 7. GitHub secrets
`tbbcom/garden` → **Settings → Secrets and variables → Actions → New repository secret**, four times:

| Name | Value |
|---|---|
| `BLOGGER_CLIENT_ID` | Client ID |
| `BLOGGER_CLIENT_SECRET` | Client secret |
| `BLOGGER_REFRESH_TOKEN` | Refresh token |
| `BLOGGER_BLOG_ID` | Blog ID |

Secrets are encrypted, hidden from logs, and not given to workflows triggered by forks. The workflow only runs on pushes to `main` and manual runs, never on pull requests, so outside contributors can't trigger it.

### 8. Test
**Actions → Blogger drafts → Run workflow** → file `content/posts/<your-post>.html`. A draft appears in Blogger → Posts.

---

## 2. Writing a post

```html
---
title: How Much Mulch Do I Need? Coverage Chart, Formula and Calculator
labels: Raised Beds & Soil, Mulch
description: 150–160 character search description (paste into Blogger by hand)
---
<div class="hgl-answer">…</div>
…
```

- File name = your planned permalink (`how-much-mulch-do-i-need.html`). The API can't set permalinks, so set it in the draft's **Permalink → Custom** before publishing.
- Files starting with `_` are ignored (`content/posts/_example.html` is the template).
- Editing the file again **updates the draft**. Once a post is live, the pipeline never touches it again; edit live posts in Blogger.
- Content is stored as plain HTML in Git, which gives you full version history and makes it portable to WordPress.

## 3. Safety rails built into `scripts/blogger-drafts.mjs`

- Creates **drafts only**; skips any post that is `LIVE` or `SCHEDULED`.
- Max **5 posts per run**, 8 s apart; backs off on 429/5xx errors.
- Refuses bodies under 300 characters (no thin drafts).
- Reads only `content/posts/*.html`; never prints tokens.
- Explains `invalid_grant` errors (expired token) with the fix.

## 4. If it ever stops

| Error in the Action log | Fix |
|---|---|
| `invalid_grant` | Token expired or revoked: confirm step 3 (In production), redo step 5, update the `BLOGGER_REFRESH_TOKEN` secret |
| `invalid_client` | Wrong client ID/secret secret |
| `403 … insufficient permissions` | Token made with the wrong account or scope: redo step 5 with the blog owner's account |
| `429` repeatedly | Too many runs; wait a day. Quota resets daily |

Changing your Google password can revoke refresh tokens → redo step 5.

## 5. Content rules that make the site grow (and pass AdSense)

1. **Publish 3–4 posts/week by hand.** Steady beats bursts, for both Blogger's spam filter and Google's crawl.
2. **Every post gets first-hand value before publishing**: your own photos (not only AI images), a real measurement, a cost, or a mistake you made. That's the "Experience" in E-E-A-T and what separates you from scaled AI sites.
3. **One search intent per post**, built around a tool where possible (mulch → "how much mulch do I need", "mulch depth", "bags vs bulk mulch").
4. **AdSense readiness** (typical bar): 25–30 substantial posts, About/Contact/Privacy/Disclaimer pages live, no "under construction" pages, steady organic traffic. Apply at about 30 posts and ~3 months of history.
5. Never republish another site's text, and don't spin your own posts into near-duplicates.

## 6. Moving to WordPress later

The content lives in this repo as HTML, so it stays portable. If you migrate:
- Use WordPress permalink structure `/%year%/%monthnum%/%postname%.html`. It matches Blogger URLs exactly, so no ranking is lost and no redirects are needed.
- The same script can target the WordPress REST API with an *Application Password* (built into WordPress, free). Only the `api()` calls change.

## 7. Daily batches (60 articles over 6 days)

- A scheduled Claude session runs **once a day at 09:39 Malaysia time** for 6 days. Each run writes the next 10 articles from `content/PLAN.md` following `docs/WRITING-GUIDE.md`, then opens **one PR**.
- **You:** skim the PR, then merge it. The merge sends the 10 drafts to Blogger (about 2 minutes). Merge one batch PR at a time; a run accepts 10 posts at most.
- If a batch PR waits a day, the next run simply writes the following 10 and doesn't duplicate anything.
- Each post's top comment has an **IMAGE BRIEF**: SEO filename, alt text, title and 3 prompt styles for the featured image, plus a Pinterest pin and an inline image.
- **Your edits in Blogger are protected.** Once you change a draft in the Blogger editor (photos, experience, permalink), later syncs skip it instead of overwriting it. To overwrite on purpose: Actions → Blogger drafts → Run workflow → tick **force**.
- **Publishing pace:** 1–2 posts a day, each with a real photo and an experience line added. A brand-new site that publishes 50 near-identical AI posts in 3 weeks fits Google's scaled-content pattern. The same 50 posts, each made personal and published steadily, don't.

## 8. Weekly site audit (read-only)

`.github/workflows/site-audit.yml` runs every **Monday at 10:17 Malaysia time** (or any time via Actions → Site audit → Run workflow). It uses the same secrets but **only reads**: it never changes Blogger.

It checks every live post and page:
- **AdSense readiness:** 25+ substantial posts, About/Contact/Privacy/Disclaimer pages, no critical issues, every post personalised, no broken links.
- **SEO / web standards:** meta description, canonical, `noindex`, one H1, `og:image`, valid JSON-LD, title length, one label, duplicate titles.
- **Content:** thin posts, leftover old shortcodes, unfilled ADD YOUR EXPERIENCE / ADD YOUR PHOTO, images without alt text, `http://` images, broken internal links, posts not updated in a year.

The result is committed to `reports/site-audit.md` and shown on the run's summary page.
