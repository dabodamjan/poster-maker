# Contributing

Thanks for your interest in contributing to Poster Maker!

## Reporting issues

Open a [GitHub issue](https://github.com/dabodamjan/poster-maker/issues) with:

- What you were trying to do
- What happened instead
- Steps to reproduce (if applicable)

## Pull requests

1. Fork the repo and create a branch from `main`
2. Make your changes
3. Test that posters still generate and export correctly
4. Open a pull request with a clear description of your changes

## Development setup

```bash
git clone https://github.com/dabodamjan/poster-maker.git
cd poster-maker
npm install
npx playwright install chromium
```

Then open the project in [Claude Code](https://claude.com/claude-code) and use `/new-poster` to test.

## Code style

- Poster HTML files keep all CSS inline; the only external references are Google Fonts and images in `assets/`
- Scripts use plain Node.js (no build step, no TypeScript)
- Keep it simple
