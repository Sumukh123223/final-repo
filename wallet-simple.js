// Simple Wallet Connection - Works without npm/build tools
// Uses direct MetaMask and ethers.js from CDN

// Simple wallet connection using MetaMask
let provider = null
let signer = null
let account = null

// Make these globally available
window.provider = provider
window.signer = signer
window.account = account

// Initialize provider
async function initProvider() {
    if (typeof ethers === 'undefined') {
        console.error('ethers.js not loaded!')
        return false
    }
    
    if (typeof window.ethereum !== 'undefined') {
        // ethers.js v5 uses Web3Provider
        provider = new ethers.providers.Web3Provider(window.ethereum)
        try {
            // Request account access
            const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' })
            if (accounts.length > 0) {
                account = accounts[0]
                signer = await provider.getSigner()
                
                // Update global references
                window.provider = provider
                window.signer = signer
                window.account = account
                
                return true
            }
        } catch (error) {
            console.error('User rejected connection:', error)
            return false
        }
    } else {
        alert('Please install MetaMask or another Web3 wallet!')
        return false
    }
}

// Connect wallet function
window.connectWallet = async function() {
    try {
        // Wait for ethers.js if not loaded yet
        let retries = 0
        while (typeof ethers === 'undefined' && retries < 50) {
            await new Promise(resolve => setTimeout(resolve, 100))
            retries++
        }
        
        if (typeof ethers === 'undefined') {
            alert('⚠️ ethers.js failed to load. Please refresh the page.')
            console.error('ethers.js not available after waiting')
            return
        }
        
        if (typeof window.ethereum === 'undefined') {
            alert('Please install MetaMask!\n\nVisit: https://metamask.io')
            return
        }

        const connected = await initProvider()
        if (connected) {
            updateWalletUI()
            setupWalletListeners()
            
            // Dispatch event for app-simple.js
            window.dispatchEvent(new CustomEvent('walletConnected', {
                detail: { account, provider, signer }
            }))
            
            console.log('✅ Wallet connected:', account)
        }
    } catch (error) {
        console.error('Connection error:', error)
        alert('Failed to connect wallet: ' + error.message)
    }
}

// Disconnect wallet
window.disconnectWallet = function() {
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

// Setup wallet listeners
function setupWalletListeners() {
    if (window.ethereum) {
        // Account changed
        window.ethereum.on('accountsChanged', (accounts) => {
            if (accounts.length > 0) {
                account = accounts[0]
                initProvider().then(() => {
                    updateWalletUI()
                    // Dispatch event for app-simple.js
                    window.dispatchEvent(new CustomEvent('walletConnected', {
                        detail: { account, provider, signer }
                    }))
                })
            } else {
                disconnectWallet()
            }
        })

        // Chain changed
        window.ethereum.on('chainChanged', () => {
            window.location.reload()
        })
    }
}

// Clear dashboard
function clearDashboard() {
    const balanceEl = document.getElementById('tokenBalance')
    const rewardsEl = document.getElementById('pendingRewards')
    if (balanceEl) balanceEl.textContent = '0.0000'
    if (rewardsEl) rewardsEl.textContent = '0.0000'
}

// Check if already connected
window.addEventListener('load', async () => {
    // Wait for ethers.js to load
    if (typeof ethers === 'undefined') {
        console.log('⏳ Waiting for ethers.js...')
        return
    }
    
    if (typeof window.ethereum !== 'undefined') {
        try {
            const accounts = await window.ethereum.request({ method: 'eth_accounts' })
            if (accounts.length > 0) {
                await initProvider()
                updateWalletUI()
                setupWalletListeners()
                
                // Dispatch event for app-simple.js
                window.dispatchEvent(new CustomEvent('walletConnected', {
                    detail: { account, provider, signer }
                }))
            }
        } catch (error) {
            console.error('Auto-connect error:', error)
        }
    }
})

// Make connect function available globally for onclick
window.openWalletModal = window.connectWallet

console.log('✅ Simple wallet connection loaded')

