# LINE member notifications

## Problem Statement

Members currently receive no dependable LINE communication when they reserve a class, consume a class entitlement, approach the class start time, cancel a reservation, or experience a material class change. The existing LIFF login also accepts a client-supplied LINE user ID without server verification, and reservation updates are split across independent database writes. Adding push messages directly to those controllers would risk addressing the wrong LINE identity, sending duplicate or misleading messages, losing reminders during Render restarts, and coupling a valid reservation to a third-party messaging failure.

## Solution

Provide verified, reversible LINE account linking for members and a durable transactional notification system. Reservation lifecycle changes and notification jobs commit atomically in MongoDB. A dedicated Render Background Worker sends versioned Thai Flex Messages through LINE, applies quota and quiet-hour policies, retries transient failures idempotently, and exposes operational state to SuperAdmins. Members receive one combined confirmation message after a reservation commits, one optional reminder before the class, and immediate messages for cancellation or material class changes.

## User Stories

1. As a member, I want to connect my existing membership to my verified LINE identity, so that messages cannot be sent to an identity supplied by an untrusted browser.
2. As a member, I want the system to explain that I must add the Official Account as a friend, so that I understand when LINE notifications are ready.
3. As a member, I want to see whether my membership is LINE-linked and LINE-ready, so that I can correct an incomplete setup.
4. As a member, I want to disconnect LINE at any time, so that I retain control of the connection.
5. As a member, I want one LINE identity linked to at most one membership, so that reservations and class entitlements are not exposed across accounts.
6. As an administrator, I want ambiguous existing LINE and email memberships reported for review, so that the system never merges people based only on mutable names or email guesses.
7. As a member, I want a single confirmation after a reservation commits, so that I know the reservation succeeded without receiving several messages.
8. As a member, I want the confirmation to show the class name, Bangkok-local date and time, instructor, attendance location or mode, and reservation reference, so that I can prepare to attend.
9. As a member, I want the same confirmation to state that one class entitlement was consumed and show the committed remaining balance, so that I understand the effect of the reservation.
10. As a member, I want an administrator-created reservation to notify me in the same way as a self-created reservation, so that I am not surprised by a booking made on my behalf.
11. As a member, I want to enable or disable reminders without disconnecting LINE, so that I can control optional interruptions while retaining important updates.
12. As a member with reminders enabled, I want one reminder 24 hours before a reserved class, so that I have time to prepare.
13. As a member who reserves less than 24 hours before a class, I want the confirmation to be sufficient, so that I do not immediately receive a redundant reminder.
14. As a member, I want reminders due during 22:00–07:00 quiet hours moved to 21:30 before the quiet period, so that optional messages do not disturb me overnight.
15. As a member, I want transactional notifications sent immediately even during quiet hours, so that cancellations and material changes are not hidden until too late.
16. As a member, I want a pending reminder cancelled when I cancel my reservation, so that I am not reminded about a class I will not attend.
17. As a member, I want a cancellation message to show whether a class entitlement was restored and the committed remaining balance, so that I can verify the outcome.
18. As a member, I want a material class change message to show old and new attendance information, so that I can understand exactly what changed.
19. As a member, I want several fields changed in one class update combined into one message, so that I am not flooded with separate notifications.
20. As a member, I want a class cancellation to retain history, cancel my reservation, restore the eligible class entitlement, and notify me, so that my balance and records remain understandable.
21. As an administrator, I want classes with active reservations to be cancelled rather than hard-deleted, so that affected members and entitlements are handled safely.
22. As an administrator, I want classes that never had reservations to remain eligible for permanent deletion, so that unused schedule data can still be cleaned up.
23. As a member, I want reservations to remain successful when LINE is unavailable, so that messaging failures do not cost me a valid place in class.
24. As a member who is not LINE-ready, I want the web application to continue showing my reservation and connection status, so that I can still use the service without an SMS or email fallback.
25. As a SuperAdmin, I want to configure reminder offset, quiet hours, and reserved LINE quota with validation, so that operational policy can change without deployment.
26. As a SuperAdmin, I want notification-setting changes audited, so that unexpected delivery behavior can be traced.
27. As a SuperAdmin, I want to preview the versioned LINE templates without editing their structure, so that content can be reviewed without creating invalid Flex Messages.
28. As a SuperAdmin, I want to filter notification jobs by status and event, so that pending, accepted, retrying, failed, and suppressed work is visible.
29. As a SuperAdmin, I want accepted requests described as accepted rather than delivered, so that the UI does not claim knowledge LINE does not provide.
30. As a SuperAdmin, I want failed notifications to expose safe diagnostic metadata and allow an eligible manual retry, so that transient incidents can be recovered without exposing secrets.
31. As an operator, I want important transactional notifications protected by a 20% quota reserve, so that optional reminders cannot exhaust the monthly allowance.
32. As an operator, I want quota values read from LINE rather than hard-coded from a commercial plan, so that plan changes do not silently break policy.
33. As an operator, I want notification state stored in MongoDB, so that Render sleep, restart, deploy, or process replacement cannot lose scheduled work.
34. As an operator, I want worker leases and LINE retry keys to prevent duplicate execution, so that crashes between LINE acceptance and database persistence do not create duplicate messages.
35. As an operator, I want transient failures retried at most five times within 24 hours and permanent failures surfaced, so that recovery is bounded and observable.
36. As an operator, I want webhook signatures verified against the exact raw request body and redeliveries deduplicated, so that forged or duplicate LINE events cannot mutate member state.
37. As an operator, I want production to use the real LINE adapter while development and tests use a fake adapter, so that non-production work consumes no quota and disturbs no members.
38. As an operator, I want existing future reservations to receive eligible reminders after rollout without retroactive confirmations or entitlement messages, so that deployment does not create a message burst.
39. As an operator, I want notification metadata retained for 90 days without tokens or unnecessary sensitive payloads, so that incidents can be investigated with bounded data exposure.

