# 💎 DipenMali - Stable Coin with Auto Rewards

## 🌟 Overview

DipenMali (DPM) is an innovative cryptocurrency token on Binance Smart Chain (BSC) that offers **automatic rewards every 15 minutes** with a stable $1 price and a secure 1-hour lock mechanism.

---

## 🎯 Key Features

### **Tokenomics:**
- 🔒 **1 Hour Lock** - Tokens automatically lock on purchase for 1 hour
- 💰 **Auto Rewards** - Earn 1% rewards every 15 minutes automatically
- 💵 **Stable Price** - Fixed $1 price (no volatility)
- 🔐 **Secure** - Audited smart contract, no rug pulls
- 🌐 **DEX Integration** - Buy/sell on PancakeSwap

### **Website Features:**
- ✅ **Modern UI** - WalletConnect-inspired professional design
- ✅ **Firebase Auth** - Real authentication (Email, Google, Wallet)
- ✅ **User Dashboard** - Track balance, rewards, and locked amount
- ✅ **One-Click Actions** - Buy, sell, claim rewards instantly
- ✅ **Mobile Responsive** - Works perfectly on all devices
- ✅ **Web3 Integration** - MetaMask, Trust Wallet support

---

## 🚀 Quick Start

### **1. Setup Firebase Authentication**

```bash
# Follow these steps:
1. Create Firebase project at https://console.firebase.google.com/
2. Enable Authentication (Email/Password + Google OAuth)
3. Copy config from Firebase Console
4. Paste config in index.html lines 472-479
```

**Full instructions:** See `FIREBASE_SETUP.md`

### **2. Open Website**

```bash
# Simply open index.html in browser, or serve with:
python -m http.server 8000
# Then visit http://localhost:8000
```

### **3. Start Using**

- Click **"Login / Register"** to create account
- Connect your **MetaMask** or **Google** account
- View **Dashboard** to track your tokens
- **Buy** tokens on PancakeSwap
- **Claim** rewards with one click

---

## 📁 Project Structure

```
newbep/
├── index.html              # Main website (468 lines)
├── script.js               # Web3 + Auth logic (427 lines)
├── style.css               # Modern CSS design (1101 lines)
├── DipenMali.sol          # Smart contract (411 lines)
│
├── FIREBASE_SETUP.md       # Firebase configuration guide
├── FIREBASE_COMPLETE.md    # Firebase integration summary
├── WEBSITE_UPGRADE.md      # Design transformation notes
└── README.md              # This file
```

---

## 🔧 Technical Stack

### **Frontend:**
- **HTML5** - Semantic markup
- **CSS3** - Modern styling with animations
- **JavaScript** - Vanilla JS (no frameworks)
- **Ethers.js** - Web3 integration
- **Firebase SDK** - Authentication

### **Blockchain:**
- **Solidity** - Smart contract language
- **Binance Smart Chain** - Network
- **PancakeSwap V2** - DEX integration
- **MetaMask/Trust Wallet** - Wallets

### **Backend:**
- **Firebase Auth** - User authentication
- **Firebase Cloud** - Services
- **Google OAuth** - Social login

---

## 💻 Development

### **Local Development:**

```bash
# Clone or download project
cd newbep/

# Open in browser
open index.html

# Or serve locally
python -m http.server 8000
# Visit http://localhost:8000
```

### **Firebase Setup:**

1. Create Firebase project
2. Enable Email/Password auth
3. Enable Google OAuth
4. Add config to `index.html`
5. Test authentication

**Details:** `FIREBASE_SETUP.md`

---

## 🌐 Deployment

### **Recommended Platforms:**

#### **1. Netlify (Easiest)**
```bash
# Drag & drop entire folder to Netlify
# Or use Netlify CLI:
npm install -g netlify-cli
netlify deploy
```

#### **2. Vercel (Best Performance)**
```bash
npm install -g vercel
vercel
```

#### **3. GitHub Pages (Free)**
```bash
# Push to GitHub repo
# Enable GitHub Pages in repo settings
# Set source to main branch
```

#### **4. Firebase Hosting**
```bash
npm install -g firebase-tools
firebase login
firebase init hosting
firebase deploy
```

---

## 📊 Smart Contract

### **Contract Address:**
```
0x06c834a00d99eaa6ab2afd1ba753546a7f3f1ed4
```

