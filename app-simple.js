// CleanSpark - Simple App (Works without npm/build tools)
// Uses ethers.js from CDN and direct MetaMask connection

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
        return
    }
    
    console.log('📋 Setting up contract instances...')
    console.log('📋 Contract address:', CONTRACT_ADDRESS)
    contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer)
    usdtContract = new ethers.Contract(USDT_ADDRESS, USDT_ABI, signer)
    console.log('✅ Contracts set up successfully')
    console.log('✅ Contract instance:', !!contract)
    console.log('✅ USDT Contract instance:', !!usdtContract)
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
        alert('⚠️ ethers.js not loaded. Please refresh the page.')
        return
    }
    
    // Make sure contract is set up
    if (!contract) {
        console.log('⚠️ Contract not initialized, setting up...')
        setupContracts()
        if (!contract) {
            console.error('❌ Failed to setup contract')
            console.error('📋 Signer available:', !!window.signer)
            return
        }
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
        
        // Get balance and rewards
        console.log('📞 Calling contract.balanceOf with account:', account)
        const balance = await contract.balanceOf(account)
        console.log('✅ balanceOf call successful')
        console.log('📞 Calling contract.calculateRewards with account:', account)
        const rewards = await contract.calculateRewards(account)
        console.log('✅ calculateRewards call successful')
        
        console.log('📊 Raw balance from contract:', balance.toString())
        console.log('📊 Raw rewards from contract:', rewards.toString())
        
        // Try to get locked amount if getUserHoldings exists
        let lockedAmount = ethers.BigNumber.from(0)
        let lockStatus = 'All unlocked'
        try {
            const holdings = await contract.getUserHoldings(account)
            if (holdings && holdings.length >= 6) {
                lockedAmount = holdings[0] // lockedAmount
                const isLocked = holdings[5] // isLocked
                if (isLocked) {
                    const lockEnd = holdings[4] // lockEnd
                    const lockEndDate = new Date(lockEnd.toNumber() * 1000)
                    lockStatus = `Locked until ${lockEndDate.toLocaleString()}`
                }
            }
        } catch (e) {
            console.log('getUserHoldings not available or failed:', e.message)
        }
        
        // Format values
        const balanceFormatted = parseFloat(ethers.utils.formatEther(balance)).toFixed(4)
        const rewardsFormatted = parseFloat(ethers.utils.formatEther(rewards)).toFixed(4)
        const lockedFormatted = parseFloat(ethers.utils.formatEther(lockedAmount)).toFixed(4)
        
        console.log('📊 Dashboard data:', {
            balance: balanceFormatted,
            rewards: rewardsFormatted,
            locked: lockedFormatted
        })
        
        // Update elements - check for both possible IDs
        const balanceEl = document.getElementById('userBalance') || document.getElementById('tokenBalance')
        const rewardsEl = document.getElementById('pendingRewards')
        const lockedEl = document.getElementById('lockedAmount')
        const lockStatusEl = document.getElementById('lockStatus')
        
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
        
        if (lockedEl) {
            lockedEl.textContent = lockedFormatted + ' cleanSpark'
            console.log('✅ Updated lockedAmount:', lockedFormatted)
        }
        
        if (lockStatusEl) {
            lockStatusEl.textContent = lockStatus
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

