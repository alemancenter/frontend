# Blocked IPs Frontend Fix

## Scope
Updated `/dashboard/security/blocked-ips` to match the backend contract.

## Frontend changes
- Uses `reason` instead of the wrong `description` field.
- Uses `is_active`, `is_expired`, and `status` instead of `is_resolved`.
- Sends `search`, `status`, `page`, and `per_page` correctly.
- Displays expiration date and permanent blocks.
- Sends `days` when creating a temporary block.
- Keeps unblock action compatible with IP or ID.
- Adds user-facing error message on failed list load.
