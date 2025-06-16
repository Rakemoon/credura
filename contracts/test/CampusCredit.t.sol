// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "forge-std/Test.sol";
import "../src/CampusCredit.sol";

contract CampusCreditTest is Test {
    CampusCredit public campusCredit;

    address public admin = address(0x1);
    address public pauser = address(0x2);
    address public minter = address(0x3);
    address public student1 = address(0x4);
    address public student2 = address(0x5);
    address public merchant1 = address(0x6);
    address public merchant2 = address(0x7);
    address public unauthorizedUser = address(0x8);

    event TransferWithCashback(address indexed from, address indexed merchant, uint256 amount, uint256 cashback);
    event Claimed(address indexed user, uint256 amount);

    function setUp() public {
        vm.startPrank(admin);
        campusCredit = new CampusCredit();

        campusCredit.grantRole(campusCredit.PAUSER_ROLE(), pauser);
        campusCredit.grantRole(campusCredit.MINTER_ROLE(), minter);

        vm.stopPrank();
    }

    function testDeploymentInitialization() public view {
        assertEq(campusCredit.name(), "Campus Credit");
        assertEq(campusCredit.symbol(), "CREDIT");
        assertEq(campusCredit.decimals(), 18);
        assertEq(campusCredit.totalSupply(), 1_000_000 * 10 ** 18);
        assertEq(campusCredit.balanceOf(admin), 1_000_000 * 10 ** 18);
    }

    function testInitialRoles() public view {
        assertTrue(campusCredit.hasRole(campusCredit.DEFAULT_ADMIN_ROLE(), admin));
        assertTrue(campusCredit.hasRole(campusCredit.PAUSER_ROLE(), admin));
        assertTrue(campusCredit.hasRole(campusCredit.MINTER_ROLE(), admin));
        assertTrue(campusCredit.hasRole(campusCredit.PAUSER_ROLE(), pauser));
        assertTrue(campusCredit.hasRole(campusCredit.MINTER_ROLE(), minter));
    }

    function testPauseUnpause() public {
        vm.startPrank(pauser);

        campusCredit.pause();
        assertTrue(campusCredit.paused());

        campusCredit.unpause();
        assertFalse(campusCredit.paused());

        vm.stopPrank();
    }

    function testPauseUnauthorized() public {
        vm.startPrank(unauthorizedUser);

        vm.expectRevert("Caller is not a paus00r");
        campusCredit.pause();

        vm.stopPrank();
    }

    function testUnpauseUnauthorized() public {
        vm.prank(pauser);
        campusCredit.pause();

        vm.startPrank(unauthorizedUser);
        vm.expectRevert("Caller is not a paus00r");
        campusCredit.unpause();
        vm.stopPrank();
    }

    function testTransferWhenPaused() public {
        vm.prank(minter);
        campusCredit.mint(student1, 1000 * 10 ** 18);

        vm.prank(pauser);
        campusCredit.pause();

        vm.startPrank(student1);
        vm.expectRevert("Token transfers paused");
        campusCredit.transfer(student2, 100 * 10 ** 18);
        vm.stopPrank();
    }

    function testMintSuccess() public {
        uint256 mintAmount = 1000 * 10 ** 18;
        uint256 initialBalance = campusCredit.balanceOf(student1);
        uint256 initialSupply = campusCredit.totalSupply();

        vm.prank(minter);
        campusCredit.mint(student1, mintAmount);

        assertEq(campusCredit.balanceOf(student1), initialBalance + mintAmount);
        assertEq(campusCredit.totalSupply(), initialSupply + mintAmount);
    }

    function testMintUnauthorized() public {
        vm.startPrank(unauthorizedUser);
        vm.expectRevert("Caller is not a minter");
        campusCredit.mint(student1, 1000 * 10 ** 18);
        vm.stopPrank();
    }

    function testMintZeroAmount() public {
        vm.startPrank(minter);
        vm.expectRevert("Amount must be greater than zero");
        campusCredit.mint(student1, 0);
        vm.stopPrank();
    }

    function testMintToZeroAddress() public {
        vm.startPrank(minter);
        vm.expectRevert("Cannot mint to zero address");
        campusCredit.mint(address(0), 1000 * 10 ** 18);
        vm.stopPrank();
    }

    function testMintExceedsLimit() public {
        vm.startPrank(minter);
        vm.expectRevert("Minting limit exceeded");
        campusCredit.mint(student1, 1_000_001 * 10 ** 18);
        vm.stopPrank();
    }

    function testRegisterMerchant() public {
        vm.startPrank(admin);
        campusCredit.registerMerchant(merchant1, "Campus Cafeteria");

        assertTrue(campusCredit.isMerchant(merchant1));
        assertEq(campusCredit.merchantName(merchant1), "Campus Cafeteria");
        vm.stopPrank();
    }

    function testRegisterMerchantUnauthorized() public {
        vm.startPrank(unauthorizedUser);
        vm.expectRevert();
        campusCredit.registerMerchant(merchant1, "Campus Cafeteria");
        vm.stopPrank();
    }

    function testRegisterMerchantZeroAddress() public {
        vm.startPrank(admin);
        vm.expectRevert("Invalid merchant address");
        campusCredit.registerMerchant(address(0), "Campus Cafeteria");
        vm.stopPrank();
    }

    function testRegisterMerchantEmptyName() public {
        vm.startPrank(admin);
        vm.expectRevert("Merchant name cannot be empty");
        campusCredit.registerMerchant(merchant1, "");
        vm.stopPrank();
    }

    function testRegisterMerchantAlreadyRegistered() public {
        vm.startPrank(admin);
        campusCredit.registerMerchant(merchant1, "Campus Cafeteria");

        vm.expectRevert("Merchant already registered");
        campusCredit.registerMerchant(merchant1, "Another Name");
        vm.stopPrank();
    }

    function testSetDailyLimit() public {
        uint256 limit = 500 * 10 ** 18;

        vm.startPrank(admin);
        campusCredit.setDailyLimit(student1, limit);

        assertEq(campusCredit.dailySpendingLimit(student1), limit);
        assertEq(campusCredit.spentToday(student1), 0);
        assertGt(campusCredit.lastSpendingReset(student1), 0);
        vm.stopPrank();
    }

    function testSetDailyLimitUnauthorized() public {
        vm.startPrank(unauthorizedUser);
        vm.expectRevert();
        campusCredit.setDailyLimit(student1, 500 * 10 ** 18);
        vm.stopPrank();
    }

    function testSetDailyLimitZeroAddress() public {
        vm.startPrank(admin);
        vm.expectRevert("Invalid student address");
        campusCredit.setDailyLimit(address(0), 500 * 10 ** 18);
        vm.stopPrank();
    }

    function testSetDailyLimitZeroAmount() public {
        vm.startPrank(admin);
        vm.expectRevert("Limit must be greater than zero");
        campusCredit.setDailyLimit(student1, 0);
        vm.stopPrank();
    }

    function testTransferWithLimit() public {
        uint256 mintAmount = 1000 * 10 ** 18;
        uint256 dailyLimit = 500 * 10 ** 18;
        uint256 transferAmount = 100 * 10 ** 18;

        vm.prank(minter);
        campusCredit.mint(student1, mintAmount);

        vm.prank(admin);
        campusCredit.setDailyLimit(student1, dailyLimit);

        vm.startPrank(student1);
        campusCredit.transferWithLimit(student2, transferAmount);

        assertEq(campusCredit.balanceOf(student1), mintAmount - transferAmount);
        assertEq(campusCredit.balanceOf(student2), transferAmount);
        assertEq(campusCredit.spentToday(student1), transferAmount);
        vm.stopPrank();
    }

    function testTransferWithLimitExceeded() public {
        uint256 mintAmount = 1000 * 10 ** 18;
        uint256 dailyLimit = 500 * 10 ** 18;
        uint256 transferAmount = 600 * 10 ** 18;

        vm.prank(minter);
        campusCredit.mint(student1, mintAmount);

        vm.prank(admin);
        campusCredit.setDailyLimit(student1, dailyLimit);

        vm.startPrank(student1);
        vm.expectRevert("Daily spending limit exceeded");
        campusCredit.transferWithLimit(student2, transferAmount);
        vm.stopPrank();
    }

    function testTransferWithLimitNoLimitSet() public {
        uint256 mintAmount = 1000 * 10 ** 18;
        uint256 transferAmount = 100 * 10 ** 18;

        vm.prank(minter);
        campusCredit.mint(student1, mintAmount);

        vm.startPrank(student1);
        vm.expectRevert("Daily limit not set");
        campusCredit.transferWithLimit(student2, transferAmount);
        vm.stopPrank();
    }

    function testTransferWithLimitDailyReset() public {
        uint256 mintAmount = 1000 * 10 ** 18;
        uint256 dailyLimit = 500 * 10 ** 18;
        uint256 transferAmount = 400 * 10 ** 18;

        vm.prank(minter);
        campusCredit.mint(student1, mintAmount);

        vm.prank(admin);
        campusCredit.setDailyLimit(student1, dailyLimit);

        vm.startPrank(student1);
        campusCredit.transferWithLimit(student2, transferAmount);
        assertEq(campusCredit.spentToday(student1), transferAmount);

        vm.warp(block.timestamp + 1 days + 1);

        campusCredit.transferWithLimit(student2, transferAmount);
        assertEq(campusCredit.spentToday(student1), transferAmount);
        vm.stopPrank();
    }

    function testTransferWithCashback() public {
        uint256 mintAmount = 1000 * 10 ** 18;
        uint256 dailyLimit = 500 * 10 ** 18;
        uint256 transferAmount = 100 * 10 ** 18;
        uint256 expectedCashback = (transferAmount * 2) / 100;

        vm.prank(minter);
        campusCredit.mint(student1, mintAmount);

        vm.prank(admin);
        campusCredit.setDailyLimit(student1, dailyLimit);

        vm.prank(admin);
        campusCredit.registerMerchant(merchant1, "Campus Cafeteria");

        uint256 initialStudentBalance = campusCredit.balanceOf(student1);
        uint256 initialMerchantBalance = campusCredit.balanceOf(merchant1);
        uint256 initialSupply = campusCredit.totalSupply();

        vm.startPrank(student1);
        vm.expectEmit(true, true, false, true);
        emit TransferWithCashback(student1, merchant1, transferAmount, expectedCashback);

        campusCredit.transferWithCashback(merchant1, transferAmount);

        assertEq(campusCredit.balanceOf(student1), initialStudentBalance - transferAmount + expectedCashback);
        assertEq(campusCredit.balanceOf(merchant1), initialMerchantBalance + transferAmount);
        assertEq(campusCredit.totalSupply(), initialSupply + expectedCashback);
        assertEq(campusCredit.spentToday(student1), transferAmount);
        vm.stopPrank();
    }

    function testTransferWithCashbackNotMerchant() public {
        uint256 mintAmount = 1000 * 10 ** 18;
        uint256 dailyLimit = 500 * 10 ** 18;
        uint256 transferAmount = 100 * 10 ** 18;

        vm.prank(minter);
        campusCredit.mint(student1, mintAmount);

        vm.prank(admin);
        campusCredit.setDailyLimit(student1, dailyLimit);

        vm.startPrank(student1);
        vm.expectRevert("Not a registered merchant");
        campusCredit.transferWithCashback(student2, transferAmount);
        vm.stopPrank();
    }

    function testTransferWithCashbackExceedsLimit() public {
        uint256 mintAmount = 1000 * 10 ** 18;
        uint256 dailyLimit = 500 * 10 ** 18;
        uint256 transferAmount = 600 * 10 ** 18;

        vm.prank(minter);
        campusCredit.mint(student1, mintAmount);

        vm.prank(admin);
        campusCredit.setDailyLimit(student1, dailyLimit);

        vm.prank(admin);
        campusCredit.registerMerchant(merchant1, "Campus Cafeteria");

        vm.startPrank(student1);
        vm.expectRevert("Daily spending limit exceeded");
        campusCredit.transferWithCashback(merchant1, transferAmount);
        vm.stopPrank();
    }

    function testAddClaimable() public {
        uint256 claimableAmount = 100 * 10 ** 18;

        vm.startPrank(minter);
        campusCredit.addClaimable(student1, claimableAmount);

        assertEq(campusCredit.claimable(student1), claimableAmount);
        vm.stopPrank();
    }

    function testAddClaimableUnauthorized() public {
        vm.startPrank(unauthorizedUser);
        vm.expectRevert();
        campusCredit.addClaimable(student1, 100 * 10 ** 18);
        vm.stopPrank();
    }

    function testAddClaimableZeroAddress() public {
        vm.startPrank(minter);
        vm.expectRevert("Invalid user address");
        campusCredit.addClaimable(address(0), 100 * 10 ** 18);
        vm.stopPrank();
    }

    function testAddClaimableZeroAmount() public {
        vm.startPrank(minter);
        vm.expectRevert("Amount must be greater than zero");
        campusCredit.addClaimable(student1, 0);
        vm.stopPrank();
    }

    function testClaim() public {
        uint256 claimableAmount = 100 * 10 ** 18;

        vm.prank(minter);
        campusCredit.addClaimable(student1, claimableAmount);

        uint256 initialBalance = campusCredit.balanceOf(student1);
        uint256 initialSupply = campusCredit.totalSupply();

        vm.expectEmit(true, false, false, true);
        emit Claimed(student1, claimableAmount);

        campusCredit.claim(student1);

        assertEq(campusCredit.balanceOf(student1), initialBalance + claimableAmount);
        assertEq(campusCredit.totalSupply(), initialSupply + claimableAmount);
        assertEq(campusCredit.claimable(student1), 0);
    }

    function testClaimNoClaimableAmount() public {
        vm.expectRevert("No claimable CREDIT");
        campusCredit.claim(student1);
    }

    function testClaimMultiple() public {
        uint256 claimableAmount1 = 100 * 10 ** 18;
        uint256 claimableAmount2 = 50 * 10 ** 18;

        vm.startPrank(minter);
        campusCredit.addClaimable(student1, claimableAmount1);
        campusCredit.addClaimable(student1, claimableAmount2);
        vm.stopPrank();

        assertEq(campusCredit.claimable(student1), claimableAmount1 + claimableAmount2);

        uint256 initialBalance = campusCredit.balanceOf(student1);
        campusCredit.claim(student1);

        assertEq(campusCredit.balanceOf(student1), initialBalance + claimableAmount1 + claimableAmount2);
        assertEq(campusCredit.claimable(student1), 0);
    }

    function testBurn() public {
        uint256 mintAmount = 1000 * 10 ** 18;
        uint256 burnAmount = 100 * 10 ** 18;

        vm.prank(minter);
        campusCredit.mint(student1, mintAmount);

        uint256 initialBalance = campusCredit.balanceOf(student1);
        uint256 initialSupply = campusCredit.totalSupply();

        vm.startPrank(student1);
        campusCredit.burn(burnAmount);

        assertEq(campusCredit.balanceOf(student1), initialBalance - burnAmount);
        assertEq(campusCredit.totalSupply(), initialSupply - burnAmount);
        vm.stopPrank();
    }

    function testComplexScenario() public {
        uint256 mintAmount = 1000 * 10 ** 18;
        uint256 dailyLimit = 500 * 10 ** 18;

        vm.startPrank(minter);
        campusCredit.mint(student1, mintAmount);
        campusCredit.mint(student2, mintAmount);
        vm.stopPrank();

        vm.startPrank(admin);
        campusCredit.setDailyLimit(student1, dailyLimit);
        campusCredit.setDailyLimit(student2, dailyLimit);

        campusCredit.registerMerchant(merchant1, "Campus Cafeteria");
        campusCredit.registerMerchant(merchant2, "Campus Bookstore");
        vm.stopPrank();

        vm.startPrank(student1);
        campusCredit.transferWithCashback(merchant1, 100 * 10 ** 18);
        campusCredit.transferWithCashback(merchant2, 200 * 10 ** 18);
        vm.stopPrank();

        assertEq(campusCredit.spentToday(student1), 300 * 10 ** 18);
        assertEq(campusCredit.balanceOf(merchant1), 100 * 10 ** 18);
        assertEq(campusCredit.balanceOf(merchant2), 200 * 10 ** 18);

        uint256 expectedCashback = ((100 * 10 ** 18 + 200 * 10 ** 18) * 2) / 100;
        assertEq(campusCredit.balanceOf(student1), mintAmount - 300 * 10 ** 18 + expectedCashback);
    }

    function testCashbackPercentageGetter() public view {
        assertEq(campusCredit.cashbackPercentage(), 2);
    }
}
