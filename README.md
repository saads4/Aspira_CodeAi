# 🏥 TAT Batch Monitoring Service

A fully automated, event-driven Turnaround Time (TAT) and Batch Monitoring System for laboratory sample processing. It receives samples from SAP via webhooks, assigns them to batch windows using EDOS (Equipment Daily Operating Schedule) data, computes ETA/SLA deadlines, detects breaches, and fires alerts.

**Stack:** Node.js + Express + BullMQ + MongoDB + Redis + Nodemailer

## Project Overview

This system automates the entire sample processing workflow:
- **SAP webhook intake** (single + multi-test payloads)
- **Result-ready webhook with idempotency**
- **EDOS-driven batch assignment** (CSV/JSON)
- **TAT computation with SLA breach detection**
- **BullMQ job queues with retry + backoff**
- **MongoDB persistence** (samples + alerts)
- **Redis caching** (EDOS data + sample status + idempotency)
- **Dashboard APIs** (stats, batches, alerts, samples)
- **Email alerting via Nodemailer** (optional SMTP)
- **Colour-coded terminal logging with Chalk**
- **Graceful shutdown** (SIGINT/SIGTERM)

## Architecture

```
  ┌──────────┐   POST /webhook     ┌──────────────┐   BullMQ Queue        ┌────────────────┐
  │  SAP /   │ ──────────────────► │  Express API │ ──────────────────►   │  Worker Process│
  │  Client  │                     │  (index.js)  │  "sample-processing"  │  (worker.js)   │
  └──────────┘                     └──────────────┘                       └────────────────┘
       │                                  │                                      │
       │  POST /webhook/result            │  Redis Cache                         │ MongoDB Write
       │ ────────────────────────►         │  (sample status,                     │ (Sample model)
       │                                  │   EDOS data,                         │
       │                                  │   idempotency keys)                  ▼
       │                                  │                               ┌────────────────┐
       │  GET /api/*                      │                               │  Alert Service │
       │ ◄────────────────────────        │                               │  (console+DB+  │
       │  (samples, stats,                │                               │   email)       │
       │   batches, alerts)               │                               └────────────────┘
       │                                  │
       ▼                                  ▼
  ┌──────────┐                     ┌──────────────┐
  │Dashboard │                     │   MongoDB    │
  │  / API   │                     │  (Samples +  │
  │ Consumer │                     │   Alerts)    │
  └──────────┘                     └──────────────┘

Two-Process Architecture:
  Process 1: Express API Server     (node src/index.js)  — handles HTTP
  Process 2: BullMQ Worker          (node src/worker.js) — processes jobs
```

## Prerequisites

- **Node.js** v18+
- **Redis** (local or Docker)
- **MongoDB** (local or Atlas)

### Start Redis (Docker)

```bash
docker run -d --name redis -p 6379:6379 redis:7-alpine
```

### Start MongoDB (Docker)

```bash
docker run -d --name mongo -p 27017:27017 mongo:7
```

Or use your **MongoDB Atlas** connection string in `.env`.

## Environment Configuration

Copy `.env.example` to `.env` and configure:

```bash
MONGO_URI        = mongodb connection string (Atlas or local)
REDIS_URL        = redis connection string (Redis Cloud or local)
PORT             = 3000 (Express server port)
SMTP_HOST        = (optional) SMTP server for email alerts
SMTP_PORT        = 587
SMTP_USER        = (optional) SMTP username
SMTP_PASS        = (optional) SMTP password
ALERT_EMAIL_TO   = (optional) recipient email
ALERT_EMAIL_FROM = (optional) sender email (default: tat-monitor@aspira.lab)
```

## Setup

```bash
cd node-service

# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env with your MongoDB URI, Redis URL, SMTP settings

# 3. Parse EDOS data (one-time — auto-generates data/edos.json)
npm run parse-edos

# 4. Start both server + worker
npm run dev
```

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Start Express API server only |
| `npm run worker` | Start BullMQ queue worker only |
| `npm run dev` | Start both server + worker concurrently |
| `npm run parse-edos` | Parse EDOS CSV → JSON (one-time setup) |
| `npm test` | Run unit / integration tests |

## API Endpoints

### Webhook (SAP Intake)

