# Kaeva — AI-Powered Tech Discovery

> The best tech, curated for you. Shop smarter with AI-verified product recommendations.

**Live:** [kaeva.app](https://kaeva.app)

## Overview

Kaeva is a modern tech affiliate platform showcasing curated products across gaming, AI/ML, coding, peripherals, and networking. Built with HTML/CSS/JavaScript and powered by Vite, deployed on Cloudflare Pages.

## Features

- 🌙 Dark theme with neon green accent (Cash App inspired)
- 📱 Responsive design for desktop and mobile
- 🃏 Card-based grid layouts with hover effects
- ✨ Animated particle background, scroll reveals, gradient text
- 📦 Dynamic product display from JSON via `fetch` API
- 🔗 Amazon affiliate integration

## Project Structure

```
├── index.html              # Main landing page
├── verdict.html            # Shareable verdict card page
├── disclosure.html         # Affiliate disclosure
├── privacy.html            # Privacy policy
├── css/style.css           # Styles and animations
├── js/app.js               # Dynamic functionality
├── data/
│   ├── products.json       # Product catalog data
│   ├── personas.json       # User persona definitions
│   └── setups.json         # Setup configurations
├── assets/                 # Images and static assets
├── static/                 # Static files
├── public/                 # Public assets (links.html, etc.)
├── vite.config.js          # Vite build configuration
└── package.json            # Dependencies
```

## Development

```bash
# Install dependencies
npm install

# Start dev server (port 3000)
npm run dev

# Build for production → dist/
npm run build

# Preview production build
npm run preview
```

## Deployment

Deployed automatically via **Cloudflare Pages** from the `main` branch.

- Production: [kaeva.app](https://kaeva.app)
- Preview: [kaeva.pages.dev](https://kaeva.pages.dev)

## Branch Strategy

- `main` — Production (deployed to Cloudflare Pages)
- `dev` — Active development

## Related Repos

- [`kaeva-verify`](https://github.com/Viraj-FG/kaeva-verify) — ML pipeline, Cloudflare Worker backend, deepfake detection
- [`kaeva-models`](https://github.com/Vi0509/kaeva-models) — HuggingFace Space with model weights

## License

Proprietary. All rights reserved.
