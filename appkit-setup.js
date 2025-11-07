// Reown AppKit Setup - Using ES Modules with CDN
// This will show the official AppKit UI with wallet list, search, email/Google login

// Wait for DOM to be ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAppKit)
} else {
    initAppKit()
}

async function initAppKit() {
    try {
        console.log('🚀 Initializing Reown AppKit...')
        
        // Import AppKit from CDN (using pinned versions to avoid breaking changes)
        const { createAppKit } = await import('https://esm.sh/@reown/appkit@1.8.12')
        const { WagmiAdapter } = await import('https://esm.sh/@reown/appkit-adapter-wagmi@1.0.4')
        
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
        
        const projectId = '82dc70494a3772c5807c04ceae640981'
        
        // Set up Wagmi adapter
        const wagmiAdapter = new WagmiAdapter({
            projectId,
            networks: [bsc]
        })
        
        // Configure metadata
        const metadata = {
            name: 'CleanSpark',
            description: 'CleanSpark Mining Platform',
            url: window.location.origin,
            icons: ['https://files.reown.com/reown-social-card.png']
        }
        
        // Create the modal
        const modal = createAppKit({
            adapters: [wagmiAdapter],
            networks: [bsc],
            metadata,
            projectId,
            features: {
                analytics: true,
                email: false, // Disable email auth to avoid W3mFrameProviderSingleton error
                socials: false // Disable social auth to avoid W3mFrameProviderSingleton error
            }
        })
        
        // Get wagmiConfig for contract interactions
        const wagmiConfig = wagmiAdapter.wagmiConfig
        
        // Make modal globally available
        window.modal = modal
        window.wagmiConfig = wagmiConfig
        window.walletModalReady = true
        
        // Set up global functions
        window.openConnectModal = () => {
            // Try to open AppKit modal, with fallback to MetaMask
            try {
                if (modal && typeof modal.open === 'function') {
                    // Open modal asynchronously without blocking
                    setTimeout(() => {
                        try {
                            modal.open()
                        } catch (error) {
                            console.error('AppKit modal failed, using MetaMask fallback:', error)
                            // Fallback to MetaMask
                            if (window.connectMetaMask) {
                                window.connectMetaMask()
                            }
                        }
                    }, 0)
                } else {
                    console.warn('AppKit modal not ready, using MetaMask fallback')
                    // Fallback to MetaMask
                    if (window.connectMetaMask) {
                        window.connectMetaMask()
                    }
                }
            } catch (error) {
                console.error('Error in openConnectModal, using MetaMask fallback:', error)
                // Fallback to MetaMask
                if (window.connectMetaMask) {
                    window.connectMetaMask()
                }
            }
        }
        
        window.openWalletModal = window.openConnectModal
        
        // Listen for account changes using Wagmi's watchAccount
        const { watchAccount } = await import('https://esm.sh/@wagmi/core@2.4.11')
        
        // Watch for account changes
        const unwatch = watchAccount(wagmiConfig, {
            onChange(account) {
                if (account && account.isConnected && account.address) {
                    window.account = account.address
                    
                    // Get provider and signer from wagmi
                    const publicClient = wagmiConfig.getPublicClient()
                    wagmiConfig.getWalletClient().then((walletClient) => {
                        // Create ethers provider/signer from wagmi
                        if (typeof ethers !== 'undefined') {
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
                    })
                } else {
                    window.account = null
                    window.provider = null
                    window.signer = null
                    updateWalletUI()
                }
            }
        })
        
        // Store unwatch function
        window.unwatchAccount = unwatch
        
        console.log('✅ Reown AppKit initialized successfully!')
        console.log('✅ Modal:', modal)
        
    } catch (error) {
        console.error('❌ Failed to initialize AppKit:', error)
        console.error('Error details:', error.message, error.stack)
        alert('Failed to load wallet connection. Please refresh the page.\n\nError: ' + error.message)
    }
}

function updateWalletUI() {
    const walletBtn = document.getElementById('walletConnectBtn')
    const walletInfo = document.getElementById('walletInfo')
    const walletAddress = document.getElementById('walletAddress')
    
    if (window.account) {
        if (walletBtn) walletBtn.style.display = 'none'
        if (walletInfo) walletInfo.style.display = 'flex'
        if (walletAddress) {
            walletAddress.textContent = `${window.account.substring(0, 6)}...${window.account.substring(38)}`
        }
    } else {
        if (walletBtn) walletBtn.style.display = 'block'
        if (walletInfo) walletInfo.style.display = 'none'
    }
}

