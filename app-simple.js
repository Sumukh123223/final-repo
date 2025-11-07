// CleanSpark - Simple App (Works without npm/build tools)
// Uses ethers.js from CDN and direct MetaMask connection
// Version: 2.0 - Updated getUserHoldings support

// Contract Configuration  
const CONTRACT_ADDRESS = '0x45CbCA5f88c510526049F31cECeF626Eb5254784'
const USDT_ADDRESS = '0x55d398326f99059fF775485246999027B3197955'

// Contract ABI (simplified - only needed functions)
const CONTRACT_ABI = [
    'function balanceOf(address) view returns (uint256)',
    'function calculateRewards(address) view returns (uint256)',
    'function getUserHoldings(address) view returns (uint256 lockedAmount, uint256 earnedRewards, uint256 totalBalance, uint256 pendingRewards, uint256 lockEnd, bool isLocked)',
    'function buyTokens(uint256)',
    'function buyTokensWithReferral(uint256, address)',
    'function buyTokensWithBNB() payable',
    'function buyTokensWithBNBAndReferral(address) payable',
    'function sellTokens(uint256)',
    'function claimRewards()',
    'function getReferralInfo(address) view returns (address referrer, uint256 totalEarnings, uint256 count, uint256 totalVolume)',
    'function hasReferrer(address) view returns (bool)',
    'function bnbToUsdtRate() view returns (uint256)'
]

// USDT ABI
const USDT_ABI = [
    'function balanceOf(address) view returns (uint256)',
    'function allowance(address owner, address spender) view returns (uint256)',
    'function approve(address spender, uint256) returns (bool)',
    'function transfer(address to, uint256) returns (bool)'
]

// Global variables - use window variables to avoid conflicts
let contract = null
let usdtContract = null
// Don't declare provider/signer/account here - use window.provider, window.signer, window.account from walletconnect-simple.js

// Initialize when ethers is loaded
function waitForEthers() {
    if (typeof ethers !== 'undefined') {
        console.log('✅ ethers.js available in app-simple.js')
        initApp()
        // Make sure updateDashboard is available immediately after init
        setTimeout(() => {
            if (typeof updateDashboard === 'function') {
                window.updateDashboard = updateDashboard
                window.claimRewards = claimRewards
                console.log('✅ Made updateDashboard globally available (early):', typeof window.updateDashboard)
            }
        }, 100)
    } else {
        console.log('⏳ Waiting for ethers.js in app-simple.js...')
        setTimeout(waitForEthers, 100)
    }
}

// Start checking when script loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', waitForEthers)
} else {
    waitForEthers()
}

function initApp() {
    console.log('✅ CleanSpark App Simple initialized')
    
    // Setup buttons
    setupButtons()
    
    // Setup referral system
    setupReferralSystem()
    
    // Check if already connected immediately
    checkExistingConnection()
    
    // Also check periodically in case wallet connects after page load
    let connectionCheckInterval = setInterval(() => {
        if (window.account && window.signer && !contract) {
            console.log('🔄 Periodic check: Wallet connected but contract not set up, initializing...')
            checkExistingConnection()
        }
    }, 2000) // Check every 2 seconds
    
    // Stop checking after 30 seconds
    setTimeout(() => {
        clearInterval(connectionCheckInterval)
    }, 30000)
    
    // Listen for wallet connection events
    window.addEventListener('walletConnected', (e) => {
        console.log('✅ Wallet connected event received in app-simple.js')
        console.log('📋 Event details:', e.detail)
        // Use window variables to avoid conflicts
        if (e.detail) {
        window.account = e.detail.account
        window.provider = e.detail.provider
        window.signer = e.detail.signer
            console.log('✅ Set window.account:', window.account)
            console.log('✅ Set window.provider:', !!window.provider)
            console.log('✅ Set window.signer:', !!window.signer)
        }
        setupContracts()
        // Wait a bit for contracts to initialize, then update dashboard
        setTimeout(() => {
            console.log('🔄 Calling updateDashboard from walletConnected event...')
        updateDashboard()
        }, 500)
    })
    
    // Also check immediately if wallet is already connected
    setTimeout(() => {
        if (window.account && !contract) {
            console.log('🔄 Wallet already connected on page load, setting up...')
            checkExistingConnection()
        }
    }, 2000)
}

