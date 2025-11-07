// Reown AppKit - Official Implementation
// Following official guide: https://docs.reown.com/appkit/javascript/core/installation
// Using ES modules from CDN (esm.sh) for vanilla JavaScript without npm/build tools

import { createAppKit } from 'https://esm.sh/@reown/appkit@latest'
import { bsc } from 'https://esm.sh/@reown/appkit/networks@latest'
import { WagmiAdapter } from 'https://esm.sh/@reown/appkit-adapter-wagmi@latest'
import { watchAccount } from 'https://esm.sh/@wagmi/core@latest'

// 1. Get a project ID at https://dashboard.reown.com
const projectId = '82dc70494a3772c5807c04ceae640981'

export const networks = [bsc]

// 2. Set up Wagmi adapter
const wagmiAdapter = new WagmiAdapter({
  projectId,
  networks
})

// 3. Configure the metadata
const metadata = {
  name: 'CleanSpark',
  description: 'CleanSpark Mining Platform',
  url: window.location.origin, // origin must match your domain & subdomain
  icons: ['https://files.reown.com/reown-social-card.png']
}

// 4. Create the modal
export const modal = createAppKit({
  adapters: [wagmiAdapter],
  networks: [bsc],
  metadata,
  projectId,
  features: {
    analytics: true // Optional - defaults to your Cloud configuration
  }
})

// 5. Get wagmiConfig for contract interactions
export const wagmiConfig = wagmiAdapter.wagmiConfig

// Make modal globally available for HTML buttons
window.modal = modal
window.wagmiConfig = wagmiConfig
window.walletModalReady = true

// Set up global functions for onclick handlers
window.openConnectModal = () => {
  try {
    if (modal && typeof modal.open === 'function') {
      modal.open()
    } else {
      console.error('Modal not ready')
      alert('Wallet connection not ready. Please refresh the page.')
    }
  } catch (error) {
    console.error('Error opening modal:', error)
    alert('Error connecting wallet: ' + error.message)
  }
}

window.openWalletModal = window.openConnectModal

// Show AppKit button once it's ready (after a short delay for web component registration)
setTimeout(() => {
  const appkitButton = document.getElementById('appkitButton')
  const fallbackButton = document.getElementById('walletConnectBtn')
  
  if (appkitButton && typeof appkitButton !== 'undefined') {
    // Check if AppKit button is actually rendered
    const computedStyle = window.getComputedStyle(appkitButton)
    if (computedStyle.display !== 'none' || appkitButton.offsetParent !== null) {
      // AppKit button is visible, hide fallback
      if (fallbackButton) fallbackButton.style.display = 'none'
      appkitButton.style.display = 'block'
      console.log('✅ AppKit button is visible')
    } else {
      // AppKit button not rendering, keep fallback visible
      if (fallbackButton) fallbackButton.style.display = 'block'
      console.log('⚠️ AppKit button not rendering, using fallback')
    }
  } else {
    // AppKit button element not found, keep fallback visible
    if (fallbackButton) fallbackButton.style.display = 'block'
    console.log('⚠️ AppKit button element not found, using fallback')
  }
}, 2000) // Wait 2 seconds for AppKit to initialize

window.openNetworkModal = () => {
  try {
    if (modal && typeof modal.open === 'function') {
      modal.open({ view: 'Networks' })
    }
  } catch (error) {
    console.error('Error opening network modal:', error)
  }
}

// Listen for account changes
watchAccount(wagmiConfig, {
  onChange(account) {
    if (account && account.isConnected && account.address) {
      window.account = account.address
      
      // Get provider and signer from wagmi
      const publicClient = wagmiConfig.getPublicClient()
      wagmiConfig.getWalletClient().then((walletClient) => {
        // Create ethers provider/signer from wagmi if ethers is available
        if (typeof ethers !== 'undefined') {
          // Convert wagmi client to ethers provider
          window.provider = new ethers.providers.Web3Provider(walletClient.transport)
          window.signer = window.provider.getSigner()
        } else {
          window.provider = publicClient
          window.signer = walletClient
        }
        
        // Dispatch event for app-simple.js
        window.dispatchEvent(new CustomEvent('walletConnected', {
          detail: { 
            account: window.account, 
            provider: window.provider, 
            signer: window.signer 
          }
        }))
        
        // Update UI
        updateWalletUI()
      }).catch((error) => {
        console.error('Error getting wallet client:', error)
      })
    } else {
      window.account = null
      window.provider = null
      window.signer = null
      updateWalletUI()
    }
  }
})

function updateWalletUI() {
  const appkitButton = document.getElementById('appkitButton')
  const walletBtn = document.getElementById('walletConnectBtn')
  const walletInfo = document.getElementById('walletInfo')
  const walletAddress = document.getElementById('walletAddress')
  
  if (window.account) {
    // Hide both buttons when connected
    if (appkitButton) appkitButton.style.display = 'none'
    if (walletBtn) walletBtn.style.display = 'none'
    if (walletInfo) walletInfo.style.display = 'flex'
    if (walletAddress) {
      walletAddress.textContent = `${window.account.substring(0, 6)}...${window.account.substring(38)}`
    }
  } else {
    // Show appropriate button when not connected
    // Prefer AppKit button if available, otherwise show fallback
    if (appkitButton && appkitButton.offsetParent !== null) {
      appkitButton.style.display = 'block'
      if (walletBtn) walletBtn.style.display = 'none'
    } else {
      if (walletBtn) walletBtn.style.display = 'block'
      if (appkitButton) appkitButton.style.display = 'none'
    }
    if (walletInfo) walletInfo.style.display = 'none'
  }
}

console.log('✅ Reown AppKit initialized successfully!')
console.log('✅ Modal:', modal)
console.log('✅ Wagmi Config:', wagmiConfig)

