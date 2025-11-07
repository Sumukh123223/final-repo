# 🚀 How to Run the Website Locally

## ⚠️ Important: ES Modules Require HTTP Server

The official Reown AppKit uses ES modules (`import` statements), which **cannot** be loaded from `file://` URLs due to browser security (CORS policy).

You **must** run a local HTTP server to test the website.

## 🎯 Quick Start

### Option 1: Use the provided script (Easiest)

1. Open Terminal
2. Navigate to the project folder:
   ```bash
   cd /Users/sumukhadministrator/Desktop/newbep
   ```
3. Run the server script:
   ```bash
   ./start-server.sh
   ```
4. Open your browser and go to:
   ```
   http://localhost:8000
   ```

### Option 2: Manual Python Server

1. Open Terminal
2. Navigate to the project folder:
   ```bash
   cd /Users/sumukhadministrator/Desktop/newbep
   ```
3. Start Python HTTP server:
   ```bash
   python3 -m http.server 8000
   ```
4. Open your browser and go to:
   ```
   http://localhost:8000
   ```

### Option 3: Node.js Server (if you have Node.js installed)

1. Install a simple server globally:
   ```bash
   npm install -g http-server
   ```
2. Navigate to the project folder:
   ```bash
   cd /Users/sumukhadministrator/Desktop/newbep
   ```
3. Start the server:
   ```bash
   http-server -p 8000
   ```
4. Open your browser and go to:
   ```
   http://localhost:8000
   ```

## ✅ What You Should See

Once the server is running and you open `http://localhost:8000`:

1. ✅ The wallet connect button should be visible
2. ✅ Clicking it should show the official AppKit modal with:
   - Wallet list (WalletConnect, MetaMask, etc.)
   - Search functionality
   - Email login option
   - Google login option
   - QR code for mobile

## 🛑 To Stop the Server

Press `Ctrl+C` in the Terminal window where the server is running.

## 📝 Note

- The server must stay running while you test the website
- Closing the Terminal window will stop the server
- You can run the server in the background if needed

