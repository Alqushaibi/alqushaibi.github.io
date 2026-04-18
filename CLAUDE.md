# Alawi Alqushaibi – Academic Homepage

Personal academic website hosted on GitHub Pages.

## Owner
- **Name:** Ts. Dr. Alawi Alqushaibi
- **Email:** alawi.alqushaibi@gmail.com
- **GitHub:** github.com/alqushaibi
- **Google Scholar:** https://scholar.google.com/citations?user=7B_-M3YAAAAJ

## Structure
```
index.html                          ← Main single-page site
assets/
  css/style.css                     ← All styles (CSS variables + responsive)
  js/main.js                        ← Tab switching, publication rendering, search
  data/publications.json            ← Scholar data (auto-updated weekly)
  img/
    profile.jpg                     ← Add your photo here
    avatar-placeholder.svg          ← Fallback if photo missing
scripts/
  update_citations.py               ← Updates publications.json from Google Scholar
.github/workflows/
  update_citations.yml              ← Runs update_citations.py every Sunday
```

## Adding Your Profile Photo
Place your photo as `assets/img/profile.jpg` (square crop recommended, min 300×300px).

## Google Analytics
Uncomment and replace `GA_MEASUREMENT_ID` in `index.html` (lines 29–35) with your
Google Analytics Measurement ID (format: `G-XXXXXXXXXX`).

## Manual Citation Update
```bash
cd /path/to/repo
pip install scholarly
python scripts/update_citations.py
```

## GitHub Pages Setup
1. Go to repo Settings → Pages
2. Source: Deploy from branch → `main` → `/ (root)`
3. Site will be live at: https://alqushaibi.github.io/github.io/

## Renaming the Repo (Recommended)
For a cleaner URL (`alqushaibi.github.io`), rename the repo to `alqushaibi.github.io`
in GitHub Settings → General → Repository name.
