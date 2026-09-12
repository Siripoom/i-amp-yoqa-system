# Use a durable outbox and dedicated worker for transactional LINE notifications

Reservation changes, class-entitlement changes, attendance changes, and notification jobs will commit atomically in MongoDB, while a dedicated Render Background Worker in Singapore sends queued LINE messages after commit. This costs more than an in-process timer or periodic cron job, but prevents sleeping or restarting web processes from losing reminders and prevents a LINE timeout from rolling back a valid reservation; rollout therefore requires a MongoDB deployment that supports transactions.

## Considered Options

- A scheduler inside the web service was rejected because Render instances can sleep, restart, or overlap during deployment.
- A Render Cron Job remains a lower-cost future option if the business accepts polling latency, but it is not the production default.
- Sending LINE messages inside the reservation request or database transaction was rejected because remote failures and retries would couple message delivery to booking correctness.

## Consequences

Notification jobs require atomic leases, stable LINE retry keys, bounded retries, graceful worker shutdown, and operational visibility. Production also requires a paid Render Background Worker and a transaction-capable MongoDB replica set.
