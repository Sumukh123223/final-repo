// Reown AppKit - Official Implementation
// Following official guide: https://docs.reown.com/appkit/javascript/core/installation
// Using ES modules from CDN (esm.sh) for vanilla JavaScript without npm/build tools

// CRITICAL: This log MUST appear if module loads
console.log('📦📦📦 main.js MODULE EXECUTING - This log proves the module is running!')
console.log('📦 Current URL:', window.location.href)
console.log('📦 Timestamp:', new Date().toISOString())

// Use top-level await (ES modules support this natively)
try {
  console.log('📦 Starting AppKit initialization...')
  
  // Use pinned versions to avoid breaking changes and W3mFrameProviderSingleton errors
  // Try version 1.6.3 which should be more stable
  console.log('📦 Importing createAppKit from esm.sh...')
  const appkitModule = await import('https://esm.sh/@reown/appkit@1.6.3')
  const { createAppKit } = appkitModule
  console.log('✅ createAppKit imported:', typeof createAppKit)
  
  console.log('📦 Importing WagmiAdapter from esm.sh...')
  // Pin WagmiAdapter to a version compatible with AppKit 1.6.3
  const adapterModule = await import('https://esm.sh/@reown/appkit-adapter-wagmi@1.0.3')
  const { WagmiAdapter } = adapterModule
  console.log('✅ WagmiAdapter imported:', typeof WagmiAdapter)
  
  console.log('✅ All imports loaded successfully')
  
  // Import watchAccount dynamically to avoid 404 errors
  let watchAccount = null
  
  // Define BSC network manually (since networks import path is problematic)
  const bsc = {
    id: 56,
    name: 'BNB Smart Chain',
    nativeCurrency: {
      decimals: 18,
      name: 'BNB',
      symbol: 'BNB',
    },
    rpcUrls: {
      default: {
        http: ['https://bsc-dataseed1.binance.org'],
      },
      public: {
        http: ['https://bsc-dataseed1.binance.org'],
      },
    },
    blockExplorers: {
      default: {
        name: 'BscScan',
        url: 'https://bscscan.com',
      },
    },
  }
  
  // 1. Get a project ID at https://dashboard.reown.com
  const projectId = '82dc70494a3772c5807c04ceae640981'
  
  // Export networks (removed export to avoid syntax errors - not needed externally)
  const networks = [bsc]
  
  // 2. Set up Wagmi adapter
  console.log('🔧 Creating WagmiAdapter...')
  const wagmiAdapter = new WagmiAdapter({
    projectId,
    networks
  })
  console.log('✅ WagmiAdapter created:', wagmiAdapter)
  
  // 3. Configure the metadata
  const metadata = {
    name: 'CleanSpark',
    description: 'CleanSpark Mining Platform',
    url: window.location.origin, // origin must match your domain & subdomain
    icons: ['https://files.reown.com/reown-social-card.png']
  }
  
  // 4. Create the modal
  let modal
  let wagmiConfig
  
  try {
    console.log('🚀 Creating AppKit modal...')
    console.log('🚀 WagmiAdapter:', wagmiAdapter)
    console.log('🚀 Networks:', [bsc])
    console.log('🚀 Project ID:', projectId)
    
    // Suppress W3mFrameProviderSingleton errors temporarily
    const originalError = window.onerror
    const suppressedErrors = []
    window.onerror = function(msg, url, line, col, error) {
      if (msg && msg.includes('W3mFrameProviderSingleton')) {
        suppressedErrors.push(msg)
        console.warn('⚠️ Suppressed W3mFrameProviderSingleton error during AppKit creation')
        return true // Suppress the error
      }
      if (originalError) return originalError.apply(this, arguments)
      return false
    }
    
    try {
      // Wrap in try-catch to handle AccountController and other module errors gracefully
      modal = createAppKit({
        adapters: [wagmiAdapter],
        networks: [bsc],
        metadata,
        projectId,
        features: {
          analytics: true, // Optional - defaults to your Cloud configuration
          email: false, // Disable email auth to avoid W3mFrameProviderSingleton error
          socials: false // Disable social auth to avoid W3mFrameProviderSingleton error
        }
      })
    } finally {
      // Restore original error handler
      window.onerror = originalError
    }
    
    console.log('✅ AppKit modal created:', modal)
    console.log('✅ Modal type:', typeof modal)
    console.log('✅ Modal.open type:', typeof modal?.open)
    
    // Check if modal has open method
    if (modal && typeof modal.open === 'function') {
      console.log('✅ Modal.open() is available')
    } else {
      console.warn('⚠️ Modal.open() is not available, but modal exists:', modal)
    }
    
    // 5. Get wagmiConfig for contract interactions
    wagmiConfig = wagmiAdapter.wagmiConfig
    
    // Make modal globally available for HTML buttons
    window.modal = modal
    window.wagmiConfig = wagmiConfig
    window.walletModalReady = true
    
    console.log('✅ AppKit initialized and ready!')
    console.log('✅ window.modal set:', !!window.modal)
    console.log('✅ window.walletModalReady:', window.walletModalReady)
    console.log('✅ window.openConnectModal available:', typeof window.openConnectModal)
  } catch (error) {
    console.error('❌ Error creating AppKit modal:', error)
    console.error('Error details:', error.message, error.stack)
    
    // Even if there's an error, check if modal was partially created
    if (modal) {
      console.log('⚠️ Modal was partially created, trying to use it anyway')
      window.modal = modal
      window.walletModalReady = true
    } else {
      window.modal = null
      window.walletModalReady = false
      console.error('❌ AppKit initialization failed - WalletConnect will not work')
    }
  }
  
  // Set up global functions for onclick handlers - WalletConnect ONLY
  window.openConnectModal = () => {
    console.log('🔵 openConnectModal called - WalletConnect AppKit modal')
    
    // Force WalletConnect AppKit modal to open - NO MetaMask fallback
    try {
      if (modal) {
        console.log('✅ WalletConnect AppKit modal exists, opening...')
        // Open modal directly
        if (typeof modal.open === 'function') {
          modal.open()
          console.log('✅ WalletConnect modal.open() called')
          return
        } else {
          console.error('❌ modal.open is not a function:', typeof modal.open)
          alert('⚠️ WalletConnect is not ready. Please refresh the page and wait for WalletConnect to load.')
          return
        }
      } else {
        console.error('❌ WalletConnect AppKit modal is null/undefined')
        alert('⚠️ WalletConnect is not ready. Please refresh the page and wait for WalletConnect to load.')
        return
      }
    } catch (error) {
      console.error('❌ Error opening WalletConnect modal:', error)
      // Try to open anyway, even with module errors
      try {
        if (modal && typeof modal.open === 'function') {
          modal.open()
        } else {
          alert('⚠️ WalletConnect is not ready. Please refresh the page and wait for WalletConnect to load.')
        }
      } catch (e) {
        console.error('❌ Failed to open WalletConnect modal:', e)
        alert('⚠️ WalletConnect is not ready. Please refresh the page and wait for WalletConnect to load.')
      }
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
  
  // Listen for account changes - import watchAccount dynamically
  async function setupAccountWatcher() {
    try {
      // Try to import watchAccount - use @latest if specific version fails
      const wagmiModule = await import('https://esm.sh/@wagmi/core@latest')
      watchAccount = wagmiModule.watchAccount
      
      if (watchAccount && wagmiConfig) {
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
        console.log('✅ Account watcher set up successfully')
      }
    } catch (error) {
      console.warn('⚠️ Could not load watchAccount, wallet connection will still work via modal events:', error)
      // Wallet connection will still work via modal events, just account watching won't work
    }
  }
  
  // Setup account watcher after a short delay to ensure everything is loaded
  setTimeout(setupAccountWatcher, 1000)
  
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
  
} catch (error) {
  console.error('❌ CRITICAL: AppKit initialization failed:', error)
  console.error('Error details:', error.message, error.stack)
  window.modal = null
  window.walletModalReady = false
  window.openConnectModal = () => {
    alert('❌ WalletConnect failed to initialize. Please refresh the page.\n\nError: ' + error.message)
  }
}
