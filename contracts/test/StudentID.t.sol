// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "forge-std/Test.sol";
import "../src/StudentID.sol";

contract StudentIDTest is Test {
    StudentID public studentID;
    address public alice = makeAddr("alice");
    address public bob = makeAddr("bob");
    address public charlie = makeAddr("charlie");

    string constant TEST_URI = "https://example.com/metadata/1";
    string constant ALICE_NIM = "12345678";
    string constant BOB_NIM = "87654321";
    string constant ALICE_NAME = "Alice Smith";
    string constant BOB_NAME = "Bob Johnson";
    string constant ALICE_MAJOR = "Computer Science";
    string constant BOB_MAJOR = "Mathematics";

    event StudentIDIssued(uint256 indexed tokenId, string nim, address student, uint256 expiryDate);
    event StudentIDRenewed(uint256 indexed tokenId, uint256 newExpiryDate);
    event StudentStatusUpdated(uint256 indexed tokenId, bool isActive);
    event ExpiredIDBurned(uint256 indexed tokenId);

    function setUp() public {
        studentID = new StudentID();
    }

    function testMintStudentID() public {
        vm.prank(alice);
        studentID.mintStudentID(ALICE_NIM, ALICE_NAME, ALICE_MAJOR, TEST_URI);

        assertEq(studentID.ownerOf(1), alice);
        assertEq(studentID.tokenURI(1), TEST_URI);

        (address owner, uint256 tokenId, StudentID.StudentData memory data) = studentID.getStudentByNIM(ALICE_NIM);

        assertEq(owner, alice);
        assertEq(tokenId, 1);
        assertEq(data.nim, ALICE_NIM);
        assertEq(data.name, ALICE_NAME);
        assertEq(data.major, ALICE_MAJOR);
        assertEq(data.enrollmentYear, block.timestamp / 365 days);
        assertEq(data.expiryDate, block.timestamp + 4 * 365 days);
        assertTrue(data.isActive);
        assertEq(data.semester, 1);

        assertEq(studentID.nimToTokenId(ALICE_NIM), 1);
        assertEq(studentID.addressToTokenId(alice), 1);
    }

    function testMintEmitsEvent() public {
        vm.expectEmit(true, false, false, true);
        emit StudentIDIssued(1, ALICE_NIM, alice, block.timestamp + 4 * 365 days);

        vm.prank(alice);
        studentID.mintStudentID(ALICE_NIM, ALICE_NAME, ALICE_MAJOR, TEST_URI);
    }

    function testMintMultipleStudents() public {
        vm.prank(alice);
        studentID.mintStudentID(ALICE_NIM, ALICE_NAME, ALICE_MAJOR, TEST_URI);

        vm.prank(bob);
        studentID.mintStudentID(BOB_NIM, BOB_NAME, BOB_MAJOR, TEST_URI);

        assertEq(studentID.ownerOf(1), alice);
        assertEq(studentID.ownerOf(2), bob);
        assertEq(studentID.addressToTokenId(alice), 1);
        assertEq(studentID.addressToTokenId(bob), 2);
    }

    function testCannotMintWithEmptyNIM() public {
        vm.prank(alice);
        vm.expectRevert("NIM cannot be empty");
        studentID.mintStudentID("", ALICE_NAME, ALICE_MAJOR, TEST_URI);
    }

    function testCannotMintWithEmptyName() public {
        vm.prank(alice);
        vm.expectRevert("Name cannot be empty");
        studentID.mintStudentID(ALICE_NIM, "", ALICE_MAJOR, TEST_URI);
    }

    function testCannotMintWithEmptyMajor() public {
        vm.prank(alice);
        vm.expectRevert("Major cannot be empty");
        studentID.mintStudentID(ALICE_NIM, ALICE_NAME, "", TEST_URI);
    }

    function testCannotMintDuplicateNIM() public {
        vm.prank(alice);
        studentID.mintStudentID(ALICE_NIM, ALICE_NAME, ALICE_MAJOR, TEST_URI);

        vm.prank(bob);
        vm.expectRevert("NIM already exists");
        studentID.mintStudentID(ALICE_NIM, BOB_NAME, BOB_MAJOR, TEST_URI);
    }

    function testCannotMintTwiceFromSameAddress() public {
        vm.prank(alice);
        studentID.mintStudentID(ALICE_NIM, ALICE_NAME, ALICE_MAJOR, TEST_URI);

        vm.prank(alice);
        vm.expectRevert("Address already has an ID");
        studentID.mintStudentID(BOB_NIM, BOB_NAME, BOB_MAJOR, TEST_URI);
    }

    function testRenewEmitsEvent() public {
        vm.prank(alice);
        studentID.mintStudentID(ALICE_NIM, ALICE_NAME, ALICE_MAJOR, TEST_URI);

        vm.prank(alice);
        studentID.renewStudentID(1);
    }

    function testCannotRenewNotYourID() public {
        vm.prank(alice);
        studentID.mintStudentID(ALICE_NIM, ALICE_NAME, ALICE_MAJOR, TEST_URI);

        vm.prank(bob);
        vm.expectRevert("Not your ID");
        studentID.renewStudentID(1);
    }

    function testCannotRenewInactiveStudent() public {
        vm.prank(alice);
        studentID.mintStudentID(ALICE_NIM, ALICE_NAME, ALICE_MAJOR, TEST_URI);

        vm.prank(alice);
        studentID.updateStudentStatus(1, false);

        vm.expectRevert();
        vm.prank(alice);
        studentID.renewStudentID(1);
    }

    function testCannotRenewExpiredID() public {
        vm.prank(alice);
        studentID.mintStudentID(ALICE_NIM, ALICE_NAME, ALICE_MAJOR, TEST_URI);

        vm.warp(block.timestamp + 5 * 365 days);

        vm.prank(alice);
        vm.expectRevert("Cannot renew expired ID");
        studentID.renewStudentID(1);
    }

    function testUpdateStudentStatusActive() public {
        vm.prank(alice);
        studentID.mintStudentID(ALICE_NIM, ALICE_NAME, ALICE_MAJOR, TEST_URI);

        vm.expectEmit(true, false, false, true);
        emit StudentStatusUpdated(1, false);

        vm.prank(alice);
        studentID.updateStudentStatus(1, false);
    }

    function testUpdateStudentStatusInactiveBurnsToken() public {
        vm.prank(alice);
        studentID.mintStudentID(ALICE_NIM, ALICE_NAME, ALICE_MAJOR, TEST_URI);

        vm.expectEmit(true, false, false, false);
        emit ExpiredIDBurned(1);

        vm.prank(alice);
        studentID.updateStudentStatus(1, false);

        vm.expectRevert();
        studentID.ownerOf(1);
    }

    function testCannotUpdateStatusNotYourID() public {
        vm.prank(alice);
        studentID.mintStudentID(ALICE_NIM, ALICE_NAME, ALICE_MAJOR, TEST_URI);

        vm.prank(bob);
        vm.expectRevert("Not your ID");
        studentID.updateStudentStatus(1, false);
    }

    function testBurnExpiredByOwner() public {
        vm.prank(alice);
        studentID.mintStudentID(ALICE_NIM, ALICE_NAME, ALICE_MAJOR, TEST_URI);

        vm.warp(block.timestamp + 5 * 365 days);

        vm.expectEmit(true, false, false, false);
        emit ExpiredIDBurned(1);

        vm.prank(alice);
        studentID.burnExpired(1);

        vm.expectRevert();
        studentID.ownerOf(1);

        assertEq(studentID.nimToTokenId(ALICE_NIM), 0);
        assertEq(studentID.addressToTokenId(alice), 0);
    }

    function testBurnInactiveByOwner() public {
        vm.prank(alice);
        studentID.mintStudentID(ALICE_NIM, ALICE_NAME, ALICE_MAJOR, TEST_URI);

        vm.prank(alice);
        studentID.updateStudentStatus(1, false);

        vm.expectRevert();
        studentID.ownerOf(1);
    }

    function testCannotBurnNotExpiredOrActive() public {
        vm.prank(alice);
        studentID.mintStudentID(ALICE_NIM, ALICE_NAME, ALICE_MAJOR, TEST_URI);

        vm.prank(alice);
        vm.expectRevert("ID is not expired or inactive");
        studentID.burnExpired(1);
    }

    function testCannotBurnNotOwner() public {
        vm.prank(alice);
        studentID.mintStudentID(ALICE_NIM, ALICE_NAME, ALICE_MAJOR, TEST_URI);

        vm.warp(block.timestamp + 5 * 365 days);

        vm.prank(bob);
        vm.expectRevert("Only token owner can burn");
        studentID.burnExpired(1);
    }

    function testCannotBurnNonExistentToken() public {
        vm.prank(alice);
        vm.expectRevert("Token does not exist");
        studentID.burnExpired(999);
    }

    function testIsExpiredFalseForNewToken() public {
        vm.prank(alice);
        studentID.mintStudentID(ALICE_NIM, ALICE_NAME, ALICE_MAJOR, TEST_URI);

        assertFalse(studentID.isExpired(1));
    }

    function testIsExpiredTrueAfterExpiry() public {
        vm.prank(alice);
        studentID.mintStudentID(ALICE_NIM, ALICE_NAME, ALICE_MAJOR, TEST_URI);

        vm.warp(block.timestamp + 5 * 365 days);

        assertTrue(studentID.isExpired(1));
    }

    function testIsExpiredNonExistentToken() public {
        vm.expectRevert("Token does not exist");
        studentID.isExpired(999);
    }

    function testGetStudentByNIM() public {
        vm.prank(alice);
        studentID.mintStudentID(ALICE_NIM, ALICE_NAME, ALICE_MAJOR, TEST_URI);

        (address owner, uint256 tokenId, StudentID.StudentData memory data) = studentID.getStudentByNIM(ALICE_NIM);

        assertEq(owner, alice);
        assertEq(tokenId, 1);
        assertEq(data.nim, ALICE_NIM);
        assertEq(data.name, ALICE_NAME);
        assertEq(data.major, ALICE_MAJOR);
    }

    function testGetStudentByNIMEmptyNIM() public {
        vm.expectRevert("NIM cannot be empty");
        studentID.getStudentByNIM("");
    }

    function testGetStudentByNIMNotFound() public {
        vm.expectRevert("NIM not found");
        studentID.getStudentByNIM("999999");
    }

    function testCannotTransfer() public {
        vm.prank(alice);
        studentID.mintStudentID(ALICE_NIM, ALICE_NAME, ALICE_MAJOR, TEST_URI);

        vm.prank(alice);
        vm.expectRevert("SID is non-transferable");
        studentID.transferFrom(alice, bob, 1);
    }

    function testCannotSafeTransfer() public {
        vm.prank(alice);
        studentID.mintStudentID(ALICE_NIM, ALICE_NAME, ALICE_MAJOR, TEST_URI);

        vm.prank(alice);
        vm.expectRevert("SID is non-transferable");
        studentID.safeTransferFrom(alice, bob, 1);
    }

    function testDataIntegrity() public {
        vm.prank(alice);
        studentID.mintStudentID(ALICE_NIM, ALICE_NAME, ALICE_MAJOR, TEST_URI);

        assertEq(studentID.nimToTokenId(ALICE_NIM), 1);
        assertEq(studentID.addressToTokenId(alice), 1);
        assertEq(studentID.ownerOf(1), alice);
    }
}
