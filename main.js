// MetaMask Only - WalletConnect/AppKit Removed
// This file now only supports MetaMask wallet connection

// Set modal to null to prevent any WalletConnect usage
window.modal = null
window.wagmiConfig = null
window.walletModalReady = false

// Helper function to detect mobile device
function isMobileDevice() {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
}

// Helper function to detect if MetaMask mobile app is installed
function checkMetaMaskMobile() {
  if (isMobileDevice()) {
    // Try to detect MetaMask mobile
    const userAgent = navigator.userAgent.toLowerCase()
    if (userAgent.includes('metamask') || window.ethereum?.isMetaMask) {
      return true
    }
    return false
  }
  return false
}

// Set up global functions for onclick handlers
async function connectMetaMask() {
  try {
    const hasEthereum = typeof window !== 'undefined' && typeof window.ethereum !== 'undefined'
    const isMobile = isMobileDevice()
    
    if (!hasEthereum) {
      if (isMobile) {
        const message = 'MetaMask not detected!\n\n' +
          '📱 For Mobile:\n' +
          '1. Install MetaMask app from App Store/Play Store\n' +
          '2. Open this site in MetaMask\'s in-app browser\n' +
          '   (Menu → Browser → Enter URL)\n' +
          '3. Or use MetaMask\'s "Connect" feature\n\n' +
          '💻 For Desktop:\n' +
          'Install MetaMask browser extension'
        alert(message)
      } else {
        alert('MetaMask not found. Please install MetaMask browser extension to continue.\n\nGet it at: https://metamask.io/download/')
      }
      return
    }

    const providerCandidate = window.ethereum.providers?.find?.(p => p && p.isMetaMask) || window.ethereum
    if (!providerCandidate || (!providerCandidate.isMetaMask && !window.ethereum.isMetaMask)) {
      alert('MetaMask provider not detected. Please ensure MetaMask is enabled.')
      return
    }

    // Request accounts
    const accounts = await providerCandidate.request({ method: 'eth_requestAccounts' })
    if (!accounts || accounts.length === 0) {
      alert('No accounts returned from MetaMask.')
      return
    }

    // Set global state
    window.account = accounts[0]

    // Prefer ethers if available
    if (typeof ethers !== 'undefined' && ethers?.providers?.Web3Provider) {
      window.provider = new ethers.providers.Web3Provider(providerCandidate)
      window.signer = window.provider.getSigner()
    } else {
      window.provider = providerCandidate
      window.signer = providerCandidate
    }

    // Listen for account/network changes
    try {
      providerCandidate.removeAllListeners?.('accountsChanged')
      providerCandidate.on?.('accountsChanged', (accs) => {
        if (Array.isArray(accs) && accs[0]) {
          window.account = accs[0]
        } else {
          window.account = null
        }
        updateWalletUI()
      })
      providerCandidate.removeAllListeners?.('chainChanged')
      providerCandidate.on?.('chainChanged', () => {
        updateWalletUI()
      })
    } catch (_) {}

    // Dispatch event for any listeners
    window.dispatchEvent(new CustomEvent('walletConnected', {
      detail: {
        account: window.account,
        provider: window.provider,
        signer: window.signer
      }
    }))

    updateWalletUI()
  } catch (error) {
    console.error('Error connecting MetaMask:', error)
    alert('Error connecting MetaMask: ' + (error?.message || String(error)))
  }
}

window.openConnectModal = () => {
  // Force MetaMask connect (do not open WalletConnect/AppKit modal)
  connectMetaMask()
}

window.openWalletModal = window.openConnectModal

// Show AppKit button once it's ready (after a short delay for web component registration)
setTimeout(() => {
  const appkitButton = document.getElementById('appkitButton')
  const fallbackButton = document.getElementById('walletConnectBtn')

  // Hide AppKit/WalletConnect UI and prefer our MetaMask button
  if (appkitButton) appkitButton.style.display = 'none'
  if (fallbackButton) fallbackButton.style.display = 'block'
  console.log('✅ Using MetaMask-only connect UI')
}, 500)

window.openNetworkModal = () => {
  // Network switching handled by MetaMask directly
  alert('Please switch networks using MetaMask extension')
}

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

console.log('✅ MetaMask-only wallet connection initialized')
console.log('✅ WalletConnect/AppKit removed - using MetaMask only')

