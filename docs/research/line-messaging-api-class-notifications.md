# LINE Official Account + Messaging API research for class notifications

Research date: 2026-09-12 (Asia/Bangkok)

Scope: official LINE sources only. This note focuses on member identity/linking, consent, transactional push messages, quota, webhook security, scheduling, retry behavior, and message formats for booking-related notifications.

## Executive summary

The recommended integration is to keep the existing LINE Login/LIFF experience, but authenticate it correctly on the server and ensure that its LINE Login channel and the new Messaging API channel are under the same LINE provider. Under the same provider, the same person receives the same LINE user ID across those channel types; under different providers, the IDs differ. The server can then store the verified LINE user ID on the member and use one-to-one push messages. If the channels cannot share a provider, or if a non-LINE-login member must link later, use Messaging API account linking rather than inventing a custom link flow. ([Provider design basics](https://developers.line.biz/en/tips/2026/06/25/provider-design-basics/), [User account linking](https://developers.line.biz/en/docs/messaging-api/linking-accounts/))

For this product, booking confirmation, session deduction, and remaining balance should normally be combined into one push request/message. LINE counts recipients, not message objects: up to five message objects can be included in one request without increasing the count for a single recipient. Reminders and subsequent cancellation/change events are separate pushes. ([Send messages](https://developers.line.biz/en/docs/messaging-api/sending-messages), [Messaging API pricing](https://developers.line.biz/en/docs/messaging-api/pricing/))

The Messaging API push endpoint accepts an immediate send and has no scheduling timestamp in its request schema. Therefore, per-reservation reminders and rescheduling must be owned by this application using durable jobs/outbox records. This is an inference from the official push request schema, not an explicit LINE statement. LINE Official Account Manager has business scheduling features, but it is not a transactional per-reservation scheduling API. ([Send push message reference](https://developers.line.biz/en/reference/messaging-api/#send-push-message), [LINE Official Account Thailand features](https://lineforbusiness.com/th/service/line-oa-features))

## 1. Identity, friendship, linking, and consent

### Preferred path for this repository: verified LIFF token + same provider

The repository already initializes LIFF in `front-end/src/pages/Line.jsx` and posts the result of `liff.getProfile()` to `POST /api/auth/line`. The backend currently treats the client-supplied `userId` as identity. LINE explicitly says not to send profile details from `liff.getProfile()` or `liff.getDecodedIDToken()` to a server as proof of identity because browser data can be tampered with. Send the raw token instead:

1. Frontend obtains `liff.getIDToken()` (or `liff.getAccessToken()`) and sends only that credential over HTTPS.
2. Backend verifies the ID token with `POST https://api.line.me/oauth2/v2.1/verify`, supplying the expected LINE Login channel ID; use verified `sub` as the LINE user ID. Alternatively verify the access token, check `client_id` and positive `expires_in`, then fetch `/v2/profile` from LINE.
3. Backend issues its own application session/JWT after verification; do not use a LINE token as the application's long-lived session or log the token.

This is a prerequisite security fix for safely addressing member notifications. ([Using user data in LIFF apps and servers](https://developers.line.biz/en/docs/liff/using-user-profile/), [Send tokens, not profile data](https://developers.line.biz/en/tips/2026/08/13/send-token-to-server/), [Verify ID token reference](https://developers.line.biz/en/reference/line-login/#verify-id-token))

Create the LINE Login/LIFF channel and Messaging API channel under the same provider. LINE user IDs are provider-scoped: they match across channel types under one provider and differ across providers. Provider/channel placement cannot be changed later, so verify this in LINE Developers Console before implementation. The add-friend option for LINE Login also requires the LINE Login and Messaging API channels to be under the same provider. ([Provider design basics](https://developers.line.biz/en/tips/2026/06/25/provider-design-basics/))

Store the verified provider-scoped identifier in a dedicated immutable member field such as `line_user_id`; do not overload the existing `username`. Also store application-owned state such as `line_linked_at`, notification preference/consent version, and last observed follow/unfollow state. Display name is mutable and must not be used as identity. ([Managing LINE Login users](https://developers.line.biz/en/docs/line-login/managing-users/))

### Friendship is required for dependable push notifications

One-to-one push messages may be sent to:

- users who added the LINE Official Account as a friend; or
- users who sent the Official Account a one-to-one message within the last seven days, even if not a friend.

For blocked/deleted/non-friend recipients outside that exception, LINE can still return HTTP `200` while the user receives nothing. A successful API response is therefore acceptance, not proof of delivery. The onboarding/linking UI should require or clearly verify friendship, and the webhook should consume `follow` and `unfollow` events. ([Send push message reference](https://developers.line.biz/en/reference/messaging-api/#send-push-message), [Receive webhooks](https://developers.line.biz/en/docs/messaging-api/receiving-messages/))

If LINE Login is used, request only the necessary `openid`/`profile` scopes and use the LINE Login add-friend option or friendship-status endpoint where appropriate. Users authorize requested scopes on LINE's consent screen and may revoke consent. ([Integrating LINE Login](https://developers.line.biz/en/docs/line-login/integrate-line-login/), [Managing authorized apps](https://developers.line.biz/en/docs/line-login/managing-authorized-apps/))

### Alternative path: Messaging API account linking

For members who have an existing site account but cannot be reliably matched through the same-provider LINE Login channel, use LINE's account-linking mechanism:

1. Obtain the LINE user ID from a webhook interaction.
2. Issue a link token using `POST /v2/bot/user/{userId}/linkToken`.
3. Send a linking URL to the user.
4. Authenticate the member on the service's own login page.
5. Generate a cryptographically random, single-use nonce, associate it with the member account server-side, and redirect to LINE's account-linking endpoint.
6. On a successful `accountLink` webhook, resolve the nonce and persist the LINE user ID/member association.

The link token is one-time use and nominally valid for 10 minutes. The nonce must be 10–255 characters, unpredictable, and single-use; LINE recommends at least 128 random bits. LINE warns that home-grown account linking can expose users to account-linking attacks. ([User account linking](https://developers.line.biz/en/docs/messaging-api/linking-accounts/))

LINE requires a linked user to be able to unlink at all times, and the user must be told at linking time that unlinking is available. The application should separately present clear booking-notification preferences (including reminder timing) and honor opt-out/unlink immediately. ([User account linking — Unlinking accounts](https://developers.line.biz/en/docs/messaging-api/linking-accounts/#unlinking-accounts))

## 2. Push behavior and quota

Use `POST /v2/bot/message/push` for each member-specific transactional notification. LINE recommends push for a single recipient and describes it as suitable for low latency. Its current documented rate limit is 2,000 requests/second per channel. A request accepts at most five message objects. ([Send push message reference](https://developers.line.biz/en/reference/messaging-api/#send-push-message), [2025 multicast rate-limit notice](https://developers.line.biz/en/news/2025/?article=messaging-api-rate-limit&day=23&month=04))

Quota rules:

- Push, multicast, broadcast, and narrowcast messages count against the monthly message allowance; reply messages do not.
- The counted number is recipients, not the number of message objects in the request. A one-recipient push containing several message objects counts as one message.
- Recipients who cannot receive because they blocked the account or the user ID does not exist are excluded from the sent count.
- Once the monthly allowance/paid cap is exceeded, LINE returns an error and does not send the message.
- `GET /v2/bot/message/quota` returns the current month's target limit, including messages sent through Official Account Manager.
- `GET /v2/bot/message/quota/consumption` returns approximate current-month usage, also including Official Account Manager usage. Exact operational accounting remains available through Official Account Manager or method-specific delivery-count endpoints.

([Messaging API pricing](https://developers.line.biz/en/docs/messaging-api/pricing/), [Quota endpoints](https://developers.line.biz/en/reference/messaging-api/#get-the-target-limit-for-sending-messages-this-month))

As of the research date, the official Thailand pricing page lists 300 included messages/month on Free, 15,000 on Basic, and 35,000 on Pro, with additional-message prices on paid plans. Pricing is market-specific and mutable, so do not hard-code those numbers; read the API quota and keep the current commercial plan as an operational setting. ([LINE Official Account Thailand pricing](https://lineforbusiness.com/th/service/line-oa-features))

Recommended quota policy for the six requested behaviors:

- Combine booking success, class name/date/time/details, session deduction, and remaining balance into one push. This satisfies four requested facts at the cost of one recipient-message.
- Send a separately scheduled reminder only at the configured offsets (for example, one reminder rather than several by default).
- Send cancellation or material class/reservation change as one separate push; replace pending reminder jobs rather than duplicating them.
- Before enqueueing optional reminders, compare an internal reserved budget with the reported quota. Reserve capacity for high-value transactional messages (cancellation/change) and surface quota exhaustion to admins.
- Track application-level counts because the quota consumption value is approximate and shared with messages sent through Official Account Manager.

## 3. Webhook and credential security

The webhook endpoint must be HTTPS. Verify `x-line-signature` before parsing or otherwise modifying the request body. LINE signs the exact raw body using HMAC-SHA256 with the Messaging API channel secret. LINE does not publish stable webhook source IPs and instructs developers to use signature validation rather than IP allowlisting. Reject a missing or mismatched signature. ([Verify webhook signature](https://developers.line.biz/en/docs/messaging-api/verify-webhook-signature/), [Messaging API reference — Webhooks](https://developers.line.biz/en/reference/messaging-api/#webhooks))

Repository-specific implication: `back-end/server.js` currently installs JSON body parsing globally before all routes. The LINE webhook route must retain the raw bytes required for signature verification (for example, mount the LINE SDK webhook middleware/raw parser before the general JSON parser, or use a parser `verify` hook). Never compute the signature from reserialized JSON.

After verification, acknowledge quickly and process events asynchronously. LINE may suspend webhook delivery after prolonged receiver failures. Enable webhook redelivery in the Developers Console; it is disabled by default. Redeliveries may be duplicated and out of order, so deduplicate by `webhookEventId`, inspect `deliveryContext.isRedelivery`, and use the event timestamp when ordering matters. LINE does not disclose the redelivery count or interval. ([Receive webhooks](https://developers.line.biz/en/docs/messaging-api/receiving-messages/))

Persist enough logs for diagnosis because LINE says it does not provide Messaging API request/webhook logs on request. At minimum record the LINE `x-line-request-id`, request time, endpoint, HTTP status, application notification/event ID, reservation ID, recipient hash/internal member ID, attempt number, and final state. Do not log channel access tokens, raw ID/access tokens, message secrets, or unnecessary personal data. ([Messaging API development guidelines](https://developers.line.biz/en/docs/messaging-api/development-guidelines/), [Send tokens, not profile data](https://developers.line.biz/en/tips/2026/08/13/send-token-to-server/))

Keep channel credentials server-side. LINE documents shorter-lived/stateless/user-expiring channel tokens as safer operational choices than a long-lived token; revoke any credential suspected of compromise and automate rotation before expiration. ([Channel access tokens](https://developers.line.biz/en/docs/basics/channel-access-token/), [Corporate development guidelines](https://developers.line.biz/en/docs/partner-docs/development-guidelines/))

## 4. Scheduling and consistency architecture

### Proposed flow

```text
booking/class command
  -> commit reservation + session balance + notification outbox/jobs
  -> worker claims due outbox/job idempotently
  -> format validated LINE message
  -> push with stable X-Line-Retry-Key
  -> store LINE request ID/result; retry or dead-letter by policy

LINE webhook (raw body)
  -> verify signature
  -> deduplicate webhookEventId
  -> update follow/unfollow/link state asynchronously
```

Use a durable MongoDB outbox/job collection rather than in-process timers. A notification record should include at least: event type, reservation/member/class IDs, class revision, scheduled UTC instant, display timezone (`Asia/Bangkok`), payload snapshot or version, stable retry UUID, status, attempt count, next attempt, LINE request ID, and timestamps. Add a unique key such as `(event_type, reservation_id, class_revision, reminder_offset)` to prevent duplicate messages after process restarts or repeated API calls.

The existing reservation controller changes the user balance, class participants, and reservation through separate writes. Before notification work, define one atomic business boundary (MongoDB transaction where supported, or a carefully idempotent command/outbox design). Never send LINE inside an uncommitted database transaction: a timeout could send a confirmation for a booking that later rolls back, and network retries would hold the transaction open. Enqueue the notification in the same commit boundary; send after commit.

For reminders:

- Store all due times in UTC and derive them from the class start time plus a configured offset in `Asia/Bangkok`.
- When class start time or booking status changes, transactionally cancel stale reminder jobs and create a new version where applicable.
- At send time, re-read the reservation/class and suppress the job if canceled, already started, superseded, unlinked, opted out, or no longer eligible.
- Claim jobs with a lease/atomic state transition so concurrent workers cannot both send.
- Never use LINE's HTTP `200` as proof that a user saw or received the message.

These scheduling details are application architecture recommendations. The LINE-specific basis is that push sends “at any time” but its documented body contains the recipient, message objects, notification toggle, and aggregation unit—not a future-send timestamp. ([Send push message reference](https://developers.line.biz/en/reference/messaging-api/#send-push-message))

## 5. Retry and error handling

Always supply a generated hexadecimal UUID in `X-Line-Retry-Key` on the first push attempt and persist it with the notification. Without it, a timed-out first call cannot safely be retried. A retry key remains valid for 24 hours after the first request and retries must keep the recipient and content identical. ([Retry failed API requests](https://developers.line.biz/en/docs/messaging-api/retrying-api-request/))

Apply the official decision table:

- `2xx`: accepted; do not retry.
- `409`: the same retry key was already accepted; treat as accepted and do not retry.
- Other `4xx`: do not blindly retry; fix the request/configuration. `429` can mean rate limiting or monthly allowance exhaustion, so inspect the error and operational quota before deciding whether delayed retry is meaningful.
- `5xx` or timeout: retry the identical request with the same retry key using exponential backoff, within the 24-hour retry-key lifetime.

LINE cautions that retry keys prevent duplicate API execution but do not guarantee recipient delivery. Even after acceptance, blocked/deleted/unfriended users may not receive the message. Frequent retries themselves consume request-rate capacity. ([Retry failed API requests](https://developers.line.biz/en/docs/messaging-api/retrying-api-request/), [Messaging API status codes](https://developers.line.biz/en/reference/messaging-api/#status-codes))

Validate message structures during development/CI using `POST /v2/bot/message/validate/push`. Failed sends should move to a visible dead-letter/admin queue after bounded attempts; they must not roll back a successful reservation or session deduction.

## 6. Relevant message formats

Recommended initial format: one Flex Message per transactional event, with plain, useful `altText`; retain a plain-text fallback/template for operational safety.

- Flex Messages support structured layouts and actions. `altText` is required, appears in device notifications/chat lists, and allows up to 1,500 characters. A Flex bubble JSON definition is limited to 30 KB. ([Flex Message reference](https://developers.line.biz/en/reference/messaging-api/#flex-message))
- Plain text allows up to 5,000 characters. ([Text message reference](https://developers.line.biz/en/reference/messaging-api/#text-message))
- Push requests allow at most five message objects, and several objects to one recipient still count as one recipient-message. ([Send push message reference](https://developers.line.biz/en/reference/messaging-api/#send-push-message))
- `notificationDisabled: true` suppresses the device push alert while still sending the chat message; the default is `false`. For requested reminders/changes it should normally remain `false`, while user quiet-hour behavior should be decided as a product rule. ([Send push message request body](https://developers.line.biz/en/reference/messaging-api/#send-push-message))

Suggested content mapping:

| Event | One-message content |
| --- | --- |
| Booking confirmed | Status, class name, local date/time, instructor/location or online indicator, reservation reference, “used 1 session”, and remaining-session balance |
| Reminder | Time remaining, class name, local date/time, concise attendance instructions, authenticated “view booking” action |
| Booking canceled | Canceled status, class/date/time, whether a session was returned, and current balance |
| Booking/class changed | Clear “changed” status, old → new date/time or other material field, current reservation state, and authenticated details action |

Avoid placing medical details, broad personal information, or reusable online-class passcodes directly in notification previews (`altText`) because previews can appear on a lock screen. Prefer an authenticated deep link for sensitive details. Define Thai date/time wording, class timezone, reminder offsets, quiet hours, and which edits are “material” in the product specification rather than hard-coding them into the LINE adapter.

## 7. Implementation decisions to settle next

1. Confirm in LINE Developers Console whether the current LIFF/LINE Login channel and `@ikedyoga` Messaging API channel are under the same provider, and whether add-friend is configured.
2. Decide whether all member records are LINE-first or whether existing email members need the Messaging API account-linking flow.
3. Choose notification consent/preferences: required transactional events versus optional reminders, unlink behavior, reminder offsets, quiet hours, and admin overrides.
4. Decide how to handle session restoration on cancellation and ensure the notification reports the committed balance, not a predicted value.
5. Select the hosting-compatible durable worker mechanism. Render/web process restarts make in-memory `setTimeout`/cron-only state unsuitable; MongoDB-backed jobs are the lowest-dependency option for this repository.
6. Confirm the live Thailand OA plan and set alert thresholds/reserved quota for transactional events.
7. Correct the current LIFF authentication flow before using its `userId` as a push destination.

## Primary sources

- [LINE Developers: User account linking](https://developers.line.biz/en/docs/messaging-api/linking-accounts/)
- [LINE Developers: Provider design basics](https://developers.line.biz/en/tips/2026/06/25/provider-design-basics/)
- [LINE Developers: Using user data in LIFF apps and servers](https://developers.line.biz/en/docs/liff/using-user-profile/)
- [LINE Developers: Send tokens, not profile data](https://developers.line.biz/en/tips/2026/08/13/send-token-to-server/)
- [LINE Developers: Integrating LINE Login](https://developers.line.biz/en/docs/line-login/integrate-line-login/)
- [LINE Developers: Messaging API reference](https://developers.line.biz/en/reference/messaging-api/)
- [LINE Developers: Send messages](https://developers.line.biz/en/docs/messaging-api/sending-messages)
- [LINE Developers: Messaging API pricing](https://developers.line.biz/en/docs/messaging-api/pricing/)
- [LINE Developers: Verify webhook signature](https://developers.line.biz/en/docs/messaging-api/verify-webhook-signature/)
- [LINE Developers: Receive messages (webhook)](https://developers.line.biz/en/docs/messaging-api/receiving-messages/)
- [LINE Developers: Retry failed API requests](https://developers.line.biz/en/docs/messaging-api/retrying-api-request/)
- [LINE Developers: Messaging API development guidelines](https://developers.line.biz/en/docs/messaging-api/development-guidelines/)
- [LINE for Business Thailand: Official Account features and plans](https://lineforbusiness.com/th/service/line-oa-features)
