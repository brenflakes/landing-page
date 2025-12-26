# bren.id.au

Animated Australia network topology landing page.

## Local Development

```bash
npm install
npm run dev
```

## Deploying to Cloudflare Pages

### First Time Setup

1. Push this repo to GitHub

2. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/) → Pages → Create a project

3. Click "Connect to Git" and select your repository

4. Configure build settings:
   - **Framework preset:** Vite
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`

5. Click "Save and Deploy"

### Custom Domain (bren.id.au)

1. In your Cloudflare Pages project, go to Custom domains

2. Click "Set up a custom domain"

3. Enter `bren.id.au`

4. If your domain is already on Cloudflare:
   - It will auto-configure the DNS

5. If your domain is elsewhere:
   - Add a CNAME record pointing to `your-project.pages.dev`
   - Or transfer your domain to Cloudflare (recommended)

### Updating the Site

Just push to GitHub - Cloudflare automatically rebuilds and deploys.

```bash
git add .
git commit -m "Update"
git push
```

## Tech Stack

- React 18
- Vite
- Cloudflare Pages
