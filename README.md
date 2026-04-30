# Kambili Scents

A static landing page and product storefront for Kambili Scents, built with HTML, CSS, and JavaScript. The site includes:

- Hero banner with rotating background images
- Brand logo slider
- Firestore-powered product listing
- Search, category filtering, and load-more pagination
- Shopping cart with WhatsApp checkout
- Responsive mobile navigation and cart modal

## Files

- `index.html` — main site markup
- `style.css` — layout and styling
- `script.js` — interactive behavior and Firestore integration
- `firebase-config.js` — Firebase app configuration
- `images/` — site assets and brand logos

## Local preview

1. Open `index.html` in a browser.
2. For a better local experience, serve the folder with a local web server.
   - Example: use VS Code Live Server or a simple Python server:
     ```powershell
 

## Firebase setup

The site uses Firebase Firestore for product data. Update `firebase-config.js` with your own Firebase configuration if needed.

## GitHub Pages deployment

This repository includes a GitHub Actions workflow to deploy the site to GitHub Pages automatically from the `main` branch.

### Deployment details

- Workflow file: `.github/workflows/deploy.yml`
- The workflow publishes the repository contents to the `gh-pages` branch.
- Enable GitHub Pages in the repository settings and set the source to `gh-pages`.

## Notes

