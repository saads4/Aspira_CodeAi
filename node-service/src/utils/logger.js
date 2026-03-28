// ─── Logger Utility (colour-coded console) ──────────────────────
const chalk = require('chalk');
const { DateTime } = require('luxon');

function ts() {
  return DateTime.now().setZone('Asia/Kolkata').toFormat('yyyy-MM-dd HH:mm:ss');
}

const logger = {
  info:    (msg) => console.log(chalk.blueBright(`[INFO]    ${ts()}  ${msg}`)),
  success: (msg) => console.log(chalk.green(`[SUCCESS] ${ts()}  ${msg}`)),
  warn:    (msg) => console.log(chalk.yellow(`[WARN]    ${ts()}  ${msg}`)),
  error:   (msg) => console.log(chalk.red(`[ERROR]   ${ts()}  ${msg}`)),
  alert:   (msg) => console.log(chalk.magentaBright(`[ALERT]   ${ts()}  ${msg}`)),

  // Special alert boxes for the terminal
  missedBatch: (data) => {
    console.log('');
    console.log(chalk.bgRed.white.bold(' 🚨 MISSED BATCH ALERT '));
    console.log(chalk.red('─'.repeat(60)));
    console.log(chalk.red(`  Sample ID   : ${data.sample_id}`));
    console.log(chalk.red(`  Test Name   : ${data.test_name}`));
    console.log(chalk.red(`  Priority    : ${data.priority || 'NORMAL'}`));
    console.log(chalk.red(`  Received At : ${data.received_at}`));
    console.log(chalk.red(`  Batch       : ${data.batch_id}`));
    console.log(chalk.red(`  Batch Run   : ${data.batch_run_start}`));
    console.log(chalk.red(`  ETA         : ${data.eta}`));
    console.log(chalk.red(`  SLA Deadline: ${data.sla_deadline}`));
    console.log(chalk.red(`  Overage     : ${data.overage_minutes} min`));
    console.log(chalk.red(`  Reason      : ${data.reason}`));
    console.log(chalk.red(`  Action      : ${data.recommended_action}`));
    console.log(chalk.red('─'.repeat(60)));
    console.log('');
  },

  slaBreach: (data) => {
    console.log('');
    console.log(chalk.bgYellow.black.bold(' ⚠️  SLA BREACH ALERT '));
    console.log(chalk.yellow('─'.repeat(60)));
    console.log(chalk.yellow(`  Sample ID   : ${data.sample_id}`));
    console.log(chalk.yellow(`  Test Name   : ${data.test_name}`));
    console.log(chalk.yellow(`  Priority    : ${data.priority || 'NORMAL'}`));
    console.log(chalk.yellow(`  Received At : ${data.received_at}`));
    console.log(chalk.yellow(`  Batch       : ${data.batch_id}`));
    console.log(chalk.yellow(`  Batch Run   : ${data.batch_run_start}`));
    console.log(chalk.yellow(`  ETA         : ${data.eta}`));
    console.log(chalk.yellow(`  SLA Deadline: ${data.sla_deadline}`));
    console.log(chalk.yellow(`  Overage     : ${data.overage_minutes} min`));
    console.log(chalk.yellow(`  Reason      : ETA exceeds SLA deadline`));
    console.log(chalk.yellow(`  Action      : ${data.recommended_action}`));
    console.log(chalk.yellow('─'.repeat(60)));
    console.log('');
  },

  delayEscalation: (data) => {
    console.log('');
    console.log(chalk.bgMagenta.white.bold(' 🟠 DELAY ESCALATION '));
    console.log(chalk.magenta('─'.repeat(60)));
    console.log(chalk.magenta(`  Sample ID   : ${data.sample_id}`));
    console.log(chalk.magenta(`  Test Name   : ${data.test_name}`));
    console.log(chalk.magenta(`  Reason      : ${data.reason}`));
    console.log(chalk.magenta(`  Action      : ${data.recommended_action}`));
    console.log(chalk.magenta('─'.repeat(60)));
    console.log('');
  },

  resultCompleted: (data) => {
    console.log('');
    console.log(chalk.bgGreen.black.bold(' ✅ RESULT COMPLETED '));
    console.log(chalk.green('─'.repeat(60)));
    console.log(chalk.green(`  Sample ID          : ${data.sample_id}`));
    console.log(chalk.green(`  Test Name          : ${data.test_name}`));
    console.log(chalk.green(`  Received At        : ${data.received_at}`));
    console.log(chalk.green(`  ETA                : ${data.eta}`));
    console.log(chalk.green(`  SLA Deadline       : ${data.sla_deadline}`));
    console.log(chalk.green(`  Result Ready At    : ${data.result_ready_at}`));
    console.log(chalk.green(`  Actual TAT         : ${data.actual_tat_minutes} min`));
    console.log(chalk.green(`  Within SLA         : ${data.completed_within_sla}`));
    console.log(chalk.green(`  Prediction Error   : ${data.prediction_error_minutes} min`));
    console.log(chalk.green('─'.repeat(60)));
    console.log('');
  },
};

module.exports = logger;
