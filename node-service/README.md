# 🏥 Automated TAT & Batch Monitoring System

A fully automated, event-driven Turnaround Time (TAT) and Batch Monitoring System for lab sample processing. Built with **Node.js**, **Express**, **BullMQ** (Redis), and **MongoDB**.

## Architecture

```
SAP System
    │
    ▼
┌──────────────────────┐
│   POST /webhook      │  ← Entry Regulator (Express)
│   Validate + Normalize│
└──────────┬───────────┘
           │
    ┌──────▼──────┐
    │   Redis     │  ← Cache (pending samples)
    │   BullMQ    │  ← Queue (sample-processing)
    └──────┬──────┘
           │
    ┌──────▼──────────────┐
    │   Worker Process    │  ← Processing Engine
    │   • EDOS Lookup     │
    │   • Batch Assignment│
    │   • ETA / SLA Calc  │
    │   • Breach Detection│
    └──────┬──────────────┘
           │
    ┌──────▼──────┐     ┌──────────────┐
    │  MongoDB    │     │  Alerts      │
    │  (final     │     │  • Console   │
    │   storage)  │     │  • Email     │
    └─────────────┘     └──────────────┘
           │
    ┌──────▼──────────────┐
    │  Dashboard APIs     │
    │  /api/samples       │
    │  /api/stats         │
    │  /api/batches       │
    └─────────────────────┘
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

## Setup

```bash
cd node-service

# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env with your MongoDB URI, Redis URL, SMTP settings

# 3. Parse EDOS data (one-time)
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

### Dashboard APIs

| Endpoint | Description |
|----------|-------------|
| `GET /api/samples` | List all samples (paginated) |
| `GET /api/samples?status=assigned&breach=true` | Filter by status/breach |
| `GET /api/samples/:id` | Single sample detail |
| `GET /api/stats` | Counts: pending/assigned/breached/missed |
| `GET /api/batches` | Batch queues with metrics |
| `GET /health` | Service health check |

## Processing Logic

1. **EDOS Lookup**: Match test by `test_name` or `test_code` against 1070+ parsed EDOS records
2. **Batch Assignment**: Convert `received_at` → IST (Asia/Kolkata), find first valid batch window where `cutoff ≥ received_time`
3. **Missed Batch**: If no valid today window → roll forward until valid batch found → mark as delayed → fire alert
4. **ETA**: `batch_run_start + TAT_minutes` (or absolute deadline hour from EDOS)
5. **SLA**: `received_at + agreed_tat_hours`
6. **Breach**: `ETA > SLA` → flag + calculate overage minutes

## Alerts

### Console (always active)
- 🔴 **MISSED BATCH** — red terminal alert box
- 🟡 **SLA BREACH** — yellow terminal alert box
- 🟠 **DELAY ESCALATION** — magenta (missed + breach combined)

### Email (when SMTP configured in .env)
- Same alert data sent as formatted plain-text email
- Includes: sample_id, test, priority, times, overage, recommended action

## Folder Structure

```
node-service/
├── .env / .env.example
├── package.json
├── README.md
├── src/
│   ├── index.js              # Express server
│   ├── worker.js             # BullMQ worker process
│   ├── config/
│   │   ├── env.js            # Environment loader
│   │   ├── db.js             # MongoDB connection
│   │   └── redis.js          # Redis connection
│   ├── models/
│   │   └── Sample.js         # Mongoose schema
│   ├── routes/
│   │   ├── webhook.js        # POST /webhook
│   │   ├── samples.js        # GET /api/samples
│   │   ├── stats.js          # GET /api/stats
│   │   └── batches.js        # GET /api/batches
│   ├── middleware/
│   │   ├── validate.js       # Payload validation
│   │   └── errorHandler.js   # Global error handler
│   ├── services/
│   │   ├── edosLoader.js     # EDOS CSV → JSON + Redis
│   │   ├── batchAssigner.js  # Batch + ETA + SLA logic
│   │   ├── alertService.js   # Console + email alerts
│   │   └── queueService.js   # BullMQ producer
│   ├── workers/
│   │   └── sampleProcessor.js # Job handler
│   ├── scripts/
│   │   └── parseEdos.js      # CSV parse script
│   └── utils/
│       ├── timezone.js       # IST helpers (luxon)
│       ├── scheduleParser.js # Schedule string parser
│       ├── tatParser.js      # TAT string parser
│       └── logger.js         # Colour console logger
├── data/
│   └── edos.json             # Generated from CSV
└── test/
    └── payload.example.json  # Example payloads
```

## Testing with cURL

```bash
# Health check
curl http://localhost:3000/health

# Submit a sample
curl -X POST http://localhost:3000/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "sample_id": "SAP-TEST-001",
    "received_at": "2026-03-27T14:30:00+05:30",
    "test_name": "test_1",
    "method": "EIA",
    "specimen_type": "Serum",
    "agreed_tat_hours": 24,
    "priority_tat": "NORMAL"
  }'

# View samples
curl http://localhost:3000/api/samples

# View stats
curl http://localhost:3000/api/stats

# View batches
curl http://localhost:3000/api/batches
```

## Key Design Decisions

- **Event-driven, NO polling**: BullMQ queue triggers processing, no DB polling
- **Redis for transient state**: Cache + queue only, NOT permanent storage
- **MongoDB for final storage**: All computed results persisted after processing
- **Separate worker process**: Decoupled from API server for scalability
- **Priority queue**: HIGH priority / missed-batch samples processed first
- **EDOS in-memory Map**: Sub-millisecond lookups for 1000+ test configs
