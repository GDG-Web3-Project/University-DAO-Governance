// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/ClassElection.sol";

contract ClassElectionTest is Test {
    ClassElection election;
    address admin = address(1);
    address voterA = address(2);
    address voterB = address(3);
    address outsider = address(4);

    function setUp() public {
        vm.prank(admin);
        election = new ClassElection(admin);
    }

    function testInvitedCanVoteAndPublicCanReadResults() public {
        address[] memory invited = new address[](2);
        invited[0] = voterA;
        invited[1] = voterB;
        vm.prank(admin);
        uint256 electionId = election.createClassElection(
            keccak256("CLASS-CSE"),
            "Class Rep",
            "ipfs://desc",
            uint64(block.timestamp + 1),
            uint64(block.timestamp + 1 days),
            invited
        );
        vm.warp(block.timestamp + 2);
        vm.prank(voterA);
        election.vote(electionId, true);
        vm.prank(voterB);
        election.vote(electionId, false);
        vm.prank(outsider);
        (uint256 forVotes, uint256 againstVotes,) = election.getElectionResult(electionId);
        assertEq(forVotes, 1);
        assertEq(againstVotes, 1);
    }
}
