// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract ClassElection {
    struct Election {
        bytes32 classId;
        string title;
        string descriptionHash;
        uint64 startTime;
        uint64 endTime;
        address creator;
        bool finalized;
        uint256 forVotes;
        uint256 againstVotes;
    }

    uint256 public nextElectionId;
    mapping(uint256 => Election) public elections;
    mapping(uint256 => mapping(address => bool)) public isInvited;
    mapping(uint256 => mapping(address => bool)) public hasVoted;
    mapping(address => bool) public admins;

    event ClassElectionCreated(uint256 indexed electionId, bytes32 indexed classId, address indexed creator);
    event ClassVoted(uint256 indexed electionId, address indexed voter, bool support);

    modifier onlyAdmin() {
        require(admins[msg.sender], "ClassElection: not admin");
        _;
    }

    constructor(address initialAdmin) {
        admins[initialAdmin] = true;
    }

    function setAdmin(address account, bool allowed) external onlyAdmin {
        admins[account] = allowed;
    }

    function createClassElection(
        bytes32 classId,
        string calldata title,
        string calldata descriptionHash,
        uint64 startTime,
        uint64 endTime,
        address[] calldata invitedWallets
    ) external onlyAdmin returns (uint256 electionId) {
        require(endTime > startTime, "ClassElection: invalid time range");
        require(invitedWallets.length > 0, "ClassElection: empty invite list");
        electionId = nextElectionId++;
        elections[electionId] = Election({
            classId: classId,
            title: title,
            descriptionHash: descriptionHash,
            startTime: startTime,
            endTime: endTime,
            creator: msg.sender,
            finalized: false,
            forVotes: 0,
            againstVotes: 0
        });
        for (uint256 i = 0; i < invitedWallets.length; i++) {
            if (invitedWallets[i] != address(0)) {
                isInvited[electionId][invitedWallets[i]] = true;
            }
        }
        emit ClassElectionCreated(electionId, classId, msg.sender);
    }

    function vote(uint256 electionId, bool support) external {
        Election storage election = elections[electionId];
        require(election.creator != address(0), "ClassElection: invalid election");
        require(block.timestamp >= election.startTime && block.timestamp <= election.endTime, "ClassElection: not active");
        require(isInvited[electionId][msg.sender], "ClassElection: not invited");
        require(!hasVoted[electionId][msg.sender], "ClassElection: already voted");

        hasVoted[electionId][msg.sender] = true;
        if (support) election.forVotes += 1;
        else election.againstVotes += 1;
        emit ClassVoted(electionId, msg.sender, support);
    }

    function getElectionResult(uint256 electionId) external view returns (uint256 forVotes, uint256 againstVotes, bool finalized) {
        Election memory election = elections[electionId];
        require(election.creator != address(0), "ClassElection: invalid election");
        return (election.forVotes, election.againstVotes, election.finalized);
    }
}