## Implementation Decisions

- Use the project's canonical terms from the domain glossary: Member, Class, Reservation, Class entitlement, LINE-linked member, LINE-ready member, Transactional notification, Reminder, Material class change, Class cancellation, Notification acceptance, and Notification settings.
- Treat a verified provider-scoped LINE user ID as a dedicated immutable identity attribute; do not overload username or use display name as identity.
- Replace client-profile trust with server verification of a raw LIFF ID token or access token. Verify the expected channel identity and use the verified subject before issuing an application session.
- Require the LINE Login/LIFF channel and Messaging API channel to live under the same LINE provider for the preferred flow. Treat confirmation of provider placement and add-friend configuration as a production prerequisite because channel placement cannot be moved later.
- Support linking for existing email memberships, explicit unlinking, uniqueness conflicts, consent/preference versioning, and follow/unfollow state. Never merge memberships automatically from display name or email similarity.
- Mount the LINE webhook so it can verify HMAC-SHA256 against the exact raw body before general JSON parsing. Acknowledge valid events quickly, process asynchronously, and deduplicate by webhook event ID.
- Introduce a deep reservation-lifecycle module used by self-service and administrator routes. Reservation creation, class-entitlement changes, attendance changes, class cancellation, and notification outbox writes belong to one atomic MongoDB transaction.
- Require a transaction-capable MongoDB replica set before production rollout. Startup or readiness diagnostics must make an unsupported deployment visible rather than silently using a non-atomic path.
- Do not call LINE inside a database transaction or request-critical reservation path. The HTTP result reports the committed reservation outcome; notification delivery proceeds independently.
- Introduce a durable MongoDB notification job/outbox model with event type, member/reservation/class references, class revision, due time in UTC, display timezone, template version, stable retry key, status, attempts, next attempt, lease owner/expiry, LINE request ID, safe diagnostics, and retention timestamps.
- Enforce a uniqueness rule across event type, reservation, class revision, and reminder offset so repeated requests and worker restarts cannot create duplicate logical messages.
- Model job states as pending, leased, accepted, retrying, failed, and suppressed. Notification acceptance means LINE accepted the request; it never means delivered or read.
- Run a dedicated paid Render Background Worker in Singapore. It atomically claims due jobs from MongoDB, stops claiming on SIGTERM, completes or releases its lease, and shares secrets with the web service without committing them.
- Target queue pickup within 30 seconds for transactional events and a ±1 minute processing window for reminders. These are application processing objectives, not end-user delivery guarantees.
- Use one Thai Flex Message per event with useful plain alt text. Booking confirmation combines success, class details, one consumed class entitlement, and the committed remaining balance.
- Exclude reusable passcodes, medical information, tokens, and unnecessary personal data from notification previews and logs. Link to an authenticated details page for sensitive attendance data.
- Reminder defaults are enabled after explicit LINE connection/notification confirmation, one reminder at a 24-hour offset, no retroactive reminder when the reservation is created inside that offset, and quiet hours from 22:00 to 07:00 with affected reminders moved to 21:30 before the quiet period.
- Transactional confirmation, cancellation, and material-change messages bypass quiet hours. Multiple material fields changed in one class update produce one old-to-new notification.
- A Class with reservation history is cancelled and retained. Its active Reservations are cancelled, eligible class entitlements are restored, pending reminders are suppressed, and one cancellation notification per affected member is enqueued atomically. Only Classes without reservation history may be permanently deleted.
- On rollout, enqueue reminders for existing active future Reservations that still satisfy the timing rules. Do not send historical confirmation, deduction, cancellation, or change messages.
- Read LINE monthly quota and approximate consumption through official endpoints. Maintain application counts, reserve 20% for transactional events, and suppress optional reminders at the reserve threshold before suppressing transactional work.
- Send each first LINE attempt with a persisted retry key. Treat 2xx and duplicate-key 409 as accepted; retry identical payloads for timeouts and 5xx with exponential backoff, up to five attempts within 24 hours. Do not blindly retry other 4xx responses; distinguish rate limiting from exhausted quota.
- Provide authenticated member operations to inspect connection state, connect, disconnect, and update reminder preference. Provide SuperAdmin operations for notification settings, audit history, template preview, job filtering/detail, and eligible manual retry.
- Keep versioned templates in code and validate them against LINE during development/CI. The initial administration interface previews but does not edit template structure.
- Use a real LINE adapter only in production. Development and automated tests use a fake adapter that records requests deterministically.
- Keep safe notification metadata for 90 days and remove expired jobs/payload details through a scheduled retention task.
- Do not add SMS, email, marketing broadcasts, arbitrary template editing, or proof-of-delivery/read claims.

