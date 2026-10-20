# Admin review of legacy LINE memberships

The Users page provides a LINE accounts tab for Admin and SuperAdmin. It lists active Member accounts whose username is a legacy LINE user ID. Operators search by member name, code, email or phone and inspect the original member ID, LINE ID, and contact details before approving. Email/password accounts are eligible only through this explicit review flow; automatic migration rules remain unchanged.

- `GET /api/auth/line/legacy-members?status=pending|linked&page=1&search=...`: authenticated Admin/SuperAdmin only; 20 records per page, total count, projected member/contact fields and review history. No passwords or reset tokens.
- `POST /api/auth/line/legacy-members/:memberId/approve`: same roles; body `{ expectedLineUserId, confirmed: true, note }`. Note must be 5–500 trimmed characters describing the ownership check; never include passwords or OTPs. Member ID must be a Mongo ObjectId.
- Approve only an active Member with a well-formed legacy LINE username matching the displayed expectedLineUserId. Reject duplicate usernames or identities already linked to another member (409). Never merge or create members, and never accept an arbitrary replacement LINE ID.
- Atomically set line_user_id and append review actor, timestamp, note and LINE ID on the same member. Preserve purchases, reservations, credits and credentials. Repeated approval of the same linkage succeeds without another audit entry. Reject stale state (409).
- 400 invalid review input; 403 unauthorized role; 404 missing member; 422 ineligible/deleted membership; 409 identity or stale-state conflict. Existing LINE login resumes against the same member ID after approval.
