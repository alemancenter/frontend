# Frontend Email Verification Fix

## What changed

- The verification page now supports secure `token` query parameter.
- `/verify-email/{id}/{token}` redirects to `/verify-email?id={id}&token={token}`.
- Backward query parameter `hash` is still accepted in the UI for transition, but backend expects secure Redis-backed tokens.
- Resend verification continues to use the authenticated session token.

## Expected user flow

1. Register.
2. User is redirected to `/verify-email`.
3. User opens email and clicks `/verify-email/{id}/{token}`.
4. Frontend confirms the email by calling the backend.
5. User is redirected after successful verification.
