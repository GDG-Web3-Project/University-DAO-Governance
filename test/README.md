# Test Suite: Validation & Invariants

Foundry-based testing framework for validating EVM state transitions and governance invariants.

## Test Types

### 1. Unit Tests
- **Focus**: Individual contract functions in isolation.
- **Tools**: `forge test --match-path test/unit/*.t.sol`.
- **Key Coverage**:
    - Voting power delegation logic.
    - Quorum calculation edge cases.
    - Proposal state machine transitions.

### 2. Integration Tests
- **Focus**: End-to-end governance lifecycle.
- **Workflow**: `propose` -> `warp` (voting delay) -> `vote` -> `roll` (voting period) -> `queue` -> `warp` (min delay) -> `execute`.
- **Cheatcodes**: Extensive use of `vm.warp` and `vm.roll` to simulate time-locked logic without real-time delays.

### 3. Fuzzing
- **Engine**: Foundry In-built fuzzer.
- **Targets**: 
    - Voting power math (ensuring no overflow/underflow).
    - Quorum fractions under varying total supply scenarios.

## Execution Matrix
```bash
# Standard test run
forge test -vv

# Gas profiling
forge test --gas-report

# Coverage analysis
forge coverage --report lcov
```

## Critical Invariants Tested
- **Invariant A**: The Timelock's balance can only be reduced via a `passed` and `executed` proposal.
- **Invariant B**: No address can vote twice on the same `proposalId` within the same `votingPeriod`.
- **Invariant C**: `votingDelay` must strictly enforce a "cooling-off" period to prevent block-stuffing.
