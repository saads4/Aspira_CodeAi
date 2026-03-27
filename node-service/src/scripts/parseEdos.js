// ─── EDOS Parse Script ──────────────────────────────────────────
// One-shot script to parse the EDOS CSV and generate edos.json
// Run: node src/scripts/parseEdos.js
// ────────────────────────────────────────────────────────────────
const { loadEdos } = require('../services/edosLoader');
const logger = require('../utils/logger');

async function main() {
  logger.info('Parsing EDOS CSV...');
  const records = await loadEdos(); // no Redis, just in-memory + JSON file
  logger.success(`Done. ${records.length} records written to data/edos.json`);
  process.exit(0);
}

main().catch((err) => {
  logger.error(`Parse failed: ${err.message}`);
  process.exit(1);
});
