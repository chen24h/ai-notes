# Tower Notes

A fact-first blog and knowledge base for AI Infra and agent engineering.

## Why this exists

This project is designed for long-term learning, not content farming.

Every published note should make four things explicit:

1. Source list
2. Fact ledger
3. Verification timestamp
4. Boundary of the conclusion

If a claim cannot survive those four checks, it should not be published.

## Structure

```text
src/
  content/
    posts/              # Markdown notes and essays
  components/
    FactLedger.astro    # Explicit claim / evidence blocks
    SourceList.astro    # Primary source references
  pages/
    index.astro         # Homepage
    posts/              # Archive and post detail
    manifesto.astro     # Editorial rules
```

## Content model

Each post must include:

- `title`
- `summary`
- `publishedAt`
- `status`
- `category`
- `thesis`
- `sources`
- `facts`

Schema is enforced in [`src/content.config.ts`](./src/content.config.ts).

## Local development

```bash
npm install
npm run dev
```

Open `http://localhost:4321`.

## Build

```bash
npm run build
```

## How we maintain this together

### Your role

- Decide what is worth learning
- Push your own judgment harder
- Reject anything that feels hand-wavy

### My role

- Draft new cards and essays
- Turn daily signals into structured posts
- Force source attribution
- Challenge weak claims before they go public

## Recommended GitHub workflow

1. Create a GitHub repo from this folder.
2. Use `main` only for reviewed, publishable content.
3. Create topic branches for new notes, for example:

```bash
git checkout -b note/kv-cache-routing
```

4. Add a post under `src/content/posts/`.
5. Run:

```bash
npm run build
```

6. Review:
   - Are primary sources present?
   - Are facts and judgments separated?
   - Is the boundary of the conclusion stated?

7. Merge only after the note is fact-safe.

## Suggested writing protocol

Use this loop for every new article:

1. Collect primary sources
2. Extract raw facts
3. Write claims with confidence labels
4. Draft judgment
5. Ask me to challenge the draft
6. Publish only after revision

## Deployment

This site is static and can be deployed to GitHub Pages, Vercel, or Cloudflare Pages.
For now, GitHub Pages is enough for a personal knowledge base.
