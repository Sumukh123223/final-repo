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
    console.log('📋 setupContracts called')
    const signer = window.signer
    if (!signer) {
        console.error('❌ Cannot setup contracts - no signer available')
        console.error('📋 window.signer:', window.signer)
        console.error('📋 window.account:', window.account)
        console.error('📋 window.provider:', !!window.provider)
        return false
    }

    if (typeof ethers === 'undefined') {
        console.error('❌ Cannot setup contracts - ethers.js not available')
        return false
    }

    console.log('📋 Setting up contract instances...')
    console.log('📋 Contract address:', CONTRACT_ADDRESS)
    console.log('📋 USDT address:', USDT_ADDRESS)
    console.log('📋 Signer type:', typeof signer)
    console.log('📋 Signer address:', signer?.getAddress ? 'available' : 'not available')

    try {
        contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer)
        usdtContract = new ethers.Contract(USDT_ADDRESS, USDT_ABI, signer)
        console.log('✅ Contracts set up successfully')
        console.log('✅ Contract instance:', !!contract)
        console.log('✅ USDT Contract instance:', !!usdtContract)
        if (contract) {
            console.log('✅ Contract address:', contract.address)
        }
        if (usdtContract) {
            console.log('✅ USDT Contract address:', usdtContract.address)
        }
        return true
    } catch (error) {
        console.error('❌ Error setting up contracts:', error)
        console.error('Error details:', error.message)
        console.error('Error stack:', error.stack)
        contract = null
        usdtContract = null
        return false
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
            if (window.showCustomModal) {
                window.showCustomModal('Contract Error', 'Contract not initialized. Please refresh the page.', 'error')
            } else {
                alert('⚠️ Contract not initialized. Please refresh the page.')
            }
            return
        }
        
        // Get balance and calculate rewards using calculateRewards function
        let balance = ethers.BigNumber.from(0)
        let rewards = ethers.BigNumber.from(0)
        
        // Always use balanceOf for balance
        console.log('📞 Calling contract.balanceOf with account:', account)
        balance = await contract.balanceOf(account)
        console.log('✅ balanceOf call successful')
        console.log('📊 Balance result:', balance.toString())
        
        // Always use calculateRewards for pending rewards (this is the actual reward calculation)
        console.log('📞 Calling contract.calculateRewards with account:', account)
        rewards = await contract.calculateRewards(account)
        console.log('✅ calculateRewards call successful')
        console.log('📊 Calculated rewards result:', rewards.toString())
        
        console.log('📊 Final values:', {
            balance: balance.toString(),
            rewards: rewards.toString()
        })
        
        // Format values
        const balanceFormatted = parseFloat(ethers.utils.formatEther(balance)).toFixed(4)
        const rewardsFormatted = parseFloat(ethers.utils.formatEther(rewards)).toFixed(4)
        
        // Determine reward status
        let rewardStatusText = 'Next reward will be in next 24 hrs'
        let rewardStatusDesc = 'Waiting for next reward cycle'
        const rewardsBN = ethers.BigNumber.from(rewards)
        
        // If there are rewards available to claim, show that
        if (rewardsBN.gt(0)) {
            rewardStatusText = 'Current reward available to claim'
            rewardStatusDesc = 'You have rewards ready to claim!'
        } else if (balance.gt(0)) {
            // If user has balance but no rewards yet, next reward in 24 hrs
            rewardStatusText = 'Next reward will be in next 24 hrs'
            rewardStatusDesc = 'Your next reward is coming soon'
        } else {
            // No balance, no rewards
            rewardStatusText = 'No rewards yet'
            rewardStatusDesc = 'Buy tokens to start earning rewards'
        }
        
        console.log('📊 Dashboard data:', {
            balance: balanceFormatted,
            rewards: rewardsFormatted,
            rewardStatus: rewardStatusText
        })
        
        // Update elements - check for both possible IDs
        const balanceEl = document.getElementById('userBalance') || document.getElementById('tokenBalance')
        const rewardsEl = document.getElementById('pendingRewards')
        const nextRewardTimeEl = document.getElementById('nextRewardTime')
        const rewardStatusDescEl = document.getElementById('rewardStatusDesc')
        
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
        
        if (nextRewardTimeEl) {
            nextRewardTimeEl.textContent = rewardStatusText
            console.log('✅ Updated reward status:', rewardStatusText)
        } else {
            console.warn('⚠️ nextRewardTime element not found')
        }
        
        if (rewardStatusDescEl) {
            rewardStatusDescEl.textContent = rewardStatusDesc
            console.log('✅ Updated reward status description:', rewardStatusDesc)
        } else {
            console.warn('⚠️ rewardStatusDesc element not found')
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
            const errorMsg = error.reason || error.message || 'Unknown error'
            if (window.showCustomModal) {
                window.showCustomModal('Dashboard Error', 'Error loading dashboard: ' + errorMsg, 'error')
            } else {
                alert('⚠️ Error loading dashboard: ' + errorMsg)
            }
        }
}

