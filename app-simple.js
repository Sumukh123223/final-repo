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
    
    // Check if already connected
    checkExistingConnection()
    
    // Setup referral system
    setupReferralSystem()
    
    // Listen for wallet connection events
    window.addEventListener('walletConnected', (e) => {
        // Use window variables to avoid conflicts
        window.account = e.detail.account
        window.provider = e.detail.provider
        window.signer = e.detail.signer
        setupContracts()
        updateDashboard()
    })
}

// Setup button handlers
function setupButtons() {
    // Claim rewards button
    const claimBtn = document.getElementById('claimRewardsBtn')
    if (claimBtn) {
        claimBtn.onclick = () => claimRewards()
    }
    
    // Buy tokens button handlers are in HTML onclick
}

// Check if wallet is already connected
async function checkExistingConnection() {
    // Check if WalletConnect or other provider is already connected
    if (window.account && window.provider && window.signer) {
        setupContracts()
        updateDashboard()
    }
}

// Setup contract instances
function setupContracts() {
    const signer = window.signer
    if (!signer) return
    
    contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer)
    usdtContract = new ethers.Contract(USDT_ADDRESS, USDT_ABI, signer)
}

// Update dashboard
async function updateDashboard() {
    const account = window.account
    if (!account || !contract) return
    
    try {
        const balance = await contract.balanceOf(account)
        const rewards = await contract.calculateRewards(account)
        
        const balanceEl = document.getElementById('tokenBalance')
        const rewardsEl = document.getElementById('pendingRewards')
        
        if (balanceEl) {
            balanceEl.textContent = parseFloat(ethers.utils.formatEther(balance)).toFixed(4)
        }
        if (rewardsEl) {
            rewardsEl.textContent = parseFloat(ethers.utils.formatEther(rewards)).toFixed(4)
        }
        
        // Update UI
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
        
    } catch (error) {
        console.error('Dashboard update error:', error)
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
        
        // Update dashboard
        setTimeout(() => updateDashboard(), 2000)
        
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

// Make functions globally available
window.updateDashboard = updateDashboard
window.claimRewards = claimRewards

console.log('✅ App Simple loaded - waiting for ethers.js')

