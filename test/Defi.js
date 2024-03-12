// Importing necessary modules from Hardhat
const { expect } = require("chai");
const { ethers } = require("hardhat");

// Define constants for testing
const INITIAL_SUPPLY = ethers.utils.parseEther("1000000");
const STAKING_AMOUNT = ethers.utils.parseEther("1000");
const REWARD_PER_DEFI_PER_DAY = ethers.utils.parseEther("1");
const DAY_IN_SECONDS = 86400; // 1 day in seconds

describe("DEFIStaking", function () {
  // hold contract instances
  let DEFIStaking;
  let DEFI;

  // deployed contract instances
  let defiStaking;
  let defiToken;

  // user addresses
  let owner;
  let user;

 
  beforeEach(async function () {
    [owner, user] = await ethers.getSigners();

    // Deploy DEFI token contract
    DEFI = await ethers.getContractFactory("DEFIToken");
    defiToken = await DEFI.deploy(INITIAL_SUPPLY);
    await defiToken.deployed();

    // Deploy DEFIStaking contract
    DEFIStaking = await ethers.getContractFactory("DEFIStaking");
    defiStaking = await DEFIStaking.deploy(defiToken.address);
    await defiStaking.deployed();
    

    // Transfer some DEFI tokens to the user
    await defiToken.transfer(user.address, STAKING_AMOUNT.mul(10));

    // Approve DEFIStaking contract to spend user's DEFI tokens
    await defiToken.connect(user).approve(defiStaking.address, STAKING_AMOUNT.mul(10));
  });

  // Test staking function
  it("Should be able to stake DEFI tokens", async function () {
    // Stake DEFI tokens
    await defiStaking.connect(user).stake(STAKING_AMOUNT);

    // Check user's staked amount
    const userStakedAmount = await defiStaking.viewStakedAmount();
    expect(userStakedAmount).to.equal(STAKING_AMOUNT);
  });

  // Test withdraw function
  it("Should withdraw staked DEFI tokens", async function () {
    // Stake DEFI tokens
    await defiStaking.connect(user).stake(STAKING_AMOUNT);

    // Withdraw staked DEFI tokens
    await defiStaking.connect(user).withdraw();

    // Check user's staked amount
    const userStakedAmount = await defiStaking.viewStakedAmount();
    expect(userStakedAmount).to.equal(0);
  });

  it("should accumulate rewards over one day during withdrawal", async function () {
    await defiStaking.connect(user).stake(STAKING_AMOUNT);

    // Fast-forward time by one day (86400 seconds)
    await network.provider.send("evm_increaseTime", [DAY_IN_SECONDS]);
    await network.provider.send("evm_mine");

    const initialBalance = await defiToken.balanceOf(user.address);

    await defiStaking.connect(user).withdraw();

    const finalBalance = await defiToken.balanceOf(user.address);
    const rewards = finalBalance-initialBalance-STAKING_AMOUNT;
    // Calculate expected rewards for one day
    const expectedRewards = STAKING_AMOUNT.mul(REWARD_PER_DEFI_PER_DAY).div(STAKING_AMOUNT);

    // Verify that the user received the correct amount of rewards
    expect(rewards).to.equal(expectedRewards);
});
});
