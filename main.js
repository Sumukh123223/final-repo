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
    console.log('🔵 Attempting to connect MetaMask...')
    console.log('window.ethereum:', window.ethereum)
    console.log('window.ethereum?.isMetaMask:', window.ethereum?.isMetaMask)
    console.log('window.ethereum?.providers:', window.ethereum?.providers)
    
    const hasEthereum = typeof window !== 'undefined' && typeof window.ethereum !== 'undefined'
    const isMobile = isMobileDevice()
    
    if (!hasEthereum) {
      // Check if page is opened as file://
      const isFileProtocol = window.location.protocol === 'file:'
      
      if (isFileProtocol) {
        const message = 'IMPORTANT: File Protocol Detected!\n\n' +
          'MetaMask cannot work with file:// URLs for security reasons.\n\n' +
          'SOLUTION:\n' +
          '1. Open Terminal in this folder\n' +
          '2. Run: ./start-server.sh\n' +
          '   (or: python3 -m http.server 8000)\n' +
          '3. Open browser to: http://localhost:8000\n' +
          '4. Then try connecting again\n\n' +
          'This will serve the site via HTTP, allowing MetaMask to work.'
        if (window.showCustomModal) {
          window.showCustomModal('File Protocol Detected', message, 'warning')
        } else if (window.originalAlert) {
          window.originalAlert('⚠️ ' + message)
        } else {
          alert('⚠️ ' + message)
        }
        return
      }
      
      if (isMobile) {
        const message = 'MetaMask not detected!\n\n' +
          'For Mobile:\n' +
          '1. Install MetaMask app from App Store/Play Store\n' +
          '2. Open this site in MetaMask\'s in-app browser\n' +
          '   (Menu → Browser → Enter URL)\n' +
          '3. Or use MetaMask\'s "Connect" feature\n\n' +
          'For Desktop:\n' +
          'Install MetaMask browser extension'
        if (window.showCustomModal) {
          window.showCustomModal('MetaMask Not Found', message, 'warning')
        } else if (window.originalAlert) {
          window.originalAlert('⚠️ ' + message)
        } else {
          alert('⚠️ ' + message)
        }
      } else {
        const message = 'MetaMask not found. Please:\n\n1. Install MetaMask extension\n2. Refresh this page\n3. Make sure MetaMask is unlocked\n4. Make sure you\'re using http:// not file://\n\nGet it at: https://metamask.io/download/'
        if (window.showCustomModal) {
          window.showCustomModal('MetaMask Not Found', message, 'warning')
        } else if (window.originalAlert) {
          window.originalAlert(message)
        } else {
          alert(message)
        }
      }
      return
    }

    // More flexible provider detection
    let providerCandidate = null
    
    // Check if there are multiple providers (like when multiple wallets are installed)
    if (window.ethereum.providers && Array.isArray(window.ethereum.providers)) {
      // Try to find MetaMask in the providers array
      providerCandidate = window.ethereum.providers.find(p => p && p.isMetaMask)
      console.log('Found MetaMask in providers array:', providerCandidate)
    }
    
    // If not found in providers, use window.ethereum directly
    if (!providerCandidate) {
      providerCandidate = window.ethereum
      console.log('Using window.ethereum directly:', providerCandidate)
    }
    
    // Even if isMetaMask is not set, try to use it (some versions don't set this flag)
    // We'll try to connect anyway and let MetaMask handle it
    if (!providerCandidate) {
      const message = 'MetaMask provider not detected. Please:\n\n1. Make sure MetaMask extension is installed and enabled\n2. Refresh this page\n3. Check browser console for errors'
      if (window.showCustomModal) {
        window.showCustomModal('MetaMask Not Detected', message, 'error')
      } else if (window.originalAlert) {
        window.originalAlert(message)
      } else {
        alert(message)
      }
      return
    }

    console.log('Using provider:', providerCandidate)
    console.log('Provider isMetaMask:', providerCandidate.isMetaMask)

    // Request accounts - this will trigger MetaMask popup
    console.log('Requesting accounts from MetaMask...')
    const accounts = await providerCandidate.request({ method: 'eth_requestAccounts' })
    if (!accounts || accounts.length === 0) {
      const message = 'No accounts returned from MetaMask. Please:\n\n1. Make sure you have at least one account in MetaMask\n2. Unlock MetaMask\n3. Try connecting again'
      if (window.showCustomModal) {
        window.showCustomModal('No Accounts', message, 'warning')
      } else if (window.originalAlert) {
        window.originalAlert(message)
      } else {
        alert(message)
      }
      return
    }
    
    console.log('✅ Accounts received:', accounts)

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
        const errorMsg = 'Error connecting MetaMask: ' + (error?.message || String(error))
        if (window.showCustomModal) {
          window.showCustomModal('Connection Error', errorMsg, 'error')
        } else if (window.originalAlert) {
          window.originalAlert(errorMsg)
        } else {
          alert(errorMsg)
        }
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
      const message = 'Please switch networks using MetaMask extension'
      if (window.showCustomModal) {
        window.showCustomModal('Switch Network', message, 'info')
      } else if (window.originalAlert) {
        window.originalAlert(message)
      } else {
        alert(message)
      }
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