## Testing Decisions

- Tests assert behavior visible across an interface: committed reservation state and response, queued notification intent, outbound LINE request, job state, member-visible state, and administrator-visible state. They do not assert private helper calls, internal collection ordering, exact log wording, or implementation-specific method names.
- The primary backend seam is the HTTP application with injected in-memory adapters. Exercise verified LINE connection/unlinking, uniqueness conflicts, webhook signature and deduplication, self/admin reservation, cancellation, material changes, class cancellation, settings authorization, preview, job listing, and manual retry through real route behavior.
- The second backend seam is one notification-worker batch with a controlled clock and fake LINE adapter. Exercise due-time and quiet-hour calculations, existing-reservation rollout, atomic leases, duplicate suppression, quota reserve, payload content/privacy, 2xx/409 acceptance, 4xx suppression/failure, 429 classification, 5xx/timeout retry, five-attempt exhaustion, 24-hour retry-key expiry, crash/reclaim behavior, and SIGTERM draining.
- The frontend seam is a rendered page journey with HTTP calls mocked at the service boundary. Exercise member connection state and unlink confirmation, reminder preference, incomplete friendship guidance, SuperAdmin settings validation/audit display, template preview, filtering, accepted-language semantics, and retry controls.
- Add MongoDB repository contract/integration tests against a replica-set-capable test database. Prove atomic commit and rollback for reservation/class-entitlement/attendance/outbox changes, unique logical-event enforcement, atomic job claim, expired lease recovery, and cancellation fan-out.
- Preserve and adapt prior art from the existing Node test runner controller fixtures and `app.handle()` route tests, but replace tests that reach past the new deep-module interfaces.
- Validate production Flex payloads using LINE's validation endpoint in a non-member CI/setup check; normal test runs use the fake adapter and do not consume message quota.
- Run focused backend and frontend tests during each red-green slice, backend and frontend lint/build checks regularly, and both complete test suites before review.

## Out of Scope

- SMS or email fallback notifications.
- Marketing, broadcast, narrowcast, or promotional campaigns.
- Multiple LINE identities connected to one membership or one LINE identity shared across memberships.
- Automatic membership merging based on name, display name, email similarity, or other heuristics.
- Arbitrary administrator editing of Flex Message JSON or message copy in the first release.
- Sending historical confirmations or class-entitlement messages for existing reservations.
- Changing the existing member-cancellation eligibility policy beyond reporting the committed result; class-wide cancellation behavior is explicitly included.
- Claiming that LINE accepted requests were delivered, displayed, or read.
- Storing LINE credentials, LIFF tokens, reusable access details, medical information, or unnecessary personal data in notification logs.
- Provisioning paid Render resources or changing LINE Console settings automatically; those human-controlled production steps are release prerequisites.

## Further Notes

- Research is recorded in `docs/research/line-messaging-api-class-notifications.md` and `docs/research/render-scheduled-notification-worker.md`.
- The architectural decision is recorded in ADR-0001: use a durable MongoDB outbox and dedicated Render Background Worker, with notification enqueueing inside the reservation transaction and LINE delivery after commit.
- Current LINE login is unsafe for notification addressing because it trusts a browser-supplied profile. Secure token verification is the first implementation dependency.
- Current reservation creation and cancellation use separate document saves, and current class deletion does not resolve active reservations. The reservation-lifecycle module must become the single interface for these behaviors before notifications are attached.
- Thailand plan prices and included message counts can change. Runtime quota endpoints and configurable policy are authoritative; commercial numbers must not be hard-coded.
- Production readiness requires verification that LINE channels share a provider, add-friend behavior is configured, webhook redelivery is enabled, MongoDB supports transactions, Render secrets are present, and the worker plan is explicitly approved in the Render Dashboard.
