# Fluxora Deployment Guide

## 1. Push Code to GitHub
Your local repository is already initialized and linked to your GitHub repository.

1. **Verify Remote**:
   ```bash
   git remote -v
   # Should show: https://github.com/WolfGames156/Fluxora.git
   ```

2. **Push to GitHub**:
   ```bash
   git push -u origin main
   ```
   *(Note: You may need to authenticate if this is the first time pushing).*

## 2. Deploy (Choose One)

### Option A: Netlify (Recommended)
1. Log in to [Netlify](https://netlify.com).
2. Click **"Add new site"** > **"Import an existing project"**.
3. Select **GitHub** and choose `WolfGames156/Fluxora`.
4. Configure Build:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
5. Click **Deploy**.

### Option B: GitHub Pages
1. Go to your repository Settings > **Pages**.
2. Source: `GitHub Actions`.
3. Create a workflow file `.github/workflows/deploy.yml`:
   ```yaml
   name: Deploy to Pages
   on:
     push:
       branches: ["main"]
   jobs:
     deploy:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v4
         - uses: actions/setup-node@v4
           with:
             node-version: 18
         - run: npm install
         - run: npm run build
         - uses: peaceiris/actions-gh-pages@v3
           with:
             github_token: ${{ secrets.GITHUB_TOKEN }}
             publish_dir: ./dist
   ```
