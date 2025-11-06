// WalletConnect Integration - Vanilla JavaScript (No React/npm)
// Uses WalletConnect v2 Ethereum Provider with Reown AppKit Project ID
// WalletConnect ONLY - No MetaMask

const WALLETCONNECT_PROJECT_ID = '82dc70494a3772c5807c04ceae640981'

// Global wallet state
let walletConnectProvider = null
let provider = null
let signer = null
let account = null

// Initialize WalletConnect provider
async function initWalletConnect() {
    // Check if WalletConnect Ethereum Provider is available
    // When loaded via CDN, it might be under different names
    let EthereumProvider = null
    
    // Check multiple possible locations
    if (typeof window.EthereumProvider !== 'undefined') {
        EthereumProvider = window.EthereumProvider
        console.log('✅ Found EthereumProvider in window.EthereumProvider')
    } else if (typeof window.WalletConnectEthereumProvider !== 'undefined') {
        EthereumProvider = window.WalletConnectEthereumProvider
        console.log('✅ Found WalletConnectEthereumProvider')
    } else if (window['@walletconnect/ethereum-provider']) {
        // Check scoped package name (UMD bundle often exposes with package name)
        const wcModule = window['@walletconnect/ethereum-provider']
        console.log('✅ Found @walletconnect/ethereum-provider, inspecting...')
        console.log('Module keys:', Object.keys(wcModule || {}))
        
        if (wcModule.EthereumProvider) {
            EthereumProvider = wcModule.EthereumProvider
            console.log('✅ Found EthereumProvider in @walletconnect/ethereum-provider.EthereumProvider')
        } else if (wcModule.default) {
            EthereumProvider = wcModule.default
            console.log('✅ Found default export in @walletconnect/ethereum-provider.default')
        } else if (typeof wcModule.init === 'function') {
            // The module itself might be the provider
            EthereumProvider = wcModule
            console.log('✅ Using @walletconnect/ethereum-provider directly as provider')
        } else {
            // Try to find the provider class/function in the module
            const keys = Object.keys(wcModule)
            for (const key of keys) {
                if (key.includes('Provider') || key.includes('Ethereum')) {
                    EthereumProvider = wcModule[key]
                    console.log('✅ Found provider as @walletconnect/ethereum-provider.' + key)
                    break
                }
            }
        }
    } else if (typeof window.WalletConnect !== 'undefined') {
        if (window.WalletConnect.EthereumProvider) {
            EthereumProvider = window.WalletConnect.EthereumProvider
            console.log('✅ Found WalletConnect.EthereumProvider')
        } else if (window.WalletConnect.default && window.WalletConnect.default.EthereumProvider) {
            EthereumProvider = window.WalletConnect.default.EthereumProvider
            console.log('✅ Found WalletConnect.default.EthereumProvider')
        }
    }
    
    if (!EthereumProvider) {
        console.error('WalletConnect Ethereum Provider not loaded!')
        console.log('Available globals:', Object.keys(window).filter(k => 
            k.toLowerCase().includes('wallet') || 
            k.toLowerCase().includes('connect') ||
            k.toLowerCase().includes('ethereum') ||
            k.includes('@')
        ))
        // Inspect the scoped package if it exists
        if (window['@walletconnect/ethereum-provider']) {
            console.log('Inspecting @walletconnect/ethereum-provider:', window['@walletconnect/ethereum-provider'])
            console.log('Type:', typeof window['@walletconnect/ethereum-provider'])
            console.log('Keys:', Object.keys(window['@walletconnect/ethereum-provider'] || {}))
        }
        alert('❌ WalletConnect not loaded!\n\nPlease refresh the page and wait for WalletConnect to load, then try again.')
        return false
    }

    try {
        walletConnectProvider = await EthereumProvider.init({
            projectId: WALLETCONNECT_PROJECT_ID,
            chains: [56], // BSC Mainnet chain ID
            showQrModal: true,
            metadata: {
                name: 'CleanSpark',
                description: 'CleanSpark Mining Platform',
                url: window.location.origin,
                icons: ['https://files.reown.com/reown-social-card.png']
            }
        })

        // Enable session (connect)
        await walletConnectProvider.enable()

        // Get accounts
        const accounts = walletConnectProvider.accounts
        if (accounts && accounts.length > 0) {
            account = accounts[0]

            // Create ethers provider from WalletConnect provider
            provider = new ethers.providers.Web3Provider(walletConnectProvider)
            signer = provider.getSigner()

            // Update global references
            window.provider = provider
            window.signer = signer
            window.account = account

            // Setup event listeners
            setupWalletConnectListeners()

            return true
        }
        return false
    } catch (error) {
        console.error('WalletConnect error:', error)
        if (error.message && error.message.includes('User rejected')) {
            console.log('User rejected WalletConnect connection')
        } else {
            alert('Failed to connect via WalletConnect: ' + (error.message || error))
        }
        return false
    }
}

