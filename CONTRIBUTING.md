# How We Maintain This Repo

This repo is not a dumping ground for links. It is a fact-first knowledge base.

## Editorial standard

Before anything lands on `main`, it should answer four questions:

1. What is the source?
2. What is the exact claim?
3. How strong is the evidence?
4. Where does the conclusion stop being safe?

If any of those are missing, keep the note in `draft`.

## Daily workflow

### 1. Capture

Add a draft file under `src/content/posts/` using `_template.md`.

Recommended naming:

```text
YYYY-MM-DD-topic-slug.md
```

### 2. Fill the evidence layer first

Write these fields before writing a polished body:

- `sources`
- `facts`
- `thesis`

This prevents style from outrunning truth.

### 3. Ask for challenge

Use me for three things:

- challenge weak claims
- separate facts from judgment
- compress the article into something worth publishing

### 4. Build locally

```bash
npm run build
```

If the build fails, do not publish.

### 5. Commit in small units

Examples:

```bash
git checkout -b note/eval-observability
git add src/content/posts/2026-03-23-eval-observability.md
git commit -m "Add draft on eval observability"
```

### 6. Merge only when fact-safe

`main` is public history, not a scratchpad.

## Suggested labels for future GitHub issues

- `signal`
- `card`
- `theme`
- `essay`
- `needs-source`
- `needs-review`
- `ready-to-publish`

## Publishing rule

Publishing later is fine.
Publishing wrong is expensive.
