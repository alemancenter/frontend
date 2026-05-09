# Redis Dashboard TTL UI Fix

Implemented fixes:

- The Redis page now displays real TTL labels returned by the backend.
- Added TTL filter: all / persistent / expiring.
- Added key type and memory usage columns.
- Added per-key TTL assignment button for persistent keys.
- Added button to expire old Laravel IP location keys.
- Added button to clean old Laravel IP location keys.
- New key modal defaults TTL to 3600 seconds.
- Persistent key creation requires explicit checkbox.