// Setup WalletConnect event listeners
function setupWalletConnectListeners() {
    if (!walletConnectProvider) return

    walletConnectProvider.on('accountsChanged', (accounts) => {
        if (accounts && accounts.length > 0) {
            account = accounts[0]
            window.account = account
            updateWalletUI()
            window.dispatchEvent(new CustomEvent('walletConnected', {
                detail: { account, provider, signer }
            }))
        } else {
            disconnectWallet()
        }
    })

    walletConnectProvider.on('chainChanged', (chainId) => {
        console.log('Chain changed:', chainId)
        window.location.reload()
    })

    walletConnectProvider.on('disconnect', () => {
        disconnectWallet()
    })
}

// Connect via WalletConnect (ONLY option)
window.connectWallet = async function() {
    // Check if ethers is loaded
    if (typeof ethers === 'undefined') {
        alert('⚠️ ethers.js is loading... Please wait a moment and try again.')
        return
    }

    // Check if WalletConnect is available (multiple checks)
    const hasWalletConnect = 
        typeof window.EthereumProvider !== 'undefined' || 
        typeof window.WalletConnectEthereumProvider !== 'undefined' ||
        window['@walletconnect/ethereum-provider'] !== undefined ||
        (typeof window.WalletConnect !== 'undefined' && (
            window.WalletConnect.EthereumProvider || 
            (window.WalletConnect.default && window.WalletConnect.default.EthereumProvider)
        ))

    if (!hasWalletConnect) {
        console.warn('WalletConnect not found. Available globals:', 
            Object.keys(window).filter(k => 
                k.toLowerCase().includes('wallet') || 
                k.toLowerCase().includes('connect')
            )
        )
        alert('⚠️ WalletConnect not loaded!\n\nPlease wait a few seconds for WalletConnect to load, then try again.\n\nIf this persists, refresh the page.')
        return
    }

    try {
        console.log('🔄 Attempting WalletConnect connection...')
        const connected = await initWalletConnect()
        if (connected) {
            updateWalletUI()
            window.dispatchEvent(new CustomEvent('walletConnected', {
                detail: { account, provider, signer }
            }))
            console.log('✅ WalletConnect connected:', account)
            return true
        }
    } catch (error) {
        console.error('WalletConnect connection error:', error)
        if (!error.message || !error.message.includes('User rejected')) {
            alert('Failed to connect via WalletConnect: ' + (error.message || error))
        }
    }
    return false
}

// Disconnect wallet
window.disconnectWallet = function() {
    // Disconnect WalletConnect if connected
    if (walletConnectProvider) {
        try {
            walletConnectProvider.disconnect()
        } catch (error) {
            console.error('WalletConnect disconnect error:', error)
        }
    }

    // Clear all state
    walletConnectProvider = null
    provider = null
    signer = null
    account = null

    // Update global references
    window.provider = null
    window.signer = null
    window.account = null

    updateWalletUI()
    clearDashboard()

    // Update dashboard sections
    const notConnected = document.getElementById('notConnected')
    const connectedDashboard = document.getElementById('connectedDashboard')
    const buyNotConnected = document.getElementById('buyNotConnected')
    const buyConnected = document.getElementById('buyConnected')

    if (notConnected) notConnected.style.display = 'block'
    if (connectedDashboard) connectedDashboard.style.display = 'none'
    if (buyNotConnected) buyNotConnected.style.display = 'block'
    if (buyConnected) buyConnected.style.display = 'none'

    console.log('✅ Wallet disconnected')
}

// Update wallet UI
function updateWalletUI() {
    const walletBtn = document.getElementById('walletConnectBtn')
    const walletInfo = document.getElementById('walletInfo')
    const walletAddress = document.getElementById('walletAddress')

    if (account) {
        if (walletBtn) walletBtn.style.display = 'none'
        if (walletInfo) walletInfo.style.display = 'flex'
        if (walletAddress) {
            walletAddress.textContent = `${account.substring(0, 6)}...${account.substring(38)}`
        }
    } else {
        if (walletBtn) walletBtn.style.display = 'block'
        if (walletInfo) walletInfo.style.display = 'none'
    }
}

// Clear dashboard
function clearDashboard() {
    const balanceEl = document.getElementById('tokenBalance')
    const rewardsEl = document.getElementById('pendingRewards')
    if (balanceEl) balanceEl.textContent = '0.0000'
    if (rewardsEl) rewardsEl.textContent = '0.0000'
}

// Check if already connected on page load (WalletConnect session restore)
window.addEventListener('load', async () => {
    if (typeof ethers === 'undefined') {
        console.log('⏳ Waiting for ethers.js...')
        return
    }

    // Check WalletConnect session (WalletConnect persists sessions)
    // This will be handled automatically when WalletConnect provider initializes
    // The session will be restored if user was previously connected
})

// Make connect function available globally
window.openWalletModal = window.connectWallet

console.log('✅ WalletConnect integration loaded (WalletConnect ONLY)')
console.log('✅ Project ID: ' + WALLETCONNECT_PROJECT_ID)
