# Security Specification - Matchday Organizer

## Data Invariants
1. A player must have a unique ID, name, number, and valid skill/speed (1-10).
2. A match must have a date, location, and two teams (teamA, teamB).
3. A match result can only be added when the match status is 'completed'.
4. Matches and Players are publicly readable but writes require authentication.

## The "Dirty Dozen" Payloads (Deny List)
1. Creating a player with skill 11.
2. Creating a player without a name.
3. Updating a player's ID.
4. Anonymous user creating a player.
5. Creating a match with an invalid status (e.g., 'not_started').
6. Updating a completed match's team players (match locking).
7. Creating a player with a huge name (e.g., 500 characters).
8. Injecting a ghost field `isAdmin: true` into a player document.
9. Deleting a match without being authenticated.
10. Creating a match with non-ISO date string.
11. Updating `teamAGoals` on a 'scheduled' match.
12. Attempting to update `createdAt` (if we had it, but we use match properties).

## Test Runner
I will verify these in the rules logic.