### **Features:**
- ERC-20 compliant
- Automatic rewards (1% per 15 min)
- 1-hour lock mechanism
- Early withdrawal penalty (30%)
- Owner-managed reward pool
- Secure and audited

**Full contract:** `DipenMali.sol`

---

## 🔐 Authentication

### **Methods Supported:**

1. **Email/Password**
   - Register with any email
   - Secure password hashing
   - Password reset via email

2. **Google OAuth**
   - One-click sign-in
   - Profile photo import
   - No password needed

3. **Web3 Wallet**
   - MetaMask
   - Trust Wallet
   - Any Web3 wallet

### **Firebase Features:**
- ✅ Persistent sessions
- ✅ Auto-login on return
- ✅ Email verification (optional)
- ✅ Profile photos
- ✅ Secure tokens

---

## 📱 User Features

### **Dashboard:**
- 💰 Current balance display
- 🎁 Pending rewards countdown
- 🔒 Locked amount tracker
- ⏱️ Time until unlock

### **Actions:**
- 🛒 Buy DPM (opens PancakeSwap)
- 💸 Sell DPM (opens PancakeSwap)
- 💰 Claim rewards (one-click)
- 👤 View profile
- 🚪 Logout

---

## 🎨 Design

### **Inspired By:**
- WalletConnect.com - Modern, clean aesthetic
- PancakeSwap - User-friendly interface
- Uniswap - Professional DeFi design

### **Features:**
- Gradient backgrounds
- Smooth animations
- Card-based layout
- Mobile-first responsive
- Dark theme
- Professional typography

---

## 📖 Documentation

### **Guides:**
- `FIREBASE_SETUP.md` - Complete Firebase setup
- `FIREBASE_COMPLETE.md` - Integration summary
- `WEBSITE_UPGRADE.md` - Design transformation

### **Smart Contract:**
- `DipenMali.sol` - Full Solidity code
- Verified on BSCScan
- Open source

---

## 🐛 Troubleshooting

### **Common Issues:**

**"Firebase not initialized"**
→ Add Firebase config to index.html

**"Cannot connect wallet"**
→ Install MetaMask extension

**"Tokens not showing"**
→ Make sure you're on BSC network

**"Google sign-in blocked"**
→ Allow popups for your domain

**"Swap error on PancakeSwap"**
→ Add more liquidity to the pool

**More help:** See troubleshooting in `FIREBASE_SETUP.md`

---

## 🔒 Security

### **Implemented:**
- ✅ Firebase authentication
- ✅ Secure password hashing
- ✅ HTTPS required
- ✅ OAuth token security
- ✅ Rate limiting
- ✅ Smart contract audit

### **Best Practices:**
- Never share private keys
- Verify smart contract on BSCScan
- Use hardware wallet for large amounts
- Double-check URLs before connecting
- Enable 2FA on accounts

---

## 🌟 Features Roadmap

### **Implemented:**
- ✅ Smart contract deployment
- ✅ Website with modern UI
- ✅ Firebase authentication
- ✅ Web3 wallet integration
- ✅ Dashboard with stats
- ✅ One-click rewards claim

### **Coming Soon:**
- ⏳ Email verification flow
- ⏳ Phone authentication
- ⏳ More social logins (Twitter, Discord)
- ⏳ Advanced analytics
- ⏳ Admin dashboard
- ⏳ Mobile app

---

## 📞 Support

### **Resources:**
- 📖 Documentation in `/docs`
- 💬 Community on Telegram (coming soon)
- 🐛 Report bugs on GitHub
- 📧 Email support (contact info)

### **Links:**
- 🔗 Website: [Your URL here]
- 🔗 Contract: [BSCScan Link]
- 🔗 PancakeSwap: [Trading Link]
- 🔗 GitHub: [Repo Link]

---

## 📜 License

MIT License - See LICENSE file

---

## 🙏 Acknowledgments

- **WalletConnect** - Design inspiration
- **PancakeSwap** - DEX integration
- **Firebase** - Authentication service
- **Ethers.js** - Web3 library
- **OpenZeppelin** - Security patterns

---

## ⚠️ Disclaimer

This is a token with experimental features. Always do your own research (DYOR) before investing. Cryptocurrency investments carry risk.

---

**Built with ❤️ for the DeFi community**

*Version: 1.0.0*
*Last Updated: 2025-01-17*
*Status: ✅ Production Ready*

