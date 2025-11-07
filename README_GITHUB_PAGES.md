# 🚀 Deploy to GitHub Pages

## ✅ Steps to Deploy

### 1. Create/Update GitHub Repository

If you don't have a repository yet:
```bash
git init
git add .
git commit -m "Initial commit - CleanSpark website with AppKit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git push -u origin main
```

If you already have a repository (like `mycoinsite`):
```bash
git add .
git commit -m "Update: Add official Reown AppKit integration"
git push
```

### 2. Enable GitHub Pages

1. Go to your repository on GitHub
2. Click **Settings** tab
3. Scroll down to **Pages** section (in the left sidebar)
4. Under **Source**, select:
   - Branch: `main` (or `master`)
   - Folder: `/ (root)`
5. Click **Save**

### 3. Access Your Site

After a few minutes, your site will be available at:
```
https://YOUR_USERNAME.github.io/YOUR_REPO_NAME/
```

For example:
- If your repo is `mycoinsite` and username is `Sumukh123223`:
  - `https://sumukh123223.github.io/mycoinsite/`

## 🔧 Important Notes

### ES Modules Work on GitHub Pages ✅
- GitHub Pages serves files over HTTPS
- ES modules (`import` statements) work perfectly
- No CORS issues

### File Structure
Make sure your files are in the root directory:
```
newbep/
├── index.html
├── main.js
├── app-simple.js
├── style.css
└── ... (other files)
```

### Update Metadata (Optional)
If you want to update the site metadata in `index.html`, you can change:
- Line 25: `url: window.location.origin` (this will automatically use your GitHub Pages URL)

## 🎯 What Will Work

✅ Official Reown AppKit modal with:
- Wallet list (WalletConnect, MetaMask, Bitget, etc.)
- Search functionality
- Email login
- Google login
- QR code for mobile

✅ All contract interactions
✅ Dashboard functionality
✅ Buy/Sell tokens

## 🐛 Troubleshooting

### Site not loading?
- Wait 1-2 minutes after enabling GitHub Pages
- Check repository Settings → Pages to see deployment status
- Make sure `index.html` is in the root directory

### AppKit not loading?
- Check browser console for errors
- Make sure you're accessing via HTTPS (GitHub Pages automatically uses HTTPS)
- Verify Project ID is correct: `82dc70494a3772c5807c04ceae640981`

## 📝 Next Steps After Deployment

1. Test the site on the GitHub Pages URL
2. Test wallet connection
3. Test contract interactions
4. Share the URL with others!

