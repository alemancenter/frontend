# Frontend Enterprise Repair Implementation

## Implemented

- Cached `/auth/user` calls for 5 minutes in memory.
- Added singleflight behavior for current-user refresh.
- Throttled dashboard user refresh to avoid duplicate hydration calls.
- Kept in-flight GET request deduplication in the API client.
- Kept in-flight AI mutation deduplication in the content-audit service.
- Increased AI timeouts to avoid aborting valid long-running generation requests.

## Recommended next frontend step

Add TanStack Query when package installation is allowed. The current implementation avoids adding dependencies to keep the project build-compatible with the existing package.json.