// Setup button handlers
function setupButtons() {
    // Claim rewards button
    const claimBtn = document.getElementById('claimBtn') || document.getElementById('claimRewardsBtn')
    if (claimBtn) {
        claimBtn.onclick = () => claimRewards()
    }
    
    // Buy tokens button handlers are in HTML onclick
    
    // Add refresh button if needed
    const refreshBtn = document.getElementById('refreshDashboard')
    if (refreshBtn) {
        refreshBtn.onclick = () => {
            console.log('🔄 Manual dashboard refresh triggered')
            updateDashboard()
        }
    }
}

// Check if wallet is already connected
async function checkExistingConnection() {
    console.log('🔍 Checking for existing wallet connection...')
    
    // Check if wallet is connected via MetaMask
    if (typeof window.ethereum !== 'undefined') {
        // Try to get selected address
        let selectedAddress = window.ethereum.selectedAddress
        
        // If no selectedAddress, try to get accounts
        if (!selectedAddress && window.ethereum.request) {
            try {
                const accounts = await window.ethereum.request({ method: 'eth_accounts' })
                if (accounts && accounts.length > 0) {
                    selectedAddress = accounts[0]
                    console.log('✅ Found connected account via eth_accounts:', selectedAddress)
                }
            } catch (e) {
                console.log('⚠️ Could not get accounts:', e.message)
            }
        }
        
        if (selectedAddress) {
            console.log('✅ MetaMask wallet already connected:', selectedAddress)
            
            // Set account if not already set
            if (!window.account) {
                window.account = selectedAddress
                console.log('✅ Set window.account from MetaMask:', window.account)
            }
            
            // Setup provider and signer if not already set
            if (!window.provider || !window.signer) {
                if (typeof ethers !== 'undefined') {
                    window.provider = new ethers.providers.Web3Provider(window.ethereum)
                    window.signer = window.provider.getSigner()
                    console.log('✅ Provider and signer set up from MetaMask')
                } else {
                    console.warn('⚠️ ethers.js not available yet')
                }
            }
        }
    }
    
    // Check if WalletConnect or other provider is already connected
    if (window.account && window.provider && window.signer) {
        console.log('✅ Existing connection found:', window.account)
        console.log('📋 Setting up contracts...')
        setupContracts()
        
        // Wait a bit for contracts to initialize, then update dashboard
        setTimeout(() => {
            console.log('🔄 Updating dashboard for existing connection (first attempt)...')
            updateDashboard()
        }, 1000)
        
        // Also update again after 3 seconds to ensure it's loaded
        setTimeout(() => {
            console.log('🔄 Updating dashboard for existing connection (second attempt)...')
        updateDashboard()
        }, 3000)
    } else {
        console.log('⚠️ No existing wallet connection found')
        console.log('Account:', window.account)
        console.log('Provider:', !!window.provider)
        console.log('Signer:', !!window.signer)
        console.log('window.ethereum:', typeof window.ethereum !== 'undefined')
    }
}

// Setup contract instances
function setupContracts() {
    const signer = window.signer
    if (!signer) {
        console.warn('⚠️ Cannot setup contracts - no signer available')
        console.warn('📋 window.signer:', window.signer)
        return
    }
    
    if (typeof ethers === 'undefined') {
        console.warn('⚠️ Cannot setup contracts - ethers.js not available')
        return
    }
    
    console.log('📋 Setting up contract instances...')
    console.log('📋 Contract address:', CONTRACT_ADDRESS)
    console.log('📋 Signer type:', typeof signer)
    
    try {
    contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer)
    usdtContract = new ethers.Contract(USDT_ADDRESS, USDT_ABI, signer)
        console.log('✅ Contracts set up successfully')
        console.log('✅ Contract instance:', !!contract)
        console.log('✅ USDT Contract instance:', !!usdtContract)
        console.log('✅ Contract address:', contract.address)
    } catch (error) {
        console.error('❌ Error setting up contracts:', error)
        console.error('Error details:', error.message)
        contract = null
        usdtContract = null
    }
}

