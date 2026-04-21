# Academic Homepage — Ts. Dr. Alawi Alqushaibi

A clean, fully self-managed personal academic website built for **GitHub Pages** with a built-in browser-based admin panel. No server, no database, no build step — just HTML, CSS, and JavaScript.

**Live demo:** [alqushaibi.github.io](https://alqushaibi.github.io)

---

## Features

- **Single-page academic site** with tabs: About, Teaching, Supervision, Publications, Media, CV
- **PDF CV generator** (`cv-print.html`) — printable two-column layout with auto-fetched citation metrics
- **Browser admin panel** (`admin.html`) — manage all content without touching code:
  - Bio, research interests, education, experience, projects, skills, awards, memberships, leadership
  - Teaching subjects, supervision (PhD / Master / FYP students), referees
  - Media gallery: images, YouTube videos, social posts (LinkedIn/Facebook/Instagram), photo albums
  - Rich text editor (Quill.js) for descriptions
  - CV/resume PDF upload
  - University name, phone/WhatsApp, years of experience
- **Auto-updated publications** via GitHub Actions (weekly Google Scholar scrape using `scholarly`)
- **GitHub API** storage — all edits commit directly to the repo; no backend needed
- Password-protected admin with SHA-256 hashing and lockout after 5 failed attempts

---

## Tech Stack

| Layer | Technology |
|---|---|
| Hosting | GitHub Pages (free) |
| Frontend | Vanilla HTML / CSS / JavaScript |
| Icons | Font Awesome 6.5 (free tier) |
| Font | Inter (Google Fonts) |
| Rich text | Quill.js 1.3.7 |
| Data storage | JSON files committed via GitHub Contents API |
| Publication data | Google Scholar via `scholarly` (Python) |
| CI/CD | GitHub Actions |

---

## Quick Start (Fork & Use)

### 1. Fork this repository

Click **Fork** at the top-right of this page. Rename the fork to `<your-github-username>.github.io` for a clean URL.

### 2. Enable GitHub Pages

Go to your forked repo → **Settings → Pages** → Source: **Deploy from branch** → `main` → `/ (root)` → Save.

Your site will be live at `https://<your-github-username>.github.io` within a few minutes.

### 3. Update the config

Edit `admin.html` and `assets/js/main.js` — change the two constants near the top:

```js
const OWNER = 'your-github-username';
const REPO  = 'your-github-username.github.io';
```

Also update the Google Scholar user ID in `scripts/update_citations.py`:

```python
SCHOLAR_ID = "your_scholar_id_here"
```

### 4. Create a GitHub Personal Access Token

Go to **GitHub → Settings → Developer settings → Fine-grained tokens → Generate new token**.

- Repository access: select your fork only
- Permissions: **Contents → Read and Write**

Paste the token into the admin panel (Settings tab) — it is stored only in your browser session.

### 5. Set your admin password

Open `https://<your-username>.github.io/admin.html` → you will be prompted to create a password on first visit.

### 6. Add your profile photo

Upload `assets/img/profile.jpeg` (or `.jpg`) — square crop, minimum 300×300 px recommended.

### 7. Replace content

Use the admin panel to replace all placeholder content with your own bio, experience, publications, etc.

### 8. (Optional) Enable Google Analytics

Uncomment and replace `GA_MEASUREMENT_ID` in `index.html` (lines 29–35).

---

## Enabling Weekly Publication Updates

The GitHub Action in `.github/workflows/update_citations.yml` runs every Sunday and updates `assets/data/publications.json` automatically.

For it to commit changes back to the repo, add a secret:

**Repo Settings → Secrets and variables → Actions → New repository secret**

- Name: `PERSONAL_ACCESS_TOKEN`
- Value: a Classic token (or fine-grained with Contents write) for your repo

---

## File Structure

```
index.html                        ← Main single-page site
admin.html                        ← Browser admin panel (password protected)
cv-print.html                     ← Printable PDF CV
assets/
  css/style.css                   ← All styles
  js/main.js                      ← Tab switching, rendering, media gallery
  data/
    site-content.json             ← All editable content (bio, CV sections, etc.)
    media.json                    ← Media gallery items
    publications.json             ← Auto-updated from Google Scholar
    supervision.json              ← Student supervision records
  img/
    profile.jpeg                  ← Your profile photo
    media/                        ← Uploaded gallery images
scripts/
  update_citations.py             ← Google Scholar scraper
.github/workflows/
  update_citations.yml            ← Weekly automation
```

---

## License

This project is released under the **MIT License** — see [LICENSE](LICENSE) for full terms.

In short: **free to fork, modify, and use for any purpose**, including personal and commercial use. Attribution is appreciated but not required.

### Third-party libraries

| Library | License |
|---|---|
| [Font Awesome](https://fontawesome.com) (free tier) | MIT / CC-BY 4.0 / SIL OFL |
| [Inter](https://rsms.me/inter/) (Google Fonts) | SIL Open Font License 1.1 |
| [Quill.js](https://quilljs.com) | BSD 3-Clause |
| [scholarly](https://github.com/scholarly-python-package/scholarly) | MIT |

---

## Contributing

Pull requests are welcome. For major changes, open an issue first to discuss.

---

*Built by [Ts. Dr. Alawi Alqushaibi](https://alqushaibi.github.io)*
