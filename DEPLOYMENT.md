# Deployment

This folder is a static website and can be deployed directly to Vercel.

## Vercel Dashboard

1. Push this folder to a GitHub repository.
2. Import the repository at https://vercel.com/new.
3. Set the project root to this folder if the repository contains other files.
4. Leave Framework Preset as `Other`.
5. Leave Build Command and Output Directory empty.
6. Deploy and test the generated preview URL.
7. Add the production domain in Project Settings > Domains.

## Before Connecting The Domain

- Replace the contact form's `mailto:` behavior with a form service if direct delivery is required.
- Add the final production URL as the canonical URL and `og:url` in `index.html`.
- Add the production sitemap URL to `robots.txt`.

## Local Preview

Opening `index.html` directly works for most features. Use a local HTTP server when testing the 3D model viewer.