// Update dashboard
async function updateDashboard() {
    console.log('🔄 ========== updateDashboard() CALLED ==========')
    console.log('📋 Current state:', {
        account: window.account,
        hasProvider: !!window.provider,
        hasSigner: !!window.signer,
        hasContract: !!contract,
        hasEthers: typeof ethers !== 'undefined'
    })
    
    const account = window.account
    if (!account) {
        console.log('⚠️ Cannot update dashboard - no account connected')
        console.log('📋 window.account:', window.account)
        return
    }
    
    // Make sure ethers is available
    if (typeof ethers === 'undefined') {
        console.error('❌ ethers.js is not available!')
        console.log('⏳ Waiting for ethers.js...')
        // Wait a bit and try again
        setTimeout(() => {
            if (typeof ethers !== 'undefined') {
                updateDashboard()
            }
        }, 500)
        return
    }
    
    // Make sure contract is set up - try multiple times if needed
    if (!contract) {
        console.log('⚠️ Contract not initialized, setting up...')
        console.log('📋 Signer available:', !!window.signer)
        console.log('📋 Provider available:', !!window.provider)
        
        if (!window.signer) {
            console.error('❌ No signer available - cannot setup contract')
            console.log('⏳ Waiting for signer...')
            // Wait a bit and try again
            setTimeout(() => {
                if (window.signer) {
                    updateDashboard()
                }
            }, 1000)
            return
        }
        
        setupContracts()
        
        if (!contract) {
            console.error('❌ Failed to setup contract after setupContracts() call')
            console.log('⏳ Retrying in 1 second...')
            setTimeout(() => {
                updateDashboard()
            }, 1000)
            return
        }
        
        console.log('✅ Contract initialized successfully')
    }
    
    try {
        console.log('🔄 Updating dashboard for account:', account)
        console.log('📋 Contract address:', CONTRACT_ADDRESS)
        console.log('📋 Contract instance:', !!contract)
        console.log('📋 Account:', account)
        
        if (!contract) {
            console.error('❌ Contract not initialized!')
            alert('⚠️ Contract not initialized. Please refresh the page.')
            return
        }
        
        // Try to get user holdings first (more complete data)
        let balance = ethers.BigNumber.from(0)
        let rewards = ethers.BigNumber.from(0)
        let totalBalance = ethers.BigNumber.from(0)
        let lastBuyTime = null
        let nextRewardTime = null
        
        try {
            console.log('📞 Calling contract.getUserHoldings with account:', account)
            const holdings = await contract.getUserHoldings(account)
            console.log('✅ getUserHoldings call successful')
            console.log('📊 Holdings result:', holdings)
            
            if (holdings && holdings.length >= 6) {
                const lockedAmount = holdings[0] // lockedAmount
                rewards = holdings[1] // earnedRewards
                totalBalance = holdings[2] // totalBalance
                const pendingRewards = holdings[3] // pendingRewards
                const lockEnd = holdings[4] // lockEnd
                const isLocked = holdings[5] // isLocked
                
                // Use totalBalance as the main balance
                balance = totalBalance
                
                // Use pendingRewards if available, otherwise use earnedRewards
                if (pendingRewards && pendingRewards.gt(0)) {
                    rewards = pendingRewards
                }
                
                // Use lockEnd as last buy time if available (even if not locked)
                if (lockEnd && lockEnd.gt(0)) {
                    lastBuyTime = new Date(lockEnd.toNumber() * 1000)
                }
                
                console.log('📊 Parsed holdings:', {
                    rewards: rewards.toString(),
                    totalBalance: totalBalance.toString(),
                    lastBuyTime: lastBuyTime
                })
            }
        } catch (e) {
            console.log('⚠️ getUserHoldings not available or failed:', e.message)
            console.log('📞 Falling back to balanceOf and calculateRewards...')
            
            // Fallback to individual calls
            console.log('📞 Calling contract.balanceOf with account:', account)
            balance = await contract.balanceOf(account)
            console.log('✅ balanceOf call successful')
            console.log('📞 Calling contract.calculateRewards with account:', account)
            rewards = await contract.calculateRewards(account)
            console.log('✅ calculateRewards call successful')
        }
        
        // Calculate next reward time (15 minutes after last buy or current time)
        if (lastBuyTime) {
            // Next reward is 15 minutes after last buy
            nextRewardTime = new Date(lastBuyTime.getTime() + 15 * 60 * 1000)
        } else if (balance.gt(0)) {
            // If we have balance but no last buy time, use current time + 15 min as estimate
            nextRewardTime = new Date(Date.now() + 15 * 60 * 1000)
        }
        
        console.log('📊 Final values:', {
            balance: balance.toString(),
            rewards: rewards.toString(),
            lastBuyTime: lastBuyTime,
            nextRewardTime: nextRewardTime
        })
        
        // Format values
        const balanceFormatted = parseFloat(ethers.utils.formatEther(balance)).toFixed(4)
        const rewardsFormatted = parseFloat(ethers.utils.formatEther(rewards)).toFixed(4)
        
        // Format times
        let lastBuyTimeFormatted = 'Never'
        if (lastBuyTime) {
            const now = new Date()
            const diff = now - lastBuyTime
            if (diff < 60000) {
                lastBuyTimeFormatted = 'Just now'
            } else if (diff < 3600000) {
                lastBuyTimeFormatted = `${Math.floor(diff / 60000)} min ago`
            } else if (diff < 86400000) {
                lastBuyTimeFormatted = `${Math.floor(diff / 3600000)} hours ago`
            } else {
                lastBuyTimeFormatted = lastBuyTime.toLocaleString()
            }
        }
        
        let nextRewardTimeFormatted = '--'
        if (nextRewardTime) {
            const now = new Date()
            const diff = nextRewardTime - now
            if (diff <= 0) {
                nextRewardTimeFormatted = 'Now!'
            } else if (diff < 60000) {
                nextRewardTimeFormatted = `${Math.floor(diff / 1000)} sec`
            } else if (diff < 3600000) {
                nextRewardTimeFormatted = `${Math.floor(diff / 60000)} min`
            } else {
                nextRewardTimeFormatted = nextRewardTime.toLocaleTimeString()
            }
        }
        
        console.log('📊 Dashboard data:', {
            balance: balanceFormatted,
            rewards: rewardsFormatted,
            lastBuyTime: lastBuyTimeFormatted,
            nextRewardTime: nextRewardTimeFormatted
        })
        
        // Update elements - check for both possible IDs
        const balanceEl = document.getElementById('userBalance') || document.getElementById('tokenBalance')
        const rewardsEl = document.getElementById('pendingRewards')
        const lastBuyTimeEl = document.getElementById('lastBuyTime')
        const nextRewardTimeEl = document.getElementById('nextRewardTime')
        
        if (balanceEl) {
            balanceEl.textContent = balanceFormatted + ' cleanSpark'
            console.log('✅ Updated userBalance:', balanceFormatted)
        } else {
            console.warn('⚠️ userBalance element not found')
        }
        
        if (rewardsEl) {
            rewardsEl.textContent = rewardsFormatted + ' cleanSpark'
            console.log('✅ Updated pendingRewards:', rewardsFormatted)
        } else {
            console.warn('⚠️ pendingRewards element not found')
        }
        
        if (lastBuyTimeEl) {
            lastBuyTimeEl.textContent = lastBuyTimeFormatted
            console.log('✅ Updated lastBuyTime:', lastBuyTimeFormatted)
        } else {
            console.warn('⚠️ lastBuyTime element not found')
        }
        
        if (nextRewardTimeEl) {
            nextRewardTimeEl.textContent = nextRewardTimeFormatted
            console.log('✅ Updated nextRewardTime:', nextRewardTimeFormatted)
        } else {
            console.warn('⚠️ nextRewardTime element not found')
        }
        
        // Update UI visibility
        const walletBtn = document.getElementById('walletConnectBtn')
        const walletInfo = document.getElementById('walletInfo')
        const walletAddress = document.getElementById('walletAddress')
        const notConnected = document.getElementById('notConnected')
        const connectedDashboard = document.getElementById('connectedDashboard')
        
        if (walletBtn) walletBtn.style.display = 'none'
        if (walletInfo) walletInfo.style.display = 'flex'
        if (walletAddress) walletAddress.textContent = `${account.substring(0, 6)}...${account.substring(38)}`
        if (notConnected) notConnected.style.display = 'none'
        if (connectedDashboard) connectedDashboard.style.display = 'block'
        
        console.log('✅ Dashboard updated successfully')
        
    } catch (error) {
        console.error('❌ Dashboard update error:', error)
        console.error('Error details:', {
            message: error.message,
            code: error.code,
            data: error.data
        })
        alert('⚠️ Error loading dashboard: ' + (error.reason || error.message || 'Unknown error'))
    }
}

