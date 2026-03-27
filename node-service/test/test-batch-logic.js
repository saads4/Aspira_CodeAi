// ─── Integration Test: Batch Assignment Logic ──────────────────
// Runs without Redis/MongoDB — tests pure computation
// ────────────────────────────────────────────────────────────────
const { assignBatch } = require('../src/services/batchAssigner');
const { lookupTest, loadEdos } = require('../src/services/edosLoader');
const { parseSchedule } = require('../src/utils/scheduleParser');
const { parseTAT } = require('../src/utils/tatParser');
const logger = require('../src/utils/logger');

let passed = 0;
let failed = 0;

function assert(condition, label) {
  if (condition) {
    console.log(`  ✅ ${label}`);
    passed++;
  } else {
    console.log(`  ❌ ${label}`);
    failed++;
  }
}

async function runTests() {
  // Load EDOS (no Redis)
  await loadEdos();

  console.log('\n══════════════════════════════════════════════════');
  console.log('  TEST 1: Normal Batch Assignment (test_1)');
  console.log('══════════════════════════════════════════════════');
  {
    const edos = lookupTest('test_1');
    assert(edos !== null, 'EDOS lookup found test_1');
    assert(edos.test_code === 'ELISA023', 'Correct test_code');
    assert(edos.schedule.days.includes(2) && edos.schedule.days.includes(5), 'Schedule: Tue/Fri');
    assert(edos.schedule.cutoff_hour === 18, 'Cutoff: 6 pm');
    assert(edos.tat.tat_minutes === 1440, 'TAT: 1440 min (next day)');
    assert(edos.tat.deadline_hour === 20, 'Deadline hour: 8 pm');

    // Simulate: received Tuesday at 2pm IST (before cutoff)
    const sample = {
      sample_id: 'TEST-001',
      received_at: '2026-03-31T14:00:00+05:30', // Tuesday
      agreed_tat_hours: 30,
      test_name: 'test_1',
    };
    const result = assignBatch(sample, edos);
    assert(result.batch_id.includes('ELISA023'), 'Batch ID contains test code');
    assert(result.missed_batch === false, 'No missed batch');
    assert(result.eta instanceof Date, 'ETA is a Date');
    assert(result.sla_deadline instanceof Date, 'SLA deadline is a Date');
    console.log(`    Batch: ${result.batch_id}`);
    console.log(`    ETA: ${result.eta.toISOString()}`);
    console.log(`    SLA: ${result.sla_deadline.toISOString()}`);
    console.log(`    Breach: ${result.breach_flag} | Overage: ${result.overage_minutes} min`);
  }

  console.log('\n══════════════════════════════════════════════════');
  console.log('  TEST 2: Missed Batch (received after cutoff)');
  console.log('══════════════════════════════════════════════════');
  {
    const edos = lookupTest('test_1');

    // Received Tuesday at 9pm (after 6pm cutoff)
    const sample = {
      sample_id: 'TEST-002',
      received_at: '2026-03-31T21:00:00+05:30', // Tuesday 9pm
      agreed_tat_hours: 12,
      test_name: 'test_1',
    };
    const result = assignBatch(sample, edos);
    assert(result.missed_batch === true, 'Missed batch detected');
    assert(result.delay_reason.length > 0, 'Delay reason populated');
    console.log(`    Reason: ${result.delay_reason}`);
    console.log(`    Next batch: ${result.batch_id}`);
    console.log(`    Breach: ${result.breach_flag} | Overage: ${result.overage_minutes} min`);
  }

  console.log('\n══════════════════════════════════════════════════');
  console.log('  TEST 3: SLA Breach (tight agreed_tat_hours)');
  console.log('══════════════════════════════════════════════════');
  {
    // test_6 = "Daily 3 pm" cutoff, "3rd day 5 pm" TAT
    const edos = lookupTest('test_6');
    assert(edos !== null, 'EDOS lookup found test_6');

    const sample = {
      sample_id: 'TEST-003',
      received_at: '2026-03-27T14:00:00+05:30',
      agreed_tat_hours: 4, // Very tight — will breach
      test_name: 'test_6',
    };
    const result = assignBatch(sample, edos);
    assert(result.breach_flag === true, 'SLA breach detected');
    assert(result.overage_minutes > 0, 'Overage is positive');
    console.log(`    ETA: ${result.eta.toISOString()}`);
    console.log(`    SLA: ${result.sla_deadline.toISOString()}`);
    console.log(`    Overage: ${result.overage_minutes} min`);
  }

  console.log('\n══════════════════════════════════════════════════');
  console.log('  TEST 4: Same-Day TAT (test_13 — "Same Day")');
  console.log('══════════════════════════════════════════════════');
  {
    const edos = lookupTest('test_13');
    assert(edos !== null, 'EDOS lookup found test_13');
    assert(edos.schedule_raw.includes('Daily'), 'Daily schedule');

    const sample = {
      sample_id: 'TEST-004',
      received_at: '2026-03-27T10:00:00+05:30',
      agreed_tat_hours: 12,
      test_name: 'test_13',
    };
    const result = assignBatch(sample, edos);
    assert(result.missed_batch === false, 'No missed batch');
    console.log(`    Batch: ${result.batch_id}`);
    console.log(`    ETA: ${result.eta.toISOString()}`);
    console.log(`    Breach: ${result.breach_flag}`);
  }

  console.log('\n══════════════════════════════════════════════════');
  console.log('  TEST 5: Schedule Parser Edge Cases');
  console.log('══════════════════════════════════════════════════');
  {
    const s1 = parseSchedule('Daily 6 pm');
    assert(s1.days.length === 7, '"Daily 6 pm" → 7 days');
    assert(s1.cutoff_hour === 18, '"Daily 6 pm" → cutoff 18');

    const s2 = parseSchedule('Tue / Fri 6 pm');
    assert(s2.days.includes(2) && s2.days.includes(5), '"Tue / Fri" → [2,5]');

    const s3 = parseSchedule('Daily 9 am to 8 pm');
    assert(s3.cutoff_hour === 20, '"9 am to 8 pm" → cutoff 20');
    assert(s3.open_hour === 9, '"9 am to 8 pm" → open 9');

    const s4 = parseSchedule('Mon / Wed / Fri 6 pm');
    assert(s4.days.length === 3, '"Mon/Wed/Fri" → 3 days');

    const s5 = parseSchedule('Mon to Fri 3 pm');
    assert(s5.days.length === 5, '"Mon to Fri" → 5 days');
    assert(s5.cutoff_hour === 15, '"Mon to Fri 3 pm" → cutoff 15');
  }

  console.log('\n══════════════════════════════════════════════════');
  console.log('  TEST 6: TAT Parser Edge Cases');
  console.log('══════════════════════════════════════════════════');
  {
    const t1 = parseTAT('Same Day');
    assert(t1.tat_minutes === 0, '"Same Day" → 0 min');

    const t2 = parseTAT('Same Day 5 Hrs');
    assert(t2.tat_minutes === 300, '"Same Day 5 Hrs" → 300 min');

    const t3 = parseTAT('Next Day 8 pm');
    assert(t3.tat_minutes === 1440, '"Next Day 8 pm" → 1440 min');
    assert(t3.deadline_hour === 20, '"Next Day 8 pm" → deadline 20');

    const t4 = parseTAT('3rd Day 5 pm');
    assert(t4.tat_minutes === 4320, '"3rd Day 5 pm" → 4320 min');
    assert(t4.deadline_hour === 17, '"3rd Day 5 pm" → deadline 17');

    const t5 = parseTAT('22 Days');
    assert(t5.tat_minutes === 31680, '"22 Days" → 31680 min');

    const t6 = parseTAT('48 Hrs');
    assert(t6.tat_minutes === 2880, '"48 Hrs" → 2880 min');
  }

  console.log('\n══════════════════════════════════════════════════');
  console.log(`  RESULTS: ${passed} passed, ${failed} failed`);
  console.log('══════════════════════════════════════════════════\n');

  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch((err) => {
  console.error('Test error:', err);
  process.exit(1);
});
