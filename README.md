# Francis Chung Website

This project is a no-build static website prepared for free hosting on GitHub Pages.

## Files

- `index.html` contains the homepage.
- `work.html` contains the portfolio grid and stand-in work slots.
- `about.html` contains the bio and artist statement.
- `contact.html` contains direct contact details.
- `styles.css` contains the shared design system and responsive layout.
- `script.js` contains the mobile menu and reveal animations.

## Before Publishing

1. Replace the six stand-in work cards in `work.html` with final artwork titles, years, materials, dimensions, and images.
2. Add the correct Instagram handle and link in `contact.html`.
3. If you have final photography, place the image files in an `assets/` folder and update the work cards to use `<img>` tags instead of the current gradient placeholders.

## Publish On GitHub Pages

1. Create a GitHub repository and upload these files to the root of the default branch.
2. In GitHub, open `Settings` -> `Pages`.
3. Under `Build and deployment`, choose `Deploy from a branch`.
4. Select your main branch and the `/ (root)` folder, then save.
5. Wait for GitHub to publish the site and use the generated `github.io` URL for the contest submission.

## Local Preview

From this folder, run:

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000`.
