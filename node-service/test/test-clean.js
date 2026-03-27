// Quick no-color test runner
process.env.FORCE_COLOR = '0';
const { assignBatch } = require('../src/services/batchAssigner');
const { lookupTest, loadEdos } = require('../src/services/edosLoader');
const { parseSchedule } = require('../src/utils/scheduleParser');
const { parseTAT } = require('../src/utils/tatParser');

let passed = 0, failed = 0;
function assert(c, l) { if(c){console.log('  PASS: '+l);passed++;}else{console.log('  FAIL: '+l);failed++;} }

async function run() {
  await loadEdos();

  console.log('\nTEST 1: Normal Batch Assignment (test_1)');
  const edos1 = lookupTest('test_1');
  assert(edos1 !== null, 'EDOS lookup found test_1');
  assert(edos1.test_code === 'ELISA023', 'Correct test_code');
  assert(edos1.schedule.days.includes(2) && edos1.schedule.days.includes(5), 'Schedule: Tue/Fri');
  assert(edos1.schedule.cutoff_hour === 18, 'Cutoff: 6pm');
  assert(edos1.tat.tat_minutes === 1440, 'TAT: 1440 min');
  assert(edos1.tat.deadline_hour === 20, 'Deadline: 8pm');
  const r1 = assignBatch({sample_id:'T1',received_at:'2026-03-31T14:00:00+05:30',agreed_tat_hours:30,test_name:'test_1'}, edos1);
  assert(!r1.missed_batch, 'No missed batch');
  assert(r1.batch_id.includes('ELISA023'), 'Batch ID has test code');
  console.log('  -> Batch:', r1.batch_id, 'ETA:', r1.eta.toISOString(), 'Breach:', r1.breach_flag);

  console.log('\nTEST 2: Missed Batch (after cutoff)');
  const r2 = assignBatch({sample_id:'T2',received_at:'2026-03-31T21:00:00+05:30',agreed_tat_hours:12,test_name:'test_1'}, edos1);
  assert(r2.missed_batch === true, 'Missed batch detected');
  assert(r2.delay_reason.length > 0, 'Has delay reason');
  console.log('  -> Reason:', r2.delay_reason, 'Next batch:', r2.batch_id);

  console.log('\nTEST 3: SLA Breach');
  const edos6 = lookupTest('test_6');
  assert(edos6 !== null, 'EDOS found test_6');
  const r3 = assignBatch({sample_id:'T3',received_at:'2026-03-27T14:00:00+05:30',agreed_tat_hours:4,test_name:'test_6'}, edos6);
  assert(r3.breach_flag === true, 'Breach detected');
  assert(r3.overage_minutes > 0, 'Overage > 0');
  console.log('  -> Overage:', r3.overage_minutes, 'min');

  console.log('\nTEST 4: Same-Day TAT (test_13)');
  const edos13 = lookupTest('test_13');
  assert(edos13 !== null, 'EDOS found test_13');
  const r4 = assignBatch({sample_id:'T4',received_at:'2026-03-27T10:00:00+05:30',agreed_tat_hours:12,test_name:'test_13'}, edos13);
  assert(!r4.missed_batch, 'No missed batch');
  console.log('  -> ETA:', r4.eta.toISOString(), 'Breach:', r4.breach_flag);

  console.log('\nTEST 5: Schedule Parser');
  assert(parseSchedule('Daily 6 pm').days.length === 7, 'Daily = 7 days');
  assert(parseSchedule('Daily 6 pm').cutoff_hour === 18, 'Daily 6pm cutoff');
  assert(parseSchedule('Tue / Fri 6 pm').days.length === 2, 'Tue/Fri = 2 days');
  assert(parseSchedule('Daily 9 am to 8 pm').cutoff_hour === 20, 'Range cutoff');
  assert(parseSchedule('Daily 9 am to 8 pm').open_hour === 9, 'Range open');
  assert(parseSchedule('Mon to Fri 3 pm').days.length === 5, 'Mon-Fri = 5 days');

  console.log('\nTEST 6: TAT Parser');
  assert(parseTAT('Same Day').tat_minutes === 0, 'Same Day = 0');
  assert(parseTAT('Same Day 5 Hrs').tat_minutes === 300, '5 Hrs = 300');
  assert(parseTAT('Next Day 8 pm').tat_minutes === 1440, 'Next Day = 1440');
  assert(parseTAT('Next Day 8 pm').deadline_hour === 20, 'Next Day 8pm');
  assert(parseTAT('3rd Day 5 pm').tat_minutes === 4320, '3rd Day = 4320');
  assert(parseTAT('22 Days').tat_minutes === 31680, '22 Days');
  assert(parseTAT('48 Hrs').tat_minutes === 2880, '48 Hrs');

  console.log('\n========================================');
  console.log('RESULTS: ' + passed + ' passed, ' + failed + ' failed');
  console.log('========================================');
  process.exit(failed > 0 ? 1 : 0);
}
run().catch(e => { console.error(e); process.exit(1); });
