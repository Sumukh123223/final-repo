// Reown AppKit - Vanilla JavaScript Implementation
// Following official guide: https://docs.reown.com/appkit/javascript/core/installation

import { createAppKit } from '@reown/appkit'
import { bsc } from '@reown/appkit/networks'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'

// 1. Get a project ID at https://dashboard.reown.com
const projectId = '82dc70494a3772c5807c04ceae640981'

// 2. Set up networks (BSC Mainnet)
export const networks = [bsc]

// 3. Set up Wagmi adapter
const wagmiAdapter = new WagmiAdapter({
  projectId,
  networks
})

// 4. Configure metadata
const metadata = {
  name: 'CleanSpark',
  description: 'CleanSpark Mining Platform',
  url: window.location.origin,
  icons: ['https://files.reown.com/reown-social-card.png']
}

// 5. Create the modal
export const modal = createAppKit({
  adapters: [wagmiAdapter],
  networks: [bsc],
  metadata,
  projectId,
  features: {
    analytics: true // Optional - defaults to your Cloud configuration
  }
})

// 6. Get wagmiConfig for contract interactions
export const wagmiConfig = wagmiAdapter.wagmiConfig

// Make modal globally available for HTML buttons
window.modal = modal
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

window.openNetworkModal = () => {
  try {
    if (modal && typeof modal.open === 'function') {
      modal.open({ view: 'Networks' })
    }
  } catch (error) {
    console.error('Error opening network modal:', error)
  }
}

console.log('✅ Reown AppKit initialized successfully!')
console.log('✅ Modal:', modal)
console.log('✅ Wagmi Config:', wagmiConfig)

