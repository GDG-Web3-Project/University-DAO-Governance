# Smart Contracts: Implementation Details

Core logic for the University DAO Governance protocol. Built with Foundry and OpenZeppelin v5.x.

## Contract Matrix

### GovernanceToken.sol
- **Type**: Utility / Voting Token.
- **Extensions**: `ERC20Votes`, `ERC20Permit`.
- **Logic**: Implements `_update` override to intercept all transfers and trigger `_transferVotingUnits`. This ensures voting power is updated in real-time within the `checkpoints` mapping.
- **Permit**: EIP-712 based gasless approvals for improved UX.

### GovernorContract.sol
- **Type**: Decision Engine.
- **Logic**:
    - `quorumFraction`: 4. Multiplied by `token.getPastTotalSupply(blockNumber)` to calculate dynamic quorum.
    - `votingDelay`: 1 block. Prevents "same-block" governance manipulation.
    - `votingPeriod`: 50,400 blocks. Fixed duration for vote casting.
- **State Overrides**: Explicitly overrides `state`, `proposalNeedsQueuing`, and `_executor` to integrate with `TimelockController`.

### Timelock.sol
- **Type**: Controller / Treasury.
- **Mechanism**: Enforces a `minDelay` between proposal queueing and execution.
- **Security**: The contract is the ultimate `owner` of the system. Proposer and Executor roles are strictly separated.

### ClassElection.sol
- **Type**: Permissioned Voting primitive.
- **Storage Layout**:
    - `elections`: Mapping of `uint256 => Election` struct (packed for gas efficiency: `uint64` for timestamps).
    - `isInvited`: Nested mapping `electionId => voter => bool` for whitelist enforcement.
- **Interaction**: Independent of the main Governor but intended to be owned by the Timelock.

## Compilation & Optimization
- **Compiler**: Solidity ^0.8.20.
- **Optimizer**: 200 runs.
- **EVM Version**: Paris / Shanghai (compatible with Base Sepolia).
