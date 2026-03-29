# 🧪 Aspira TAT Monitor — Frontend Feature Testing Guide
# Complete Walkthrough: Every Feature with Sample Data
# ═══════════════════════════════════════════════════════

> **Prerequisites**: Both `node-service` and `frontend` must be running.
> - Terminal 1: `cd node-service && npm run dev`
> - Terminal 2: `cd frontend && npm run dev`
> - Frontend: http://localhost:3000
> - Backend:  http://localhost:3001

---

## 📋 Table of Contents

1. [Landing Page](#1-landing-page)
2. [Dashboard — Live Pipeline](#2-dashboard--live-pipeline)
3. [Scan / Submit Sample](#3-scan--submit-sample)
4. [Complete / Result Entry](#4-complete--result-entry)
5. [Batch Monitoring](#5-batch-monitoring)
6. [Exception Dashboard](#6-exception-dashboard)
7. [Sample Detail Drawer](#7-sample-detail-drawer)
8. [Quick-Complete from Table](#8-quick-complete-from-table)
9. [Filters & Search](#9-filters--search)
10. [Real-Time Polling](#10-real-time-polling)
11. [End-to-End Lifecycle](#11-end-to-end-lifecycle)
12. [Edge Cases & Error Handling](#12-edge-cases--error-handling)

---

## 1. Landing Page

**URL**: http://localhost:3000

**What to test**:
- ✅ Hero section renders with gradient headline
- ✅ "🚀 Launch Dashboard" button → navigates to `/dashboard`
- ✅ "📡 Submit a Sample" button → navigates to `/dashboard/scan`
- ✅ Feature cards have hover animations (lift effect)
- ✅ Stats row shows 1,070+, 4s, 30-day, < 1ms
- ✅ Dashboard preview mockup shows fake data table
- ✅ Footer links work (Dashboard, Batches, Exceptions, Scan)
- ✅ Ambient glow orbs visible in background
- ✅ Sticky navbar with glass morphism effect

**Expected**: Premium dark-themed landing page with smooth animations.

---

## 2. Dashboard — Live Pipeline

**URL**: http://localhost:3000/dashboard

**What to test**:
- ✅ Sidebar with 5 navigation links (Live Pipeline, Batches, Exceptions, Scan/Submit, Complete/Result Entry)
- ✅ Sidebar collapse/expand button (bottom-left chevron)
- ✅ KPI cards row: Total, Pending, Assigned, Delayed, SLA Breach, Missed Batch, Completed, Errors
- ✅ Status Distribution pie chart (donut)
- ✅ Recent Breaches panel (right side)
- ✅ Sample Pipeline table with columns: Sample ID, Test, Status, ETA, SLA Deadline, Overage, Priority, Updated, Actions
- ✅ Filter bar: test name search, status dropdown, breach dropdown, missed batch dropdown
- ✅ Topbar with "Live Pipeline" title and refresh button
- ✅ "Live" badge pulsing green dot
- ✅ Skeleton loading state on first load

**Expected**: All KPI cards show 0 initially. Table shows "No samples found" empty state.

---

## 3. Scan / Submit Sample

**URL**: http://localhost:3000/dashboard/scan → Click **"Open Scan Interface"**

### Test 3a: Submit a Single Normal-Priority Sample

**Form Data**:
| Field | Value |
|---|---|
| Sample ID | `SAP-2026-001` |
| Test ID | `TID-CBC-01` |
| Test Name | `CBC` |
| Method | `Automated` |
| Specimen Type | `Blood` |
| Received At | (leave as current time) |
| Agreed TAT (hrs) | `24` |
| Priority TAT | `NORMAL` |

**Expected**:
- Toast: "1 sample(s) queued for processing"
- Green success card shows: "Queued 1 sample(s)" with sample ID `SAP-2026-001`
- Form resets to defaults
- After ~4-6 seconds, sample appears in the Dashboard table (real-time polling)

---

### Test 3b: Submit a HIGH Priority Sample

| Field | Value |
|---|---|
| Sample ID | `URG-2026-001` |
| Test ID | `TID-TROP-01` |
| Test Name | `Troponin I` |
| Method | `CLIA` |
| Specimen Type | `Serum` |
| Received At | (current time) |
| Agreed TAT (hrs) | `4` |
| Priority TAT | `HIGH` |

**Expected**:
- Toast: "1 sample(s) queued for processing"
- This sample gets BullMQ priority=1 (processed before NORMAL samples)
- In dashboard table, the Priority column shows a "HIGH" urgency badge

---

### Test 3c: Submit Multiple Samples (via separate submissions)

Submit these one after another:

**Sample 2:**
| Sample ID | Test Name | Method | Specimen | TAT (hrs) | Priority |
|---|---|---|---|---|---|
| `SAP-2026-002` | `LFT` | `Photometry` | `Serum` | `48` | `NORMAL` |

**Sample 3:**
| Sample ID | Test Name | Method | Specimen | TAT (hrs) | Priority |
|---|---|---|---|---|---|
| `SAP-2026-003` | `KFT` | `Photometry` | `Serum` | `24` | `NORMAL` |

**Sample 4:**
| Sample ID | Test Name | Method | Specimen | TAT (hrs) | Priority |
|---|---|---|---|---|---|
| `SAP-2026-004` | `TSH` | `CLIA` | `Serum` | `24` | `NORMAL` |

**Sample 5:**
| Sample ID | Test Name | Method | Specimen | TAT (hrs) | Priority |
|---|---|---|---|---|---|
| `SAP-2026-005` | `Vitamin D` | `CLIA` | `Serum` | `72` | `NORMAL` |

**Expected**: Dashboard KPI "Total Samples" should show 6 (including URG-2026-001)

---

### Test 3d: Submit a Sample That Will Breach SLA

Submit a sample with a very short TAT and a past `received_at`:

| Field | Value |
|---|---|
| Sample ID | `BREACH-001` |
| Test Name | `HbA1c` |
| Method | `HPLC` |
| Specimen Type | `Blood` |
| Received At | `2026-03-28T08:00` (yesterday morning) |
| Agreed TAT (hrs) | `4` |
| Priority TAT | `NORMAL` |

**Expected**:
- Sample gets SLA breach flag (ETA will far exceed the 4-hour SLA deadline)
- Dashboard "SLA Breach" KPI card increments
- Recent Breaches panel shows `BREACH-001`
- Overage column in table shows red value like `+XXh XXm`
- Exception Dashboard gets SLA_BREACH alert

---

### Test 3e: Validation Error — Empty Fields

Open Scan Drawer and try to submit with empty Sample ID and Test Name.

**Expected**:
- Toast error: "Sample ID and Test Name are required"
- Form does NOT submit

---

## 4. Complete / Result Entry

**URL**: http://localhost:3000/dashboard/result → Click **"Mark Sample Complete"**

### Test 4a: Complete a Sample

| Field | Value |
|---|---|
| Sample ID | `SAP-2026-001` |
| Test Name | `CBC` |
| Result Ready At | (current time) |

**Expected**:
- Toast: "Sample marked as completed"
- Green card shows: "Sample marked as completed" with ID `SAP-2026-001`
- Form resets
- After polling (~6s), dashboard table shows `SAP-2026-001` with status "completed"
- Dashboard KPI "Completed" count increments

---

### Test 4b: Complete the Breached Sample

| Field | Value |
|---|---|
| Sample ID | `BREACH-001` |
| Test Name | `HbA1c` |
| Result Ready At | (current time) |

**Expected**:
- Toast: "Sample marked as completed"
- Worker calculates `actual_tat_minutes`, `completed_within_sla = false` (because it breached)
- In sample detail drawer, you'll see the full TAT timeline

---

### Test 4c: Duplicate Result (Idempotency)

Submit the **exact same** result again:
| Sample ID | `SAP-2026-001` | Test Name | `CBC` |

**Expected**:
- Backend returns 202 with message "Already received — duplicate ignored"
- Toast will show success (the frontend accepts 202 gracefully)

---

### Test 4d: Result for Non-Existent Sample

| Field | Value |
|---|---|
| Sample ID | `DOES-NOT-EXIST` |
| Test Name | `SomeTest` |
| Result Ready At | (current time) |

**Expected**:
- Backend queues the job, but worker will fail to find the sample
- Worker will retry (up to 5 times) then job goes to failed state
- Frontend shows toast success (because the webhook accepts it), but no dashboard change

---

## 5. Batch Monitoring

**URL**: http://localhost:3000/dashboard/batches

**What to test** (after submitting samples above):
- ✅ Summary row: Total Batches count, Breached Samples, Missed Batches
- ✅ Batch cards showing batch_id, run start, cutoff, sample count, breach count, breach rate bar
- ✅ Date filter input: enter `2026-03-29` to filter batches for today
- ✅ Clear button resets filter
- ✅ High-risk badge appears on batches with >50% breach rate
- ✅ Average overage shown on breached batches

**Expected**: Cards appear for each unique batch_id. Each card shows metrics.

---

## 6. Exception Dashboard

**URL**: http://localhost:3000/dashboard/exceptions

**What to test**:
- ✅ KPI cards: 🚨 SLA Breach count, ⚠️ Missed Batch count, 🟠 Delay Escalation count
- ✅ Filter buttons: All / SLA BREACH / MISSED BATCH / DELAY ESCALATION
- ✅ Alert list: each alert card has left-colored border, type badge, sample ID, test name, overage, reason, recommended action
- ✅ "Active Exceptions" heading with Live badge

**Filtering**:
- Click **SLA BREACH** → only SLA_BREACH alerts shown
- Click **MISSED BATCH** → only MISSED_BATCH alerts shown
- Click **All** → all alerts shown

**Expected**: After submitting BREACH-001, at least one SLA_BREACH alert should appear.

---

## 7. Sample Detail Drawer

**URL**: http://localhost:3000/dashboard → Click any sample row

**What to test**:
- ✅ Drawer slides in from right with sample ID and test name header
- ✅ Status badge + Urgency badge + Missed Batch badge (if applicable)
- ✅ Alert banner (red) if sample is breached or missed batch
- ✅ **Audit Timeline** with 5 steps:
  1. 📥 Sample Received (with timestamp)
  2. 📋 / ⚠️ Batch Assigned (with cutoff time)
  3. 🏭 Batch Run Start
  4. ⏰ SLA Deadline
  5. ✅ / 🚨 ETA (Result)
- ✅ **Sample Details** section: Test Code, Test ID, Method, Specimen, Priority TAT, Agreed TAT, Batch ID, Batch Cutoff, Batch Run, Created, Last Updated
- ✅ Green checkmark "On schedule — No SLA risk detected" (for non-breached assigned samples)
- ✅ Overage display for breached samples
- ✅ Delay reason for missed-batch samples
- ✅ Close button

**Test with**:
- Click `SAP-2026-001` → Should show completed status
- Click `BREACH-001` → Should show red alert banner with overage

---

## 8. Quick-Complete from Table

**URL**: http://localhost:3000/dashboard

In the Sample Pipeline table, each row has a ✅ checkmark button in the "Actions" column.

**Test**: Click the ✅ button on `SAP-2026-002` (LFT).

**Expected**:
- Toast: "Sample marked as completed"
- Uses current timestamp as `result_ready_at`
- Stats refresh automatically
- Row status updates to "completed" on next poll

**Test**: Click ✅ on an already-completed sample.

**Expected**:
- Toast error: "Sample is already completed"
- Button appears disabled (50% opacity, cursor: not-allowed)

---

## 9. Filters & Search

**URL**: http://localhost:3000/dashboard

### Test 9a: Filter by Status

| Filter | Expected |
|---|---|
| "Assigned" | Only samples with status=assigned show |
| "Completed" | Only completed samples show |
| "Delayed" | Only delayed samples show |
| "Pending" | Should be empty (worker processes quickly) |
| "Error" | Shows samples that failed processing |
| "All Status" | Shows all samples |

### Test 9b: Filter by Breach

| Filter | Expected |
|---|---|
| "Breached" | Only samples where breach_flag=true |
| "Not Breached" | Only samples where breach_flag=false |
| "All Breach" | Shows all samples |

### Test 9c: Filter by Missed Batch

| Filter | Expected |
|---|---|
| "Missed Batch" | Only samples where missed_batch=true |
| "All Batches" | Shows all samples |

### Test 9d: Search by Test Name

Type `CBC` in the search input.
**Expected**: Only samples with test_name containing "CBC" appear (case-insensitive regex search).

Type `KFT` → KFT samples only.
Clear the input → all samples return.

---

## 10. Real-Time Polling

**How to test**: Open two browser tabs.

**Tab 1**: http://localhost:3000/dashboard
**Tab 2**: http://localhost:3000/dashboard/scan

In Tab 2, submit a new sample:
| Sample ID | `LIVE-001` | Test Name | `FBS` | Method | `GOD-POD` | Specimen | `Plasma` | TAT | `12` |

**Expected in Tab 1** (without refreshing):
- After ~6 seconds, `LIVE-001` appears in the sample table
- KPI "Total Samples" increments
- Pie chart updates

**Test tab visibility**: Switch to a different tab (hide Tab 1).
- Polling pauses (saves bandwidth).
- Switch back to Tab 1.
- Polling resumes immediately with a fresh fetch.

---

## 11. End-to-End Lifecycle

This is the **master test** — the complete lifecycle from SAP intake to result completion:

### Step 1: Submit Sample
Go to `/dashboard/scan` → Open Scan Interface:
| Sample ID | `E2E-001` |
| Test Name | `TSH` |
| Method | `CLIA` |
| Specimen | `Serum` |
| Received At | `2026-03-29T10:00` (earlier today) |
| Agreed TAT | `24` |
| Priority | `NORMAL` |

**Expected**: Toast "1 sample(s) queued for processing"

### Step 2: Verify in Dashboard
Go to `/dashboard` → wait ~6 seconds.
**Expected**: `E2E-001` appears in the table with status `assigned` (or `delayed` if it missed a batch).

### Step 3: Check KPI Stats
**Expected**: Total Samples, Assigned, possibly Breached/Missed counters update.

### Step 4: Check Batches
Go to `/dashboard/batches`
**Expected**: A batch card exists containing `E2E-001`.

### Step 5: Check Exceptions
Go to `/dashboard/exceptions`
**Expected**: If `E2E-001` breached SLA or missed batch, alerts appear here.

### Step 6: View Sample Detail
Go to `/dashboard` → Click `E2E-001` row.
**Expected**: Drawer opens with full audit timeline showing:
- Received time
- Batch assignment
- Batch run start
- SLA deadline
- ETA

### Step 7: Submit Result
Go to `/dashboard/result` → Open Result Drawer:
| Sample ID | `E2E-001` |
| Test Name | `TSH` |
| Result Ready At | (current time) |

**Expected**: Toast "Sample marked as completed"

### Step 8: Verify Completion
Go to `/dashboard`:
- `E2E-001` status changes to `completed`
- KPI "Completed" count increments
- If you click the row, drawer shows the completed timestamp

### Step 9: Check Updated Exceptions
Go to `/dashboard/exceptions`:
**Expected**: A `RESULT_COMPLETED` alert exists for `E2E-001`.

### Step 10: Verify Idempotency
Go to `/dashboard/result` and submit same result for `E2E-001` / `TSH` again.
**Expected**: Backend returns "Already received — duplicate ignored" — no error.

---

## 12. Edge Cases & Error Handling

### Test 12a: Backend Not Running
Stop the node-service and try to load the dashboard.

**Expected**:
- KPI cards show skeleton loading state
- Tables show empty state
- SmartPoller backs off exponentially (4s → 8s → 16s... up to 60s)
- Connection status changes to "reconnecting"
- When backend starts again, polling auto-recovers

### Test 12b: Network Goes Offline
Open Dashboard, then disconnect your network (airplane mode or disable WiFi).

**Expected**:
- Poller detects `offline` event
- No more failed requests pile up
- When network restores (`online` event), polling resumes immediately

### Test 12c: Sidebar Collapse/Expand
Click the chevron button at bottom of sidebar.
**Expected**: Sidebar collapses to icon-only mode. Labels and badges hide. Click again to expand.

### Test 12d: Manual Refresh
Click the refresh ↻ button in any page's topbar.
**Expected**: Loading spinner appears, data refreshes, spinner stops.

---

## Quick Reference: All Sample Data for Testing

```
┌─────────────────┬─────────────┬────────────┬──────────┬──────────┬──────────┐
│ Sample ID       │ Test Name   │ Method     │ Specimen │ TAT(hrs) │ Priority │
├─────────────────┼─────────────┼────────────┼──────────┼──────────┼──────────┤
│ SAP-2026-001    │ CBC         │ Automated  │ Blood    │ 24       │ NORMAL   │
│ URG-2026-001    │ Troponin I  │ CLIA       │ Serum    │ 4        │ HIGH     │
│ SAP-2026-002    │ LFT         │ Photometry │ Serum    │ 48       │ NORMAL   │
│ SAP-2026-003    │ KFT         │ Photometry │ Serum    │ 24       │ NORMAL   │
│ SAP-2026-004    │ TSH         │ CLIA       │ Serum    │ 24       │ NORMAL   │
│ SAP-2026-005    │ Vitamin D   │ CLIA       │ Serum    │ 72       │ NORMAL   │
│ BREACH-001      │ HbA1c       │ HPLC       │ Blood    │ 4        │ NORMAL   │
│ LIVE-001        │ FBS         │ GOD-POD    │ Plasma   │ 12       │ NORMAL   │
│ E2E-001         │ TSH         │ CLIA       │ Serum    │ 24       │ NORMAL   │
└─────────────────┴─────────────┴────────────┴──────────┴──────────┴──────────┘

Result Completion Data:
┌─────────────────┬─────────────┬──────────────────────────────┐
│ Sample ID       │ Test Name   │ Result Ready At              │
├─────────────────┼─────────────┼──────────────────────────────┤
│ SAP-2026-001    │ CBC         │ (keep as current timestamp)  │
│ BREACH-001      │ HbA1c       │ (keep as current timestamp)  │
│ E2E-001         │ TSH         │ (keep as current timestamp)  │
└─────────────────┴─────────────┴──────────────────────────────┘
```

---

## Feature Coverage Checklist

| # | Feature | Frontend Page | Backend API | Status |
|---|---|---|---|---|
| 1 | Health Check | — (not displayed) | `GET /health` | ✅ API exists |
| 2 | Single Sample Submit | `/dashboard/scan` → ScanDrawer | `POST /webhook` | ✅ Works |
| 3 | Multi-Test Submit | ScanDrawer (one at a time) | `POST /webhook` `{tests:[]}` | ⚠️ No bulk UI |
| 4 | Validation Errors | Toast + client-side | Backend 400 | ✅ Works |
| 5 | Result Completion | `/dashboard/result` → ResultDrawer | `POST /webhook/result` | ✅ Works |
| 6 | Duplicate Detection | Toast message | Redis idempotency | ✅ Works |
| 7 | List Samples | `/dashboard` table | `GET /api/samples` | ✅ Works |
| 8 | Filter by Status | Status dropdown | `?status=` | ✅ Works |
| 9 | Filter by Breach | Breach dropdown | `?breach=true` | ✅ Works |
| 10 | Filter by Missed | Missed dropdown | `?missed=true` | ✅ Works |
| 11 | Search by Test Name | Text input | `?test_name=` | ✅ Works |
| 12 | Sample Detail | SampleDetailDrawer | `GET /api/samples/:id` | ✅ Works |
| 13 | Dashboard Stats | StatsGrid + PieChart | `GET /api/stats` | ✅ Works |
| 14 | Batch Monitoring | `/dashboard/batches` | `GET /api/batches` | ✅ Works |
| 15 | Date Filter Batches | Date input | `?date=YYYY-MM-DD` | ✅ Works |
| 16 | Alerts List | `/dashboard/exceptions` | `GET /api/alerts` | ✅ Works |
| 17 | Alert Type Filter | Filter buttons | `?type=SLA_BREACH` | ✅ Works |
| 18 | Alert Summary | KPI cards on exceptions page | `GET /api/alerts/summary` | ✅ Works |
| 19 | Real-Time Polling | SmartPoller + useLiveData | All GET endpoints | ✅ Works |
| 20 | Quick-Complete | ✅ button in table | `POST /webhook/result` | ✅ Works |
| 21 | Pagination | Page 1 only (no controls) | `?page=&limit=` | ⚠️ Missing UI |
| 22 | Result Metrics | Not displayed yet | `result_metrics` in stats | ⚠️ Missing UI |
| 23 | RESULT_COMPLETED alerts | Type not recognized | Backend fires them | ⚠️ Missing type |
| 24 | Bulk test submit | No bulk form | `{tests:[...]}` supported | ℹ️ API-only |
| 25 | Custom batch_windows | No form field | Webhook supports it | ℹ️ API-only |

---

*Generated for Aspira TAT Monitor v3.0*
*Last updated: 2026-03-29*