// Buy tokens function (called from HTML)
window.buyTokens = async function(usdtAmount, paymentMethod = 'USDT') {
    console.log('🛒 buyTokens called with:', { usdtAmount, paymentMethod })
    
    const account = window.account
    const signer = window.signer
    
    if (!account || !signer) {
        console.error('❌ No account or signer:', { account: !!account, signer: !!signer })
        if (window.showCustomModal) {
            window.showCustomModal('Wallet Not Connected', 'Please connect your wallet first!', 'warning')
        } else {
            alert('Please connect your wallet first!')
        }
        return
    }
    
    // Make sure ethers is available
    if (typeof ethers === 'undefined') {
        console.error('❌ ethers.js not available')
        if (window.showCustomModal) {
            window.showCustomModal('Error', 'ethers.js library is not loaded. Please refresh the page.', 'error')
        } else {
            alert('❌ ethers.js library is not loaded. Please refresh the page.')
        }
        return
    }
    
    // Setup contracts if not already set up
    if (!contract || !usdtContract) {
        console.log('📋 Setting up contracts...')
        setupContracts()
        
        // Wait a bit for contracts to initialize
        let retries = 0
        while ((!contract || !usdtContract) && retries < 10) {
            await new Promise(resolve => setTimeout(resolve, 100))
            retries++
        }
        
        if (!contract || !usdtContract) {
            console.error('❌ Failed to setup contracts after retries')
            if (window.showCustomModal) {
                window.showCustomModal('Contract Error', 'Failed to initialize contracts. Please refresh the page and try again.', 'error')
            } else {
                alert('❌ Failed to initialize contracts. Please refresh the page.')
            }
            return
        }
        console.log('✅ Contracts initialized')
    }
    
    try {
        console.log('💰 Converting amount to wei...')
        const amountInWei = ethers.utils.parseUnits(usdtAmount.toString(), 18)
        console.log('💰 Amount in wei:', amountInWei.toString())
        
        const referrer = getReferrerAddress()
        console.log('📋 Referrer:', referrer || 'none')
        
        if (paymentMethod === 'BNB') {
            // Buy with BNB
            const bnbRate = await contract.bnbToUsdtRate()
            const bnbAmount = (amountInWei.mul(ethers.utils.parseEther('1'))).div(bnbRate)
            
            if (referrer) {
                if (window.showCustomModal) {
                    window.showCustomModal('Purchasing Tokens', 'Please confirm the transaction in your wallet.', 'info')
                } else {
                    alert('⏳ Transaction submitted! Please wait for confirmation...')
                }
                const tx = await contract.buyTokensWithBNBAndReferral(referrer, { value: bnbAmount })
                await tx.wait()
                if (window.showCustomModal) {
                    window.showCustomModal('Success!', 'Tokens purchased successfully!', 'success')
                } else {
                    alert('✅ Tokens purchased successfully!')
                }
            } else {
                if (window.showCustomModal) {
                    window.showCustomModal('Purchasing Tokens', 'Please confirm the transaction in your wallet.', 'info')
                } else {
                    alert('⏳ Transaction submitted! Please wait for confirmation...')
                }
                const tx = await contract.buyTokensWithBNB({ value: bnbAmount })
                await tx.wait()
                if (window.showCustomModal) {
                    window.showCustomModal('Success!', 'Tokens purchased successfully!', 'success')
                } else {
                    alert('✅ Tokens purchased successfully!')
                }
            }
        } else {
            // Buy with USDT
            console.log('💵 Buying with USDT...')
            console.log('📋 Checking USDT balance...')
            
            // Check balance
            let usdtBalance
            try {
                console.log('📞 Calling usdtContract.balanceOf...')
                usdtBalance = await usdtContract.balanceOf(account)
                const balanceFormatted = ethers.utils.formatEther(usdtBalance)
                console.log('✅ USDT Balance check successful')
                console.log('💰 USDT Balance (raw):', usdtBalance.toString())
                console.log('💰 USDT Balance (formatted):', balanceFormatted)
                console.log('💰 Required amount (wei):', amountInWei.toString())
                console.log('💰 Required amount (formatted):', usdtAmount)
            } catch (error) {
                console.error('❌ Error checking USDT balance:', error)
                console.error('Error stack:', error.stack)
                if (window.showCustomModal) {
                    window.showCustomModal('Error', 'Failed to check USDT balance: ' + (error.message || 'Unknown error'), 'error')
                } else {
                    alert('❌ Error checking USDT balance: ' + (error.message || 'Unknown error'))
                }
                return
            }
            
            // Compare balances
            console.log('🔍 Comparing balances...')
            console.log('🔍 usdtBalance:', usdtBalance.toString())
            console.log('🔍 amountInWei:', amountInWei.toString())
            const hasEnough = usdtBalance.gte(amountInWei)
            console.log('🔍 Has enough balance:', hasEnough)
            
            if (!hasEnough) {
                const balanceFormatted = ethers.utils.formatEther(usdtBalance)
                const message = `Insufficient USDT balance!\n\nYou have: ${balanceFormatted} USDT\nRequired: ${usdtAmount} USDT`
                console.log('❌ Insufficient balance detected')
                console.log('📋 Balance formatted:', balanceFormatted)
                console.log('📋 Required:', usdtAmount)
                console.log('📋 Attempting to show error modal...')
                
                // Use setTimeout to ensure modal shows even if there's a blocking issue
                setTimeout(() => {
                    if (window.showCustomModal && typeof window.showCustomModal === 'function') {
                        console.log('📋 Calling showCustomModal...')
                        try {
                            window.showCustomModal('Insufficient Balance', message, 'error')
                            console.log('✅ showCustomModal called successfully')
                        } catch (modalError) {
                            console.error('❌ Error showing modal:', modalError)
                            if (window.originalAlert) {
                                window.originalAlert(`❌ ${message}`)
                            } else {
                                alert(`❌ ${message}`)
                            }
                        }
                    } else if (window.originalAlert) {
                        console.log('📋 Using originalAlert fallback')
                        window.originalAlert(`❌ ${message}`)
                    } else {
                        console.log('📋 Using native alert fallback')
                        alert(`❌ ${message}`)
                    }
                }, 100)
                
                console.log('✅ Error handling initiated, returning')
                return
            }
            console.log('✅ Balance check passed')
            
            // Check allowance
            console.log('📋 Checking USDT allowance...')
            let allowance
            try {
                allowance = await usdtContract.allowance(account, CONTRACT_ADDRESS)
                console.log('✅ Current allowance:', ethers.utils.formatEther(allowance))
            } catch (error) {
                console.error('❌ Error checking allowance:', error)
                if (window.showCustomModal) {
                    window.showCustomModal('Error', 'Failed to check USDT allowance: ' + (error.message || 'Unknown error'), 'error')
                } else {
                    alert('❌ Error checking USDT allowance: ' + (error.message || 'Unknown error'))
                }
                return
            }
            
            if (allowance.lt(amountInWei)) {
                console.log('⚠️ Insufficient allowance, requesting approval...')
                const approveConfirm = await new Promise((resolve) => {
                    if (window.showCustomModal) {
                        window.showCustomModal(
                            'USDT Approval Required',
                            'You need to approve USDT spending first.\n\nClick Confirm to approve, then try buying again.',
                            'warning',
                            resolve,
                            true
                        )
                    } else {
                        resolve(confirm('⚠️ USDT Approval Required\n\nYou need to approve USDT spending first.\n\nClick OK to approve, then try buying again.'))
                    }
                })

                if (!approveConfirm) {
                    if (window.showCustomModal) {
                        window.showCustomModal('Purchase Cancelled', 'Approval is required to proceed with the purchase.', 'error')
                    } else {
                        alert('❌ Purchase cancelled. Approval is required.')
                    }
                    return
                }
                
                // Approve USDT
                console.log('📝 Approving USDT...')
                const approveAmount = amountInWei.mul(1000) // Approve 1000x
                if (window.showCustomModal) {
                    window.showCustomModal('Approving USDT', 'Please confirm the approval transaction in your wallet.', 'info')
                } else {
                    alert('⏳ Approving USDT... Please confirm in your wallet.')
                }
                
                let approveTx
                try {
                    approveTx = await usdtContract.approve(CONTRACT_ADDRESS, approveAmount)
                    console.log('⏳ Approval transaction submitted:', approveTx.hash)
                    await approveTx.wait()
                    console.log('✅ Approval confirmed')
                    if (window.showCustomModal) {
                        window.showCustomModal('USDT Approved', 'USDT has been approved! You can now buy tokens.', 'success')
                    } else {
                        alert('✅ USDT approved! You can now buy tokens.')
                    }
                } catch (error) {
                    console.error('❌ Approval error:', error)
                    if (error.message?.includes('user rejected') || error.message?.includes('User denied')) {
                        if (window.showCustomModal) {
                            window.showCustomModal('Approval Cancelled', 'USDT approval was cancelled. Purchase cannot proceed without approval.', 'warning')
                        } else {
                            alert('❌ Approval cancelled. Purchase cannot proceed.')
                        }
                    } else {
                        if (window.showCustomModal) {
                            window.showCustomModal('Approval Error', 'Error approving USDT: ' + (error.message || 'Unknown error'), 'error')
                        } else {
                            alert('❌ Error approving USDT: ' + (error.message || 'Unknown error'))
                        }
                    }
                    return
                }
            }
            
            // Buy tokens
            console.log('🛒 Purchasing tokens...')
            if (referrer) {
                console.log('📋 Using referral:', referrer)
                if (window.showCustomModal) {
                    window.showCustomModal('Purchasing Tokens', 'Please confirm the transaction in your wallet.', 'info')
                } else {
                    alert('⏳ Purchasing tokens... Please confirm in your wallet.')
                }
                
                let tx
                try {
                    tx = await contract.buyTokensWithReferral(amountInWei, referrer)
                    console.log('⏳ Purchase transaction submitted:', tx.hash)
                    await tx.wait()
                    console.log('✅ Purchase confirmed')
                    if (window.showCustomModal) {
                        window.showCustomModal('Success!', 'Tokens purchased successfully!', 'success')
                    } else {
                        alert('✅ Tokens purchased successfully!')
                    }
                    localStorage.removeItem('referralAddress')
                } catch (error) {
                    console.error('❌ Purchase error:', error)
                    throw error // Re-throw to be caught by outer catch
                }
            } else {
                console.log('📋 No referrer')
                if (window.showCustomModal) {
                    window.showCustomModal('Purchasing Tokens', 'Please confirm the transaction in your wallet.', 'info')
                } else {
                    alert('⏳ Purchasing tokens... Please confirm in your wallet.')
                }
                
                let tx
                try {
                    tx = await contract.buyTokens(amountInWei)
                    console.log('⏳ Purchase transaction submitted:', tx.hash)
                    await tx.wait()
                    console.log('✅ Purchase confirmed')
                    if (window.showCustomModal) {
                        window.showCustomModal('Success!', 'Tokens purchased successfully!', 'success')
                    } else {
                        alert('✅ Tokens purchased successfully!')
                    }
                } catch (error) {
                    console.error('❌ Purchase error:', error)
                    throw error // Re-throw to be caught by outer catch
                }
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
                if (window.showCustomModal) {
                    window.showCustomModal('Transaction Rejected', 'The transaction was rejected by user.', 'error')
                } else {
                    alert('❌ Transaction rejected by user.')
                }
            } else {
                const errorMsg = error.reason || error.message || 'Unknown error'
                if (window.showCustomModal) {
                    window.showCustomModal('Error', errorMsg, 'error')
                } else {
                    alert('❌ Error: ' + errorMsg)
                }
            }
    }
}

// Sell tokens function
    window.sellTokens = async function(tokenAmount) {
        const account = window.account
        const signer = window.signer
        if (!account || !signer) {
            if (window.showCustomModal) {
                window.showCustomModal('Wallet Not Connected', 'Please connect your wallet first!', 'warning')
            } else {
                alert('Please connect your wallet first!')
            }
            return
        }

        if (!contract) setupContracts()

        try {
            const amountInWei = ethers.utils.parseUnits(tokenAmount.toString(), 18)

            if (window.showCustomModal) {
                window.showCustomModal('Selling Tokens', 'Please confirm the transaction in your wallet.', 'info')
            } else {
                alert('⏳ Selling tokens... Please confirm in your wallet.')
            }
            const tx = await contract.sellTokens(amountInWei)
            await tx.wait()
            if (window.showCustomModal) {
                window.showCustomModal('Success!', 'Tokens sold successfully!', 'success')
            } else {
                alert('✅ Tokens sold successfully!')
            }

            setTimeout(() => updateDashboard(), 2000)

        } catch (error) {
            console.error('Sell tokens error:', error)
            const errorMsg = error.reason || error.message || 'Unknown error'
            if (window.showCustomModal) {
                window.showCustomModal('Error', errorMsg, 'error')
            } else {
                alert('❌ Error: ' + errorMsg)
            }
        }
    }

// Claim rewards function
    async function claimRewards() {
        const account = window.account
        const signer = window.signer
        if (!account || !signer) {
            if (window.showCustomModal) {
                window.showCustomModal('Wallet Not Connected', 'Please connect your wallet first!', 'warning')
            } else {
                alert('Please connect your wallet first!')
            }
            return
        }

        if (!contract) setupContracts()

        try {
            if (window.showCustomModal) {
                window.showCustomModal('Claiming Rewards', 'Please confirm the transaction in your wallet.', 'info')
            } else {
                alert('⏳ Claiming rewards... Please confirm in your wallet.')
            }
            const tx = await contract.claimRewards()
            await tx.wait()
            if (window.showCustomModal) {
                window.showCustomModal('Success!', 'Rewards claimed successfully!', 'success')
            } else {
                alert('✅ Rewards claimed successfully!')
            }

            setTimeout(() => updateDashboard(), 2000)

        } catch (error) {
            console.error('Claim rewards error:', error)
            const errorMsg = error.reason || error.message || 'Unknown error'
            if (window.showCustomModal) {
                window.showCustomModal('Error', errorMsg, 'error')
            } else {
                alert('❌ Error: ' + errorMsg)
            }
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

