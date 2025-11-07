# CleanSpark - Smart Bitcoin Mining Platform

A decentralized Bitcoin mining platform built on BNB Smart Chain (BSC) that allows users to invest in Bitcoin mining and earn automatic rewards.

## Features

- 🦊 **MetaMask Integration**: Direct MetaMask wallet connection with automatic BNB Chain switching
- 💰 **Token Purchase**: Buy CleanSpark tokens with USDT at a fixed rate (1 USDT = 1 token)
- ⛏️ **Mining Rewards**: Earn automatic rewards every 24 hours
- 📊 **Dashboard**: Real-time balance and reward tracking
- 🎁 **Referral System**: Earn 5% commission on referrals

## Quick Start

### Local Development

1. **Start Local Server** (Required for MetaMask to work):
   ```bash
   ./start-server.sh
   ```
   Or manually:
   ```bash
   python3 -m http.server 8000
   ```

2. **Open in Browser**:
   ```
   http://localhost:8000
   ```

3. **Connect Wallet**:
   - Click "Connect Wallet" button
   - Approve MetaMask connection
   - The site will automatically switch to BNB Smart Chain

## Project Structure

```
newbep/
├── index.html          # Main website file
├── main.js             # MetaMask wallet connection & BNB chain switching
├── app-simple.js       # Smart contract interactions
├── style.css           # Website styling
├── start-server.sh     # Local server startup script
└── README.md           # This file
```

## Smart Contract

- **Contract Address**: `0x45CbCA5f88c510526049F31cECeF626Eb5254784`
- **Network**: BNB Smart Chain (BSC) Mainnet
- **Chain ID**: 56

## Features Details

### Wallet Connection
- Automatic BNB Smart Chain detection and switching
- If BNB Chain is not added to MetaMask, it will be added automatically
- Real-time account and network change detection

### Token Purchase
- Fixed price: 1 USDT = 1 CleanSpark token
- Supports USDT payment
- Automatic referral tracking via URL parameter `?ref=ADDRESS`

### Dashboard
- **Mining Balance**: Your total CleanSpark tokens
- **Pending Reward to Claim**: Available rewards ready to withdraw
- **Reward Status**: Shows when next reward will be available
- Auto-refreshes every 30 seconds

### Claiming Rewards
- Click "Claim Mining Earnings" to withdraw pending rewards
- Rewards are automatically calculated based on your token balance

## Browser Requirements

- **Desktop**: Chrome, Firefox, Brave, or Edge with MetaMask extension
- **Mobile**: MetaMask mobile app with in-app browser

## Important Notes

⚠️ **File Protocol Limitation**: MetaMask cannot work with `file://` URLs. Always use a local HTTP server (`http://localhost:8000`).

## License

This project is for educational purposes.