// Buy tokens function (called from HTML)
window.buyTokens = async function(usdtAmount, paymentMethod = 'USDT') {
    const account = window.account
    const signer = window.signer
    if (!account || !signer) {
        alert('Please connect your wallet first!')
        await window.connectWallet()
        return
    }
    
    if (!contract) setupContracts()
    
    try {
        const amountInWei = ethers.utils.parseUnits(usdtAmount.toString(), 18)
        const referrer = getReferrerAddress()
        
        if (paymentMethod === 'BNB') {
            // Buy with BNB
            const bnbRate = await contract.bnbToUsdtRate()
            const bnbAmount = (amountInWei.mul(ethers.utils.parseEther('1'))).div(bnbRate)
            
            if (referrer) {
                const tx = await contract.buyTokensWithBNBAndReferral(referrer, { value: bnbAmount })
                alert('⏳ Transaction submitted! Please wait for confirmation...')
                await tx.wait()
                alert('✅ Tokens purchased successfully!')
            } else {
                const tx = await contract.buyTokensWithBNB({ value: bnbAmount })
                alert('⏳ Transaction submitted! Please wait for confirmation...')
                await tx.wait()
                alert('✅ Tokens purchased successfully!')
            }
        } else {
            // Buy with USDT
            // Check balance
            const usdtBalance = await usdtContract.balanceOf(account)
            if (usdtBalance.lt(amountInWei)) {
                alert(`❌ Insufficient USDT balance!\n\nYou have: ${ethers.utils.formatEther(usdtBalance)} USDT\nRequired: ${usdtAmount} USDT`)
                return
            }
            
            // Check allowance
            const allowance = await usdtContract.allowance(account, CONTRACT_ADDRESS)
            if (allowance.lt(amountInWei)) {
                const approveConfirm = confirm(
                    `⚠️ USDT Approval Required\n\n` +
                    `You need to approve USDT spending first.\n\n` +
                    `Click OK to approve, then try buying again.`
                )
                
                if (!approveConfirm) {
                    alert('❌ Purchase cancelled. Approval is required.')
                    return
                }
                
                // Approve USDT
                const approveAmount = amountInWei.mul(1000) // Approve 1000x
                alert('⏳ Approving USDT... Please confirm in your wallet.')
                const approveTx = await usdtContract.approve(CONTRACT_ADDRESS, approveAmount)
                await approveTx.wait()
                alert('✅ USDT approved! You can now buy tokens.')
            }
            
            // Buy tokens
            if (referrer) {
                alert('⏳ Purchasing tokens... Please confirm in your wallet.')
                const tx = await contract.buyTokensWithReferral(amountInWei, referrer)
                await tx.wait()
                alert('✅ Tokens purchased successfully!')
                localStorage.removeItem('referralAddress')
            } else {
                alert('⏳ Purchasing tokens... Please confirm in your wallet.')
                const tx = await contract.buyTokens(amountInWei)
                await tx.wait()
                alert('✅ Tokens purchased successfully!')
            }
        }
        
        // Update dashboard - wait longer for blockchain to update
        console.log('✅ Purchase successful, updating dashboard...')
        setTimeout(() => {
            updateDashboard()
        }, 3000) // Wait 3 seconds
        
        // Also update again after 10 seconds to ensure balance is updated
        setTimeout(() => {
            console.log('🔄 Refreshing dashboard again after purchase...')
            updateDashboard()
        }, 10000)
        
    } catch (error) {
        console.error('Buy tokens error:', error)
        if (error.message?.includes('user rejected') || error.message?.includes('User denied')) {
            alert('❌ Transaction rejected by user.')
        } else {
            alert('❌ Error: ' + (error.reason || error.message))
        }
    }
}

