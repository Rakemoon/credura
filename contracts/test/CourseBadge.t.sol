// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "forge-std/Test.sol";
import "../src/CourseBadge.sol";

contract CourseBadgeTest is Test {
    CourseBadge public courseBadge;

    address public admin = address(0x1);
    address public minter = address(0x2);
    address public uriSetter = address(0x3);
    address public pauser = address(0x4);
    address public student1 = address(0x5);
    address public student2 = address(0x6);
    address public unauthorizedUser = address(0x7);

    string constant TEST_URI = "https://example.com/token/{id}.json";
    string constant CERTIFICATE_NAME = "Blockchain Fundamentals Certificate";
    string constant ADDITIONAL_DATA = "Grade: A+, Completion Date: 2024-01-15";

    event CertificateTypeCreated(uint256 indexed tokenId, string name);
    event EventBadgeTypeCreated(uint256 indexed tokenId, string name);
    event BadgeIssued(address indexed student, uint256 indexed tokenId, uint256 amount);

    function setUp() public {
        vm.startPrank(admin);
        courseBadge = new CourseBadge();

        courseBadge.grantRole(courseBadge.MINTER_ROLE(), minter);
        courseBadge.grantRole(courseBadge.URI_SETTER_ROLE(), uriSetter);
        courseBadge.grantRole(courseBadge.PAUSER_ROLE(), pauser);

        vm.stopPrank();
    }

    function testDeploymentInitialization() public view {
        assertEq(courseBadge.CERTIFICATE_BASE(), 1000);
        assertEq(courseBadge.EVENT_BADGE_BASE(), 2000);
        assertEq(courseBadge.ACHIEVEMENT_BASE(), 3000);
        assertEq(courseBadge.WORKSHOP_BASE(), 4000);
    }

    function testInitialRoles() public view {
        assertTrue(courseBadge.hasRole(courseBadge.DEFAULT_ADMIN_ROLE(), admin));
        assertTrue(courseBadge.hasRole(courseBadge.URI_SETTER_ROLE(), admin));
        assertTrue(courseBadge.hasRole(courseBadge.PAUSER_ROLE(), admin));
        assertTrue(courseBadge.hasRole(courseBadge.MINTER_ROLE(), admin));

        assertTrue(courseBadge.hasRole(courseBadge.MINTER_ROLE(), minter));
        assertTrue(courseBadge.hasRole(courseBadge.URI_SETTER_ROLE(), uriSetter));
        assertTrue(courseBadge.hasRole(courseBadge.PAUSER_ROLE(), pauser));
    }

    function testSupportsInterface() public view {
        assertTrue(courseBadge.supportsInterface(0xd9b67a26));
        assertTrue(courseBadge.supportsInterface(0x01ffc9a7));
        assertTrue(courseBadge.supportsInterface(0x7965db0b));
    }

    function testCreateCertificateType() public {
        uint256 maxSupply = 100;

        vm.startPrank(minter);
        vm.expectEmit(true, false, false, true);
        emit CertificateTypeCreated(1000, CERTIFICATE_NAME);

        uint256 tokenId = courseBadge.createCertificateType(CERTIFICATE_NAME, maxSupply, TEST_URI);

        assertEq(tokenId, 1000);

        (
            string memory name,
            string memory category,
            uint256 maxSupplyStored,
            bool isTransferable,
            uint256 validUntil,
            address issuer
        ) = courseBadge.tokenInfo(tokenId);

        assertEq(name, CERTIFICATE_NAME);
        assertEq(category, "certificate");
        assertEq(maxSupplyStored, maxSupply);
        assertFalse(isTransferable);
        assertEq(validUntil, 0);
        assertEq(issuer, minter);

        assertEq(courseBadge.uri(tokenId), TEST_URI);

        vm.stopPrank();
    }

    function testCreateCertificateTypeUnauthorized() public {
        vm.startPrank(unauthorizedUser);
        vm.expectRevert();
        courseBadge.createCertificateType(CERTIFICATE_NAME, 100, TEST_URI);
        vm.stopPrank();
    }

    function testCreateCertificateTypeZeroMaxSupply() public {
        vm.startPrank(minter);
        vm.expectRevert("Max supply must be greater than 0");
        courseBadge.createCertificateType(CERTIFICATE_NAME, 0, TEST_URI);
        vm.stopPrank();
    }

    function testCreateCertificateTypeEmptyName() public {
        vm.startPrank(minter);
        vm.expectRevert("Name cannot be empty");
        courseBadge.createCertificateType("", 100, TEST_URI);
        vm.stopPrank();
    }

    function testCreateMultipleCertificateTypes() public {
        vm.startPrank(minter);

        uint256 tokenId1 = courseBadge.createCertificateType("Certificate 1", 100, TEST_URI);
        uint256 tokenId2 = courseBadge.createCertificateType("Certificate 2", 200, TEST_URI);
        uint256 tokenId3 = courseBadge.createCertificateType("Certificate 3", 300, TEST_URI);

        assertEq(tokenId1, 1000);
        assertEq(tokenId2, 1001);
        assertEq(tokenId3, 1002);

        vm.stopPrank();
    }

    function testIssueCertificate() public {
        vm.startPrank(minter);
        uint256 tokenId = courseBadge.createCertificateType(CERTIFICATE_NAME, 100, TEST_URI);

        vm.expectEmit(true, true, false, true);
        emit BadgeIssued(student1, tokenId, 1);

        courseBadge.issueCertificate(student1, tokenId, ADDITIONAL_DATA);

        assertEq(courseBadge.balanceOf(student1, tokenId), 1);
        assertEq(courseBadge.totalSupply(tokenId), 1);
        assertGt(courseBadge.earnedAt(tokenId, student1), 0);
        assertEq(courseBadge.certificateAdditionalData(tokenId, student1), ADDITIONAL_DATA);

        vm.stopPrank();
    }

    function testIssueCertificateUnauthorized() public {
        vm.prank(minter);
        uint256 tokenId = courseBadge.createCertificateType(CERTIFICATE_NAME, 100, TEST_URI);

        vm.startPrank(unauthorizedUser);
        vm.expectRevert();
        courseBadge.issueCertificate(student1, tokenId, ADDITIONAL_DATA);
        vm.stopPrank();
    }

    function testIssueCertificateZeroAddress() public {
        vm.startPrank(minter);
        uint256 tokenId = courseBadge.createCertificateType(CERTIFICATE_NAME, 100, TEST_URI);

        vm.expectRevert("Invalid student address");
        courseBadge.issueCertificate(address(0), tokenId, ADDITIONAL_DATA);
        vm.stopPrank();
    }

    function testIssueCertificateInvalidType() public {
        vm.startPrank(minter);
        vm.expectRevert("Invalid certificate type");
        courseBadge.issueCertificate(student1, 9999, ADDITIONAL_DATA);
        vm.stopPrank();
    }

    function testIssueCertificateAlreadyOwned() public {
        vm.startPrank(minter);
        uint256 tokenId = courseBadge.createCertificateType(CERTIFICATE_NAME, 100, TEST_URI);
        courseBadge.issueCertificate(student1, tokenId, ADDITIONAL_DATA);

        vm.expectRevert("Student already has this certificate");
        courseBadge.issueCertificate(student1, tokenId, ADDITIONAL_DATA);
        vm.stopPrank();
    }

    function testIssueCertificateMaxSupplyExceeded() public {
        vm.startPrank(minter);
        uint256 tokenId = courseBadge.createCertificateType(CERTIFICATE_NAME, 1, TEST_URI);

        courseBadge.issueCertificate(student1, tokenId, ADDITIONAL_DATA);

        vm.expectRevert("Max supply exceeded");
        courseBadge.issueCertificate(student2, tokenId, ADDITIONAL_DATA);
        vm.stopPrank();
    }

    function testIssueMultipleCertificatesToSameStudent() public {
        vm.startPrank(minter);

        uint256 tokenId1 = courseBadge.createCertificateType("Certificate 1", 100, TEST_URI);
        uint256 tokenId2 = courseBadge.createCertificateType("Certificate 2", 100, TEST_URI);

        courseBadge.issueCertificate(student1, tokenId1, "Data 1");
        courseBadge.issueCertificate(student1, tokenId2, "Data 2");

        assertEq(courseBadge.balanceOf(student1, tokenId1), 1);
        assertEq(courseBadge.balanceOf(student1, tokenId2), 1);

        vm.stopPrank();
    }

    function testSetTokenURIUnauthorized() public {
        vm.prank(minter);
        uint256 tokenId = courseBadge.createCertificateType(CERTIFICATE_NAME, 100, TEST_URI);

        vm.startPrank(unauthorizedUser);
        vm.expectRevert();
        courseBadge.setTokenURI(tokenId, "new uri");
        vm.stopPrank();
    }

    function testSetTokenURIEmptyURI() public {
        vm.prank(minter);
        uint256 tokenId = courseBadge.createCertificateType(CERTIFICATE_NAME, 100, TEST_URI);

        vm.startPrank(uriSetter);
        vm.expectRevert("URI cannot be empty");
        courseBadge.setTokenURI(tokenId, "");
        vm.stopPrank();
    }

    function testSetTokenURIInvalidTokenId() public {
        vm.startPrank(uriSetter);
        vm.expectRevert("Token ID does not exist");
        courseBadge.setTokenURI(9999, "new uri");
        vm.stopPrank();
    }

    function testTransferRestriction() public {
        vm.startPrank(minter);
        uint256 tokenId = courseBadge.createCertificateType(CERTIFICATE_NAME, 100, TEST_URI);
        courseBadge.issueCertificate(student1, tokenId, ADDITIONAL_DATA);
        vm.stopPrank();

        vm.startPrank(student1);
        vm.expectRevert("Token not transferable");
        courseBadge.safeTransferFrom(student1, student2, tokenId, 1, "");
        vm.stopPrank();
    }

    function testBatchTransferRestriction() public {
        vm.startPrank(minter);
        uint256 tokenId = courseBadge.createCertificateType(CERTIFICATE_NAME, 100, TEST_URI);
        courseBadge.issueCertificate(student1, tokenId, ADDITIONAL_DATA);
        vm.stopPrank();

        uint256[] memory ids = new uint256[](1);
        uint256[] memory amounts = new uint256[](1);
        ids[0] = tokenId;
        amounts[0] = 1;

        vm.startPrank(student1);
        vm.expectRevert("Token not transferable");
        courseBadge.safeBatchTransferFrom(student1, student2, ids, amounts, "");
        vm.stopPrank();
    }

    function testStudentBadgesGetter() public {
        vm.startPrank(minter);

        uint256 tokenId1 = courseBadge.createCertificateType("Certificate 1", 100, TEST_URI);
        uint256 tokenId2 = courseBadge.createCertificateType("Certificate 2", 100, TEST_URI);
        uint256 tokenId3 = courseBadge.createCertificateType("Certificate 3", 100, TEST_URI);

        courseBadge.issueCertificate(student1, tokenId1, "Data 1");
        courseBadge.issueCertificate(student1, tokenId2, "Data 2");
        courseBadge.issueCertificate(student1, tokenId3, "Data 3");

        vm.stopPrank();
    }

    function testEarnedAtMapping() public {
        vm.startPrank(minter);
        uint256 tokenId = courseBadge.createCertificateType(CERTIFICATE_NAME, 100, TEST_URI);

        uint256 beforeTime = block.timestamp;
        courseBadge.issueCertificate(student1, tokenId, ADDITIONAL_DATA);
        uint256 afterTime = block.timestamp;

        uint256 earnedTime = courseBadge.earnedAt(tokenId, student1);
        assertGe(earnedTime, beforeTime);
        assertLe(earnedTime, afterTime);

        vm.stopPrank();
    }

    function testCertificateAdditionalDataMapping() public {
        vm.startPrank(minter);
        uint256 tokenId = courseBadge.createCertificateType(CERTIFICATE_NAME, 100, TEST_URI);

        courseBadge.issueCertificate(student1, tokenId, ADDITIONAL_DATA);

        assertEq(courseBadge.certificateAdditionalData(tokenId, student1), ADDITIONAL_DATA);

        vm.stopPrank();
    }

    function testComplexScenario() public {
        vm.startPrank(minter);

        uint256 basicCert = courseBadge.createCertificateType("Basic Blockchain", 50, TEST_URI);
        uint256 advancedCert = courseBadge.createCertificateType("Advanced Smart Contracts", 25, TEST_URI);
        uint256 expertCert = courseBadge.createCertificateType("Expert DeFi", 10, TEST_URI);

        courseBadge.issueCertificate(student1, basicCert, "Grade: A");
        courseBadge.issueCertificate(student1, advancedCert, "Grade: B+");

        courseBadge.issueCertificate(student2, basicCert, "Grade: A-");
        courseBadge.issueCertificate(student2, expertCert, "Grade: A+");

        assertEq(courseBadge.balanceOf(student1, basicCert), 1);
        assertEq(courseBadge.balanceOf(student1, advancedCert), 1);
        assertEq(courseBadge.balanceOf(student1, expertCert), 0);

        assertEq(courseBadge.balanceOf(student2, basicCert), 1);
        assertEq(courseBadge.balanceOf(student2, advancedCert), 0);
        assertEq(courseBadge.balanceOf(student2, expertCert), 1);

        assertEq(courseBadge.totalSupply(basicCert), 2);
        assertEq(courseBadge.totalSupply(advancedCert), 1);
        assertEq(courseBadge.totalSupply(expertCert), 1);

        vm.stopPrank();
    }

    function testBalanceOfBatch() public {
        vm.startPrank(minter);

        uint256 tokenId1 = courseBadge.createCertificateType("Certificate 1", 100, TEST_URI);
        uint256 tokenId2 = courseBadge.createCertificateType("Certificate 2", 100, TEST_URI);

        courseBadge.issueCertificate(student1, tokenId1, "Data 1");
        courseBadge.issueCertificate(student2, tokenId2, "Data 2");

        address[] memory accounts = new address[](4);
        uint256[] memory ids = new uint256[](4);

        accounts[0] = student1;
        accounts[1] = student1;
        accounts[2] = student2;
        accounts[3] = student2;

        ids[0] = tokenId1;
        ids[1] = tokenId2;
        ids[2] = tokenId1;
        ids[3] = tokenId2;

        uint256[] memory balances = courseBadge.balanceOfBatch(accounts, ids);

        assertEq(balances[0], 1);
        assertEq(balances[1], 0);
        assertEq(balances[2], 0);
        assertEq(balances[3], 1);

        vm.stopPrank();
    }

    function testTokenInfoEdgeCases() public view {
        (
            string memory name,
            string memory category,
            uint256 maxSupply,
            bool isTransferable,
            uint256 validUntil,
            address issuer
        ) = courseBadge.tokenInfo(9999);

        assertEq(bytes(name).length, 0);
        assertEq(bytes(category).length, 0);
        assertEq(maxSupply, 0);
        assertFalse(isTransferable);
        assertEq(validUntil, 0);
        assertEq(issuer, address(0));
    }

    function testUriNonExistentToken() public view {
        string memory tokenUri = courseBadge.uri(9999);
        assertEq(bytes(tokenUri).length, 0);
    }

    function testRoleManagement() public {
        address newMinter = address(0x999);

        vm.startPrank(admin);

        courseBadge.grantRole(courseBadge.MINTER_ROLE(), newMinter);
        assertTrue(courseBadge.hasRole(courseBadge.MINTER_ROLE(), newMinter));

        courseBadge.revokeRole(courseBadge.MINTER_ROLE(), newMinter);
        assertFalse(courseBadge.hasRole(courseBadge.MINTER_ROLE(), newMinter));

        vm.stopPrank();
    }
}