```bash
POST /webhook
Content-Type: application/json

# Single sample
{
  "sample_id": "SAP-2026-00142",
  "test_id": "TID-001",
  "received_at": "2026-03-27T14:30:00+05:30",
  "test_name": "test_1",
  "method": "EIA",
  "specimen_type": "Serum",
  "agreed_tat_hours": 24,
  "priority_tat": "NORMAL"
}

# Multiple tests
{
  "tests": [ ... ]
}
```

**Response:** `202 Accepted`
```json
{
  "status": "accepted",
  "message": "Queued for processing",
  "count": 1,
  "sample_ids": ["SAP-2026-00142"]
}
```

### Webhook (Result Intake)

```bash
POST /webhook/result
Content-Type: application/json

{
  "sample_id": "SAP-2026-00142",
  "test_name": "test_1",
  "result_ready_at": "2026-03-27T18:30:00.000Z"
}
```

**Response:** `202 Accepted`
```json
{
  "status": "accepted",
  "message": "Result queued for processing",
  "sample_id": "SAP-2026-00142"
}
```

### Dashboard APIs

| Endpoint | Description |
|----------|-------------|
| `GET /api/samples` | List all samples (paginated) |
| `GET /api/samples?status=assigned&breach=true` | Filter by status/breach |
| `GET /api/samples?missed=true` | Filter missed-batch samples |
| `GET /api/samples/:id` | Single sample detail |
| `GET /api/stats` | Counts: pending/assigned/breached/missed |
| `GET /api/batches` | Batch queues with metrics |
| `GET /api/batches?date=2026-03-27` | Filter batches by date |
| `GET /api/alerts` | Recent alerts (paginated) |
| `GET /api/alerts?type=MISSED_BATCH` | Filter by alert type |
| `GET /api/alerts/summary` | Counts by alert type |
| `GET /health` | Service health check |

## Data Flow / Workflow

### Sample Ingestion Flow:
1. SAP sends POST /webhook with sample data (JSON)
2. validate.js middleware checks required fields
3. webhook.js normalizes payload, caches in Redis (TTL 24h)
4. webhook.js calls enqueueSample() → BullMQ "sample-processing" queue
5. Response: 202 Accepted with sample_ids
6. worker.js picks up job from queue
7. sampleProcessor.js:
   a. EDOS lookup (by test_name or test_code)
   b. If no EDOS match → uses payload defaults (Daily 5pm, agreed_tat_hours)
   c. assignBatch() computes: batch_id, batch_run_start, batch_cutoff, ETA, SLA
   d. Detects breach_flag (ETA > SLA) and missed_batch (past cutoff)
   e. Upserts to MongoDB Sample collection
   f. Fires alerts: MISSED_BATCH, SLA_BREACH, DELAY_ESCALATION

### Result Completion Flow:
1. SAP sends POST /webhook/result with { sample_id, test_name, result_ready_at }
2. resultWebhook.js validates payload
3. Redis idempotency check (key TTL 48h)
4. Enqueues to BullMQ "result-processing" queue
5. Response: 202 Accepted
6. resultWorker.js:
   a. Finds sample in MongoDB
   b. Skips if already completed (idempotent)
   c. Computes: actual_tat_minutes, completed_within_sla, prediction_error_minutes
   d. Updates MongoDB (status → completed)
   e. Fires RESULT_COMPLETED alert

## Processing Logic

1. **EDOS Lookup**: Match test by `test_name` or `test_code` against 1070+ parsed EDOS records
2. **Batch Assignment**: Convert `received_at` → IST (Asia/Kolkata), find first valid batch window where `cutoff ≥ received_time`
3. **Missed Batch** *(HIGH PRIORITY)*: If no valid today window → roll forward until valid batch found → mark as delayed → fire immediate alert
4. **ETA**: `batch_run_start + TAT_minutes` (or absolute deadline hour from EDOS)
5. **SLA**: `received_at + agreed_tat_hours`
6. **Breach**: `ETA > SLA` → flag + calculate overage minutes

## Missed Batch Handling

Missed batch is treated as a **high-priority system event**:
- Detected immediately when a sample misses its batch cutoff
- Automatic reassignment to the next valid batch window
- ETA recalculated for the new batch
- Sample marked as `delayed` with clear `delay_reason`
- **No sample remains unassigned** — the system scans up to 30 days forward
- Immediate console + email + DB alerts triggered for visibility