// Sell tokens function
window.sellTokens = async function(tokenAmount) {
    const account = window.account
    const signer = window.signer
    if (!account || !signer) {
        alert('Please connect your wallet first!')
        return
    }
    
    if (!contract) setupContracts()
    
    try {
        const amountInWei = ethers.utils.parseUnits(tokenAmount.toString(), 18)
        
        alert('⏳ Selling tokens... Please confirm in your wallet.')
        const tx = await contract.sellTokens(amountInWei)
        await tx.wait()
        alert('✅ Tokens sold successfully!')
        
        setTimeout(() => updateDashboard(), 2000)
        
    } catch (error) {
        console.error('Sell tokens error:', error)
        alert('❌ Error: ' + (error.reason || error.message))
    }
}

// Claim rewards function
async function claimRewards() {
    const account = window.account
    const signer = window.signer
    if (!account || !signer) {
        alert('Please connect your wallet first!')
        return
    }
    
    if (!contract) setupContracts()
    
    try {
        alert('⏳ Claiming rewards... Please confirm in your wallet.')
        const tx = await contract.claimRewards()
        await tx.wait()
        alert('✅ Rewards claimed successfully!')
        
        setTimeout(() => updateDashboard(), 2000)
        
    } catch (error) {
        console.error('Claim rewards error:', error)
        alert('❌ Error: ' + (error.reason || error.message))
    }
}

