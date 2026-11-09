# Drafts

Files here are **not built** and never appear on the live site. Each mirrors its live path:
`site/drafts/posts/2022/10/how-to-grow-pumpkins.html` replaces `site/content/posts/2022/10/how-to-grow-pumpkins.html` when published.

Each draft starts with a comment that holds:
- **Your experience questions.** Answer them briefly and send the answers to Claude; they come back as a paragraph in your voice.
- **The image brief:** filenames, alt text, title, caption and 3 prompt styles per image, plus a Pinterest pin.

You can edit a draft on GitHub (pencil icon). To publish a batch, ask Claude ("publish drafts"), or run
`node scripts/site/publish-drafts.mjs` (all) or `node scripts/site/publish-drafts.mjs pumpkins` (matching ones) and commit.
