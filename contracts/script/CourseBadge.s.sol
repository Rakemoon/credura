
// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Script, console} from "forge-std/Script.sol";
import {CourseBadge} from "../src/CourseBadge.sol";

contract CourseBadgeScript is Script {
    CourseBadge public cb;

    function setUp() public {}

    function run() public {
        vm.startBroadcast();
        cb = new CourseBadge();
        vm.stopBroadcast();
    }
}