## Alerts

### Console (always active)
- 🔴 **MISSED BATCH** — red terminal alert box with full details
- 🟡 **SLA BREACH** — yellow terminal alert box
- 🟠 **DELAY ESCALATION** — magenta (missed + breach combined)

### Email (when SMTP configured in .env)
- Same alert data sent as formatted plain-text email
- Includes: sample_id, test, priority, times, overage, recommended action

### MongoDB (always active)
- All alerts persisted to `alerts` collection
- Queryable via `GET /api/alerts` with type/sample filtering
- Each alert includes: type, sample_id, test_name, priority, full alert data, timestamps

## Mongoose Models

### Sample Model
```javascript
{
  sample_id           String    (required, indexed)
  test_id             String
  test_name           String    (required, indexed)
  test_code           String
  method              String
  specimen_type       String
  received_at         Date      (required)
  agreed_tat_hours    Number    (required)
  priority_tat        String    (default: NORMAL)
  batch_id            String    (indexed)
  batch_run_start     Date
  batch_cutoff        Date
  eta                 Date
  sla_deadline        Date
  breach_flag         Boolean   (default: false, compound indexed)
  overage_minutes     Number    (default: 0)
  missed_batch        Boolean   (default: false)
  delay_reason        String
  result_ready_at     Date
  actual_tat_minutes  Number
  completed_within_sla Boolean
  prediction_error_minutes Number
  status              String    (enum: pending|processing|assigned|delayed|completed|error)
  processed           Boolean   (default: false)
  created_at / updated_at      (auto-managed timestamps)
}
```

### Alert Model
```javascript
{
  type                String    (enum: MISSED_BATCH|SLA_BREACH|DELAY_ESCALATION|RESULT_COMPLETED)
  sample_id           String    (required, indexed)
  test_name           String    (required)
  priority            String    (default: NORMAL)
  alert_data          Object    (nested: received_at, batch_id, eta, sla_deadline, etc.)
  acknowledged        Boolean   (default: false)
  created_at / updated_at      (auto-managed timestamps)
}
```

## Folder Structure

```
node-service/
├── .env                        ← Active environment variables (MongoDB Atlas + Redis Cloud)
├── .env.example                ← Template with placeholder values
├── package.json                ← Project metadata, npm scripts, dependencies
├── package-lock.json           ← Locked dependency tree
│
├── data/
│   └── edos.json               ← Pre-parsed EDOS test records (JSON fallback, ~636KB)
│
└── src/
    ├── index.js                ← EXPRESS SERVER entry point
    │                             - Boots MongoDB + Redis + EDOS
    │                             - Mounts all routes
    │                             - Health-check endpoint
    │                             - Graceful shutdown
    │
    ├── worker.js               ← BULLMQ WORKER entry point
    │                             - Boots MongoDB + Redis + EDOS
    │                             - Starts "sample-processing" worker (concurrency 5)
    │                             - Starts "result-processing" worker (concurrency 5)
    │                             - Rate limited: 20 jobs/sec per worker
    │                             - Graceful shutdown
    │
    ├── config/
    │   ├── env.js              ← Reads .env via dotenv, exports all config vars
    │   ├── db.js               ← MongoDB connection via Mongoose
    │   └── redis.js            ← Redis connection via IORedis (singleton, BullMQ-compatible)
    │
    ├── middleware/
    │   ├── validate.js         ← Webhook payload validation (required fields check)
    │   └── errorHandler.js     ← Global Express error handler (logs + JSON 500)
    │
    ├── models/
    │   ├── Sample.js           ← Mongoose schema for lab samples (all fields)
    │   └── Alert.js            ← Mongoose schema for alerts (4 types)
    │
    ├── routes/
    │   ├── webhook.js          ← POST /webhook — SAP sample intake
    │   ├── resultWebhook.js    ← POST /webhook/result — result-ready intake
    │   ├── samples.js          ← GET /api/samples, GET /api/samples/:id
    │   ├── stats.js            ← GET /api/stats — dashboard aggregations
    │   ├── batches.js          ← GET /api/batches — batch queue summaries
    │   └── alerts.js           ← GET /api/alerts, GET /api/alerts/summary
    │
    ├── services/
    │   ├── queueService.js     ← BullMQ producer for "sample-processing" queue
    │   ├── resultQueueService.js ← BullMQ producer for "result-processing" queue
    │   ├── batchAssigner.js    ← Core batch window + ETA + SLA + breach logic
    │   ├── edosLoader.js       ← Loads EDOS from CSV or JSON, builds in-memory maps
    │   └── alertService.js     ← Fires alerts (console + MongoDB + email)
    │
    ├── workers/
    │   ├── sampleProcessor.js  ← Job handler: EDOS lookup → batch assign → save → alert
    │   └── resultWorker.js     ← Job handler: find sample → compute metrics → complete
    │
    ├── utils/
    │   ├── logger.js           ← Colour-coded console logger (chalk + luxon timestamps)
    │   ├── scheduleParser.js   ← Parses EDOS schedule strings → structured objects
    │   ├── tatParser.js        ← Parses EDOS TAT strings → { tat_minutes, deadline_hour }
    │   └── timezone.js         ← IST (Asia/Kolkata) timezone helpers
    │
    └── scripts/
        └── parseEdos.js        ← One-shot script: parse EDOS CSV → data/edos.json
```