// Get referrer from URL
function getReferrerAddress() {
    const urlParams = new URLSearchParams(window.location.search)
    return urlParams.get('ref') || localStorage.getItem('referralAddress')
}

// Setup referral system
function setupReferralSystem() {
    const referrer = getReferrerAddress()
    if (referrer) {
        localStorage.setItem('referralAddress', referrer)
        console.log('Referral address saved:', referrer)
    }
}

// Make functions globally available IMMEDIATELY - do this right after function definition
// This ensures it's available as soon as the script loads
if (typeof window !== 'undefined') {
window.updateDashboard = updateDashboard
window.claimRewards = claimRewards
    console.log('✅ Made updateDashboard globally available:', typeof window.updateDashboard)
    console.log('✅ updateDashboard function:', window.updateDashboard)
} else {
    console.error('❌ window is not available!')
}

// Auto-refresh dashboard every 30 seconds if connected
let dashboardRefreshInterval = null
function startAutoRefresh() {
    if (dashboardRefreshInterval) {
        clearInterval(dashboardRefreshInterval)
    }
    dashboardRefreshInterval = setInterval(() => {
        if (window.account && contract) {
            console.log('🔄 Auto-refreshing dashboard...')
            updateDashboard()
        }
    }, 30000) // Refresh every 30 seconds
}

// Start auto-refresh if already connected
if (window.account) {
    setTimeout(() => {
        startAutoRefresh()
    }, 2000)
}

// Listen for wallet connection to start auto-refresh
window.addEventListener('walletConnected', () => {
    setTimeout(() => {
        startAutoRefresh()
    }, 2000)
})

// Stop auto-refresh on disconnect
window.addEventListener('walletDisconnected', () => {
    if (dashboardRefreshInterval) {
        clearInterval(dashboardRefreshInterval)
        dashboardRefreshInterval = null
    }
})

console.log('✅ App Simple loaded - waiting for ethers.js')

