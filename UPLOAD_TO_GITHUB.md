# 📤 Upload Files to GitHub Repository

## Repository: https://github.com/Sumukh123223/final-repo.git

## 🚀 Quick Upload Steps

### Option 1: Using Git Commands (Terminal)

```bash
cd /Users/sumukhadministrator/Desktop/newbep

# Initialize git (if not already done)
git init

# Add remote repository
git remote add origin https://github.com/Sumukh123223/final-repo.git
# OR if remote already exists:
git remote set-url origin https://github.com/Sumukh123223/final-repo.git

# Add all website files
git add index.html main.js app-simple.js style.css .gitignore

# Commit
git commit -m "Initial commit: CleanSpark website with official Reown AppKit"

# Push to GitHub
git branch -M main
git push -u origin main
```

### Option 2: Upload via GitHub Website (Easier)

1. Go to: https://github.com/Sumukh123223/final-repo
2. Click **"Add file"** → **"Upload files"**
3. Drag and drop these files:
   - `index.html`
   - `main.js`
   - `app-simple.js`
   - `style.css`
   - `.gitignore` (optional)
4. Click **"Commit changes"**

## 📁 Essential Files to Upload

✅ **Required for website:**
- `index.html` - Main HTML file
- `main.js` - AppKit setup (ES module)
- `app-simple.js` - Contract interactions
- `style.css` - Styling

✅ **Optional but recommended:**
- `.gitignore` - Ignore unnecessary files
- `README.md` - Documentation

## ⚙️ After Upload: Enable GitHub Pages

1. Go to: https://github.com/Sumukh123223/final-repo/settings/pages
2. Under **Source**, select:
   - Branch: `main`
   - Folder: `/ (root)`
3. Click **Save**

Your site will be available at:
```
https://sumukh123223.github.io/final-repo/
```

## ✅ What Will Work

- ✅ Official Reown AppKit modal
- ✅ Wallet connection (WalletConnect, MetaMask, etc.)
- ✅ Contract interactions
- ✅ All website features