## Testing Every Feature (cURL Commands)

**Note:** Run `npm run dev` first. All commands use http://localhost:3000.

### Health Check
```bash
curl http://localhost:3000/health
```

### Submit a Single Sample via Webhook
```bash
curl -X POST http://localhost:3000/webhook \
  -H "Content-Type: application/json" \
  -d '{"sample_id":"TEST-001","test_name":"CBC","method":"Automated","specimen_type":"Blood","received_at":"2026-03-28T10:00:00.000Z","agreed_tat_hours":24}'
```

### Submit Multiple Tests via Webhook
```bash
curl -X POST http://localhost:3000/webhook \
  -H "Content-Type: application/json" \
  -d '{"tests":[{"sample_id":"TEST-002","test_name":"LFT","method":"Photometry","specimen_type":"Serum","received_at":"2026-03-28T09:00:00.000Z","agreed_tat_hours":48},{"sample_id":"TEST-003","test_name":"KFT","method":"Photometry","specimen_type":"Serum","received_at":"2026-03-28T11:00:00.000Z","agreed_tat_hours":24}]}'
```

### Submit Result (after sample processed)
```bash
curl -X POST http://localhost:3000/webhook/result \
  -H "Content-Type: application/json" \
  -d '{"sample_id":"TEST-001","test_name":"CBC","result_ready_at":"2026-03-28T18:30:00.000Z"}'
```

### List All Samples
```bash
curl http://localhost:3000/api/samples
```

### Filter Samples
```bash
curl "http://localhost:3000/api/samples?status=assigned"
curl "http://localhost:3000/api/samples?breach=true"
curl "http://localhost:3000/api/samples?missed=true"
curl "http://localhost:3000/api/samples?test_name=CBC"
```

### Get Single Sample Detail
```bash
curl http://localhost:3000/api/samples/TEST-001
```

### Dashboard Stats
```bash
curl http://localhost:3000/api/stats
```

### Batch Queues
```bash
curl http://localhost:3000/api/batches
curl "http://localhost:3000/api/batches?date=2026-03-28"
```

### Alerts
```bash
curl http://localhost:3000/api/alerts
curl "http://localhost:3000/api/alerts?type=SLA_BREACH"
curl "http://localhost:3000/api/alerts/summary"
```

## Services Layer

### queueService.js
- Manages BullMQ "sample-processing" queue
- 3 retry attempts, exponential backoff (2s base)
- HIGH priority samples get priority=1, others priority=5
- Keeps 500 completed + 200 failed jobs

### resultQueueService.js
- Manages BullMQ "result-processing" queue
- 5 retry attempts, exponential backoff (3s base)
- All results get priority=3

### batchAssigner.js
- assignBatch(sample, edos) → computes all batch/ETA/SLA fields
- Scans up to 30 days for valid batch windows
- Handles missed batches, absolute deadlines, relative TATs

### edosLoader.js
- Loads from CSV (Edos List.csv) or JSON fallback (data/edos.json)
- Builds two in-memory Maps: by test_name and by test_code
- Caches in Redis hashes (edos:tests, edos:codes)
- lookupTest(name, code) for fast retrieval

