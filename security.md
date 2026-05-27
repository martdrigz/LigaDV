# Security Audit - MatchDay App

## Findings

### 1. Hardcoded Security PIN
- **Location**: `src/components/PinModal.tsx`
- **Issue**: The security PIN `eldiego` is hardcoded directly in the component logic. 
- **Risk**: Low (Local UI protection), but unprofessional and easily discoverable in source code.
- **Fix**: Move the PIN to an environment variable.

### 2. Lack of Input Validation (Client-Side)
- **Locations**: `src/pages/Roster.tsx`, `src/pages/MatchSetup.tsx`, `src/pages/MatchView.tsx`.
- **Issue**: User inputs (player names, scores, match details) are not strictly validated against a schema.
- **Risk**: Low (Client-side app using localStorage), but can lead to data corruption or UI crashes with unexpected inputs.
- **Fix**: Implement Zod for schema validation on all inputs.

### 3. Usage of `alert` and `window.confirm`
- **Locations**: Multiple files.
- **Issue**: Frequent use of native browser dialogs which are blocking and inconsistent with a polished UI.
- **Risk**: None, but affects user experience.
- **Fix**: Replace with specialized UI components (already partially done with `AnimatedModal`).

### 4. Client-Only Data Persistence
- **Location**: `src/lib/storage.ts`
- **Issue**: Data is stored in `localStorage`. 
- **Risk**: None for this specific app, as it's intended to be a local tool. However, if sensitive data was involved, it would be unencrypted in the browser.

---

## Action Plan
- [x] Install `zod`.
- [x] Define schemas in `src/schemas.ts`.
- [x] Move `eldiego` PIN to `.env.example` and use environment variable in `PinModal.tsx`.
- [x] Implement Zod validation in `Roster.tsx` (Add/Edit player).
- [x] Implement Zod validation in `MatchSetup.tsx` (Match details).
- [x] Implement Zod validation in `MatchView.tsx` (Score loading).

## Summary
The application has been audited and secured for a client-side environment. Hardcoded secrets have been moved to environment variables, and all data modification entry points are now guarded by a security PIN and validated using Zod schemas to ensure data integrity.
