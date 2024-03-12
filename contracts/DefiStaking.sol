// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract DEFIStaking {
    using SafeERC20 for IERC20;

    uint256 constant REWARD_PER_DEFI_PER_DAY = 1e18; // 1 DEFI per day
    uint256 constant DEFI_STAKED_FOR_REWARD = 1e21; // 1000 DEFI for reward calculation
    uint256 constant DAY_IN_SECONDS = 86400; // 1 day in seconds

    struct UserInfo {
        uint256 stakedAmount;
        uint256 lastUpdateTime;
        uint256 rewardsEarned;
        bool hasStaked;
    }

    mapping(address => UserInfo) public userInfo;

    IERC20 public DEFI;

    event Staked(address indexed user, uint256 amount);
    event Withdrawn(address indexed user, uint256 amount, uint256 rewards);

    constructor(address _DEFI) {
        DEFI = IERC20(_DEFI);
    }

    function stake(uint256 amount) external {
        //checks
        require(amount > 0, "Amount must be greater than 0");
       
        UserInfo storage user = userInfo[msg.sender];
        require(user.hasStaked==false,"User is allowed to stake only once!!!");
        //effects
        updateRewards(user);
        user.stakedAmount += amount;
        user.hasStaked=true;
        user.lastUpdateTime = block.timestamp;
        //interactions
        DEFI.safeTransferFrom(msg.sender, address(this), amount);
        emit Staked(msg.sender, amount);
    }

    function withdraw() external {
        UserInfo storage user = userInfo[msg.sender];
        require(user.stakedAmount > 0, "Nothing staked");
        
        updateRewards(user);
        uint256 totalAmount = user.stakedAmount + user.rewardsEarned;
        
        delete userInfo[msg.sender];
        
        DEFI.safeTransfer(msg.sender, totalAmount);
        emit Withdrawn(msg.sender, user.stakedAmount, user.rewardsEarned);
    }

    function updateRewards(UserInfo storage user) internal {
        if (user.stakedAmount == 0) {
            return;
        }

        uint256 currentTime = block.timestamp;
        uint256 lastUpdateTime = user.lastUpdateTime;

        if (currentTime > lastUpdateTime) {
            uint256 elapsedTime = currentTime - lastUpdateTime;
            uint256 daysElapsed = elapsedTime / DAY_IN_SECONDS; // Convert seconds to days

            if (daysElapsed > 0) {
                user.rewardsEarned += (user.stakedAmount * daysElapsed * REWARD_PER_DEFI_PER_DAY) / DEFI_STAKED_FOR_REWARD;
                user.lastUpdateTime = currentTime;
            }
        }
    }

    function viewStakedAmount() public view returns(uint256){
        UserInfo storage user = userInfo[msg.sender];
        return user.stakedAmount;
    }
}
