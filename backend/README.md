# Backend: Indexing & Metadata API

A Node.js/Express service providing a low-latency cache and metadata layer for the DAO ecosystem.

## Technical Stack
- **Runtime**: Node.js v20+.
- **Framework**: Express.js (ESM).
- **Persistence**: MongoDB via Mongoose.
- **Authentication**: JWT + Wallet Signature verification.

## Data Models (Mongoose)

### ClassElection.js
- **Fields**:
    - `contractElectionId`: Reference to on-chain ID.
    - `invitedWallets`: Array of normalized (lowercase) Ethereum addresses.
    - `txHash`: Transaction reference for auditability.
    - `startAt/endAt`: ISO Date objects mirrored from block timestamps.

### User.js
- **Fields**:
    - `walletAddress`: Primary key (unique, indexed).
    - `role`: Permission level (Student, Faculty, Admin).

## Middleware Chain
1. `cors`: Restricts access to `FRONTEND_ORIGIN`.
2. `express.json`: Parser for RPC-style JSON payloads.
3. `authMiddleware`:
    - Validates `x-auth-token` header.
    - Decodes JWT to populate `req.user`.
    - Verifies wallet address ownership if required for specific mutations.

## Sync Logic
The backend does NOT actively poll the chain. It relies on the "Optimistic Sync" pattern:
1. Frontend executes TX.
2. Frontend waits for 1 confirmation.
3. Frontend POSTs metadata to `/api/class-elections` or `/api/proposals`.
4. Backend validates `txHash` (optional) and persists metadata.
