# Frontend: Client-Side Implementation

High-performance Web3 interface utilizing Next.js 15 (App Router) and Ethers.js v6.

## Architecture

### 1. Provider Strategy
- **Primary**: `BrowserProvider` (window.ethereum) for state-mutating transactions.
- **Fallback**: `JsonRpcProvider` for read-only operations when no wallet is connected.
- **State Management**: React Context API (`Web3Context`) maintains a singleton instance of the signer and provider to prevent redundant RPC calls.

### 2. Contract Interaction Layer
Located in `src/lib/contracts/`:
- **Type-Safety**: Direct mapping of Foundry-generated ABIs to TypeScript interfaces.
- **Gas Estimation**: Explicit `estimateGas` calls before transaction dispatch to prevent "Out of Gas" failures.
- **Event Listeners**: WebSocket-based listeners for `ProposalCreated` and `VoteCast` events to enable real-time UI updates.

### 3. App Router Structure
- `/app/proposals`: Server-side fetching of proposal metadata with client-side hydration of real-time voting counts.
- `/app/create`: Multi-step form for calldata generation (target address, value, signature, data).
- `/app/dashboard`: Aggregation of on-chain balances (`ERC20Votes.balanceOf`) and off-chain user profiles.

## Environment Configuration
```bash
NEXT_PUBLIC_GOVERNANCE_TOKEN_ADDRESS=0x...
NEXT_PUBLIC_GOVERNOR_ADDRESS=0x...
NEXT_PUBLIC_TIMELOCK_ADDRESS=0x...
NEXT_PUBLIC_BACKEND_URL=http://localhost:4000
```

## Build Pipeline
- **Bundler**: Turbopack (dev) / Webpack (prod).
- **Styling**: Tailwind CSS v4 JIT engine.
- **Validation**: Zod for form schemas and API response validation.

## Performance Invariants
- Minimal usage of `useEffect` for chain-state syncing.
- Heavy utilization of `Server Components` for initial data rendering.
- Code-splitting on heavy libraries like `ethers`.
