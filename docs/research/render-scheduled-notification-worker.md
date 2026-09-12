# Render options for a durable scheduled notification worker

Research date: 2026-09-12 (Asia/Bangkok)

Scope: official Render sources only. This note evaluates how the existing Node/Express + external MongoDB application can reliably dispatch scheduled LINE notifications. It does not prescribe application business rules.

## Recommendation for this repository

Use a separate paid Render Background Worker in the same Singapore region as the existing `i-amp-yoqa-backend`, with MongoDB as the durable notification queue/outbox. Start with Render's smallest background-worker plan (`0.5c-512mb`, formerly Starter), currently listed at USD 7/month. The worker should poll and atomically claim due MongoDB jobs, send LINE requests, persist results/retry times, and handle `SIGTERM` by stopping new claims and finishing or releasing its current lease. This gives continuous processing and avoids dependence on inbound HTTP traffic. ([Background Workers](https://render.com/docs/background-workers), [Compute Plans](https://render.com/docs/compute-plans), [Render Pricing](https://render.com/pricing), [Deploys and graceful shutdown](https://render.com/docs/deploys#graceful-shutdown))

If the business accepts reminder/transactional-notification latency approximately equal to the polling interval and wants the lowest platform cost, a Render Cron Job that runs a finite “claim due jobs, process a bounded batch, exit” command is a reasonable first production stage. Cron billing is prorated by active seconds with a USD 1/month minimum per cron service. Render guarantees at most one active run of a particular cron job, but the MongoDB claim/idempotency mechanism remains necessary for retries, manual runs, deploy transitions, and coordination with any immediate send attempted by the web service. ([Cron Jobs](https://render.com/docs/cronjobs))

Do not run the only scheduler as an in-process timer inside the current web service. A Free web service spins down after 15 minutes without inbound traffic, takes about a minute to wake, can be restarted by Render at any time, and loses local filesystem changes on spin-down/restart/deploy. Paid web services do not idle-spin-down, but Render still replaces instances during deploys/restarts/maintenance; queue state must therefore remain in MongoDB. ([Free web services](https://render.com/docs/free#free-web-services), [Render FAQ](https://render.com/docs/faq), [Deploys](https://render.com/docs/deploys))

## Current repository context

The root `render.yaml` defines only one Singapore Node web service:

```yaml
services:
  - type: web
    name: i-amp-yoqa-backend
    env: node
    region: singapore
    buildCommand: cd back-end && npm install
    startCommand: cd back-end && npm start
```

It does not define a worker or cron service and does not explicitly set a compute plan. The backend already connects to MongoDB through `MONGO_URI`, making a MongoDB-backed outbox the lowest-dependency durable queue for this codebase. Render's Blueprint schema supports `type: worker` and `type: cron`; service type cannot be changed after creation. If a new service omits `plan`, Render currently defaults new web/private/worker/cron services to `0.5c-512mb`. ([Blueprint YAML reference](https://render.com/docs/blueprint-spec))

The recommendation assumes MongoDB is externally hosted (for example, Atlas), as Render does not offer a managed MongoDB product in the cited service list. Render explicitly supports connecting to a custom datastore such as MongoDB; changes to a service's default filesystem are otherwise ephemeral. ([Services and service types](https://render.com/docs/service-types), [Deploys — Ephemeral filesystem](https://render.com/docs/deploys#ephemeral-filesystem))

## Option comparison

| Option | Runtime behavior | Timing fit | Official cost/availability | Assessment |
| --- | --- | --- | --- | --- |
| Background Worker | Runs continuously, receives no inbound traffic, normally polls a shared queue | Best for low-latency immediate events and precise due-job polling | No Free worker plan is listed; smallest worker compute is `0.5c-512mb`, currently USD 7/month | Recommended production default |
| Cron Job | Starts on a UTC cron schedule, executes a command, then exits | Good if bounded polling delay is acceptable | Prorated per active second, USD 1/month minimum per cron service; no Free cron plan listed | Cost-sensitive starting option |
| Scheduler inside paid web service | Process remains up on paid compute, but shares lifecycle/resources with API | Can poll frequently, but deploy/restart coupling increases risk | No extra service cost beyond the paid web instance | Acceptable only as a temporary compromise; still use Mongo leases |
| Scheduler inside Free web service | Spins down after 15 minutes without inbound traffic and wakes only on inbound HTTP/WebSocket traffic | Cannot reliably send reminders while asleep | USD 0 but explicitly not recommended by Render for production | Reject |

Render describes a Background Worker as a continuously running service without inbound network traffic, typically polling a queue, and recommends workers for interaction with third-party APIs. Render's Node example queue framework is BullMQ backed by a Redis-compatible Render Key Value instance. This project does not need to add BullMQ/Key Value solely for scheduling if MongoDB already holds a correctly designed durable outbox, although Render's managed queue pattern is an available scaling path. ([Background Workers](https://render.com/docs/background-workers))

Render Cron Jobs are finite commands on a cron expression. All schedule fields are interpreted in UTC, environment variables are supported, and run/build history and logs are visible in the Dashboard. A Git-backed cron job builds when the connected branch changes; a new build affects future runs only and does not alter a run already in progress. ([Cron Jobs](https://render.com/docs/cronjobs))

## Cron Job constraints

Render documents these operational guarantees and limits:

- At most one run of a given cron job is active at a time.
- If the next scheduled time arrives while a run is active, the next run is delayed until the active one finishes.
- A manual trigger cancels an active run before starting the manual run.
- Render terminates a cron run after 12 hours; continuously running work belongs in a Background Worker or Workflow.
- Cron jobs cannot provision or access a persistent disk.
- The command must exit when finished, and billing continues for its running time.
- All cron schedule dates/times use UTC.

([Cron Jobs](https://render.com/docs/cronjobs))

Repository implications:

- Convert Thailand-local reminder rules to stored UTC due times in the application; do not write a Bangkok-local cron expression without converting it.
- Keep each invocation bounded by both a maximum job count and a maximum wall-clock duration so a stuck notification does not delay later runs.
- A single-run guarantee prevents two scheduled invocations of that one Render cron service from overlapping, but it does not replace per-job atomic claims. Admin/manual executions cancel an active run, and another component may also process outbox rows.
- Persist no cursor/checkpoint on disk. Query MongoDB for eligible jobs on every run.

## Free web-service spin-down and why it matters

Render spins down a Free web service after 15 minutes without inbound HTTP or WebSocket traffic. Outbound work such as MongoDB polling or LINE API calls is not documented as activity that prevents spin-down. Wake-up happens only on the next inbound HTTP request or WebSocket connection and takes about one minute. Render also says Free services are for previews/hobby use, not production. ([Deploy for Free](https://render.com/docs/free))

Free services can also be restarted at any time, and all local files are lost on spin-down, restart, and redeploy. Therefore:

- a `setInterval`, `setTimeout`, or in-process cron package in the current Free web process will stop while the service sleeps;
- a local JSON/SQLite/file queue is unsafe;
- sending synthetic keep-alive traffic is not a scheduler guarantee and does not solve deploy/restart loss;
- MongoDB must be the source of truth for due, claimed, delivered, retrying, and failed states.

Paid compute plans do not spin down from inactivity. Even so, Render services retain an ephemeral filesystem by default and undergo lifecycle replacement, so paid compute improves availability but does not make in-memory scheduling durable. ([Render FAQ](https://render.com/docs/faq), [Deploys](https://render.com/docs/deploys))

## Deploy, restart, and shutdown behavior

Render's zero-downtime deployment model applies to web services, private services, background workers, and cron jobs. A manual service restart is implemented as a special deploy that creates a new instance using the currently deployed commit/configuration, then swaps it in. A restart does not incorporate environment-variable changes that were saved but never deployed. ([Deploying on Render](https://render.com/docs/deploys))

During deployment Render eventually sends `SIGTERM` to the old process. The default graceful-shutdown allowance is 30 seconds, after which Render sends `SIGKILL`; `maxShutdownDelaySeconds` can be configured from 1 through 300 seconds for web/private/background-worker services. Render specifically lists completing an in-progress worker task—or marking it failed for another worker to retry—as a graceful-shutdown action. ([Deploys — Graceful shutdown](https://render.com/docs/deploys#graceful-shutdown), [Blueprint `maxShutdownDelaySeconds`](https://render.com/docs/blueprint-spec#maxshutdowndelayseconds))

The worker must therefore:

1. Trap `SIGTERM` and stop claiming new jobs.
2. Allow the current short LINE request to finish within the shutdown budget.
3. Persist success, or release/expire the MongoDB lease so another process can retry.
4. Close MongoDB and exit cleanly before the deadline.

Assume old and new processes can coexist during lifecycle transitions and that a process can die after LINE accepts a message but before MongoDB records success. Use an atomic MongoDB lease plus LINE's stable `X-Line-Retry-Key`; the scheduling research cannot rely on process uniqueness alone.

Render platform maintenance can also replace service instances and sends `SIGTERM` to long-running workers. Paid services generally receive advance notice for service-affecting maintenance; free services may undergo maintenance without advance notice and cannot reschedule it. ([Render Platform Maintenance](https://render.com/docs/platform-maintenance))

## MongoDB and networking

Background workers and cron jobs can initiate outbound public requests and can send private-network requests to Render services in the same workspace and region, but they do not have inbound internal addresses. This is fine for a worker that only connects outward to MongoDB and LINE. ([Private Network](https://render.com/docs/private-network))

For an IP-restricted external MongoDB service, Render exposes the outbound CIDR ranges for each service/region in the Dashboard. Any address in the region's shared ranges may be used. Allowlist the documented Singapore ranges in the MongoDB provider, or purchase dedicated outbound IPs if the database provider cannot accept the whole range. Do not hard-code an IP observed from one request. ([Outbound IP Addresses](https://render.com/docs/outbound-ip-addresses))

Put the web and worker/cron service in the same Render region (`singapore`) for consistent latency and configuration. Region cannot be changed on an existing service; moving requires creating a replacement service. ([Render Regions](https://render.com/docs/regions))

Share `MONGO_URI`, LINE credentials, timezone/poll settings, and other secrets using a Render Environment Group or equivalent per-service secret variables. Render recommends environment variables for credentials and warns not to commit secret values into `render.yaml`. Environment-group changes redeploy linked services that have auto-deploy enabled. ([Environment Variables and Secrets](https://render.com/docs/configure-environment-variables), [Blueprint secret variables](https://render.com/docs/blueprint-spec#setting-environment-variables))

## Cost and plan implications

As of the research date:

- Render's smallest paid service/worker compute (`0.5c-512mb`, legacy name Starter) is listed at USD 7/month for 0.5 CPU and 512 MB RAM.
- Background-worker plan tables begin at `0.5c-512mb`; they do not list a Free worker plan.
- Cron plan tables also begin at `0.5c-512mb`, but cron compute is billed only for active running time, prorated by the second, with a USD 1 minimum monthly charge per cron service.
- Each scaled continuous worker instance is billed on its selected compute plan, so one worker should be sufficient initially; scale only after measuring queue delay.
- Render's workspace plan and a service's compute plan are separate decisions. Upgrading a workspace does not remove Free-instance limitations from a service that remains on Free compute.

([Render Pricing](https://render.com/pricing), [Compute Plans](https://render.com/docs/compute-plans), [Cron Jobs — billing](https://render.com/docs/cronjobs#compute-plans-and-billing), [Deploy for Free](https://render.com/docs/free#upgrading-to-a-paid-instance))

Prices can change. Confirm the Dashboard quote at provisioning time; do not encode cost assumptions in application code.

## Proposed deployment shapes

### Preferred: continuous worker

```text
Render web service (existing)
  -> writes booking/session changes + notification job to MongoDB

Render background worker, Singapore, 0.5c-512mb
  -> polls and atomically leases due MongoDB jobs
  -> calls LINE Messaging API
  -> persists success/retry/dead-letter state
```

Blueprint shape to implement later (illustrative only; not applied by this research):

```yaml
- type: worker
  name: i-amp-yoqa-line-worker
  runtime: node
  region: singapore
  plan: 0.5c-512mb
  buildCommand: cd back-end && npm install
  startCommand: cd back-end && node workers/lineNotificationWorker.js
  maxShutdownDelaySeconds: 60
```

### Lower-cost: finite cron poller

```text
Render web service (existing)
  -> writes booking/session changes + notification job to MongoDB

Render cron job, Singapore
  -> on each UTC schedule: claim/process bounded due jobs -> exit
```

Blueprint shape to implement later:

```yaml
- type: cron
  name: i-amp-yoqa-line-notifications
  runtime: node
  region: singapore
  plan: 0.5c-512mb
  schedule: "*/1 * * * *"
  buildCommand: cd back-end && npm install
  startCommand: cd back-end && node scripts/processLineNotifications.js
```

The one-minute expression is standard five-field cron syntax; validate the final Blueprint with Render tooling before provisioning. Render's documented examples confirm five-field expressions and UTC interpretation, but the product specification should promise a delivery window rather than exact-to-the-second delivery. ([Cron Jobs](https://render.com/docs/cronjobs), [Blueprint validation](https://render.com/docs/blueprint-spec#validating-blueprints))

## Reliability acceptance criteria for implementation

- No notification state exists only in process memory or the Render filesystem.
- Every job has an atomic lease, lease expiry, bounded attempt count, next-attempt time, and stable LINE retry key.
- A worker crash/redeploy after claiming a job makes it reclaimable after lease expiry.
- `SIGTERM` stops new claims and drains/releases the current claim within the configured shutdown delay.
- Duplicate worker processes or overlapping deploy instances cannot cause duplicate LINE execution.
- Cron processing is bounded and exits; a late/stuck run cannot grow indefinitely.
- Timestamps are stored in UTC; Thai display times are derived explicitly as `Asia/Bangkok`.
- Web and worker/cron share secrets without committing them, and external MongoDB allowlists all applicable Render outbound ranges.
- Operational alerts cover growing due-job age, repeated failures/dead letters, process restarts, and LINE quota exhaustion.

## Primary sources

- [Render Docs: Background Workers](https://render.com/docs/background-workers)
- [Render Docs: Cron Jobs](https://render.com/docs/cronjobs)
- [Render Docs: Deploy for Free](https://render.com/docs/free)
- [Render Docs: Deploying on Render](https://render.com/docs/deploys)
- [Render Docs: Platform Maintenance](https://render.com/docs/platform-maintenance)
- [Render Docs: Services and Service Types](https://render.com/docs/service-types)
- [Render Docs: Compute Plans](https://render.com/docs/compute-plans)
- [Render Docs: Blueprint YAML Reference](https://render.com/docs/blueprint-spec)
- [Render Docs: Environment Variables and Secrets](https://render.com/docs/configure-environment-variables)
- [Render Docs: Private Network](https://render.com/docs/private-network)
- [Render Docs: Outbound IP Addresses](https://render.com/docs/outbound-ip-addresses)
- [Render Docs: Regions](https://render.com/docs/regions)
- [Render Pricing](https://render.com/pricing)
