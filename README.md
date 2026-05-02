# University DAO Governance: System Specification

A hybrid on-chain governance protocol and off-chain indexing engine designed for academic environments.

## Core Architecture

### 1. On-Chain State Machine (EVM)
The protocol utilizes a modular governor stack inherited from OpenZeppelin v5.x.

#### GovernanceToken.sol
- **Standard**: ERC20 + ERC20Votes + ERC20Permit.
- **Checkpointing**: Uses `_burn`, `_mint`, and `_transferVotingUnits` to maintain a historical snapshot of voting power.
- **Complexity**: O(1) for balance checks, O(log n) for historical voting power lookups via binary search over checkpoints.

#### GovernorContract.sol
- **Inheritance**: Governor, GovernorSettings, GovernorCountingSimple, GovernorVotes, GovernorVotesQuorumFraction, GovernorTimelockControl.
- **Parameters**:
    - `votingDelay`: 1 block. Ensures state consistency before voting begins.
    - `votingPeriod`: 50,400 blocks (fixed).
    - `quorum`: 4% (dynamic based on total supply at snapshot).
    - `proposalThreshold`: 0.
- **State Transitions**: `Pending` -> `Active` -> `Defeated/Succeeded` -> `Queued` -> `Expired/Executed`.

#### Timelock.sol
- **Mechanism**: `TimelockController`.
- **Min Delay**: 172,800 seconds (2 days).
- **Role Map**:
    - `PROPOSER_ROLE`: Restricted to GovernorContract.
    - `EXECUTOR_ROLE`: `address(0)` (unrestricted execution of queued, mature proposals).
    - `CANCELLER_ROLE`: Restricted to GovernorContract.

#### ClassElection.sol
- **Logic**: Off-governor election primitive.
- **Data Structure**: `mapping(uint256 => Election)` storing `startTime`, `endTime`, and `descriptionHash`.
- **Access Control**: `mapping(uint256 => mapping(address => bool))` for granular whitelisting of voters per election ID.

### 2. Off-Chain Indexing & Metadata (Node.js/Express)
Handles ephemeral data and provides a queryable interface for the frontend.
- **Database**: MongoDB.
- **Sync Pattern**: Frontend-driven event logging. Upon successful TX broadcast, the frontend pushes metadata to the backend for indexing.
- **Authentication**: EIP-4361 (Sign-In with Ethereum) compatible flow.

### 3. Frontend Implementation (Next.js 15)
- **Engine**: React 19 + TypeScript.
- **State management**: Context API for wallet and chain state.
- **Provider**: Ethers.js v6 via JSON-RPC.
- **Performance**: Static generation for landing pages with dynamic client-side fetching for proposal status.

---

## Environment Configuration

### Smart Contracts
```bash
forge install
forge build
forge test --gas-report
```

### Backend API
```bash
cd backend
npm install
# Required: MONGODB_URI, JWT_SECRET, PORT
npm start
```

### Client Application
```bash
cd frontend
npm install
npm run dev
```

---

## Security and Invariants

### Access Control Invariants
- `Timelock` MUST be the owner of all governed assets/contracts.
- `GovernorContract` MUST be the only address with `PROPOSER_ROLE` on the `Timelock`.
- `ClassElection` admin role should be transferred to `Timelock` post-deployment for fully decentralized control.

### Voting Integrity
- Snapshots are triggered at `proposalSnapshot`, preventing double-voting or flash-loan manipulation.
- `quorum` is checked at the end of the `votingPeriod`.

---

## Deployment Logic

1. Deploy `GovernanceToken`.
2. Deploy `Timelock` with `minDelay`.
3. Deploy `GovernorContract` linked to (1) and (2).
4. Assign `PROPOSER_ROLE` and `CANCELLER_ROLE` to (3) on (2).
5. Assign `EXECUTOR_ROLE` to `address(0)` on (2).
6. Renounce `TIMELOCK_ADMIN_ROLE` from deployer.

---

## Deployment Verification

The smart contracts have been successfully compiled, optimized, and deployed to the **Base Sepolia** testnet. 

**Terminal Output Trace:**
```text
ONCHAIN EXECUTION COMPLETE & SUCCESSFUL.

Transactions saved to: .../broadcast/Deploy.s.sol/84532/run-latest.json
Sensitive values saved to: .../cache/Deploy.s.sol/84532/run-latest.json
```

*(If you have a literal image screenshot of your terminal, you can replace this line with `![Terminal Screenshot](./terminal-screenshot.png)` after saving the image to the repository).*