### alertService.js
- alertMissedBatch()       → console + DB + email
- alertSLABreach()         → console + DB + email
- alertDelayEscalation()   → console + DB + email
- alertResultCompleted()   → console + DB + email

## Workers

### sampleProcessor.js (queue: "sample-processing")
1. EDOS lookup (by test_name / test_code)
2. Fallback to defaults if no EDOS match
3. Supports batch_windows override from payload
4. Calls assignBatch() for computation
5. Upserts Sample document in MongoDB
6. Fires MISSED_BATCH, SLA_BREACH, DELAY_ESCALATION alerts
7. On error: marks sample status="error", rethrows for BullMQ retry

### resultWorker.js (queue: "result-processing")
1. Finds sample by sample_id + test_name
2. If not found → throws error (BullMQ will retry)
3. If already completed → returns skipped
4. Computes: actual_tat_minutes, completed_within_sla, prediction_error_minutes
5. Updates MongoDB status → completed
6. Fires RESULT_COMPLETED alert

## Utilities

### logger.js
- Chalk-coloured console output with IST timestamps
- Methods: info, success, warn, error, alert
- Special boxes: missedBatch, slaBreach, delayEscalation, resultCompleted

### scheduleParser.js
- parseSchedule("Daily 6 pm") → { days: [0..6], cutoff_hour: 18, cutoff_minute: 0 }
- Handles: Daily, Mon-Fri ranges, Tue/Fri lists, Walk In, 1st&3rd specials

### tatParser.js
- parseTAT("Next Day 8 pm") → { tat_minutes: 1440, deadline_hour: 20 }
- Handles: Same Day, Next Day, Nth Day, Hours, Days, Weeks

### timezone.js
- ZONE = "Asia/Kolkata"
- toIST(), getISTNow(), setTimeIST(), parseTimeString(), parseOpenTime()

## Middleware

### validate.js
- Required fields: sample_id, received_at, test_name, method, specimen_type, agreed_tat_hours
- Validates agreed_tat_hours is positive number
- Validates received_at is valid ISO 8601
- Supports single payload and { tests: [...] } array format

### errorHandler.js
- Catches unhandled Express errors
- Logs with logger.error + console.error(stack)
- Returns JSON { status: "error", message: "..." } with status code

## Key Design Decisions

- **Event-driven, NO polling**: BullMQ queue triggers processing, no DB polling
- **Redis for transient state**: Cache + queue only, NOT permanent storage
- **MongoDB for final storage**: All computed results persisted after processing
- **Separate worker process**: Decoupled from API server for scalability
- **Priority queue**: HIGH priority / missed-batch samples processed first
- **EDOS in-memory Map**: Sub-millisecond lookups for 1000+ test configs
- **Graceful shutdown**: Both server and worker handle SIGINT/SIGTERM cleanly
- **Alert persistence**: All alerts saved to MongoDB for dashboard querying
- **EDOS fallback**: Loads from edos.json if CSV is not available
- **Idempotency**: Result webhooks are deduplicated using Redis keys (48h TTL)

## Batch Assignment Logic

1. Convert received_at to IST
2. Scan up to 30 days for a valid batch window from EDOS schedule
3. Check if received_at is before cutoff time on schedule days
4. If missed today's cutoff → missed_batch = true, scan next day
5. Build batch_id: BATCH-{test_code}-{YYYYMMDD}-{HHmm}
6. Compute ETA:
   - If EDOS has deadline_hour → batch_run_start + days offset at that hour
   - Otherwise → batch_run_start + tat_minutes
7. SLA deadline = received_at + agreed_tat_hours
8. Breach = (ETA > SLA deadline)
9. Overage = breach minutes

## Running the Application

npm scripts:
- `npm start`          → node src/index.js       (API server only)
- `npm run worker`     → node src/worker.js      (worker only)
- `npm run dev`        → concurrently runs both  (recommended for development)
- `npm run parse-edos` → node src/scripts/parseEdos.js (parse EDOS CSV → JSON)

## Verify Startup

You should see in the console:
```
[SUCCESS] MongoDB connected
[INFO]    Redis connected
[SUCCESS] EDOS loaded from JSON: XXXX test records
[SUCCESS] 🚀 TAT Monitor API running on http://localhost:3000
[INFO]    🏭 Worker started — listening to "sample-processing" queue
[INFO]    🏭 Worker started — listening to "result-processing" queue
```
