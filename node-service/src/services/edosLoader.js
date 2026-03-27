// ─── EDOS Loader ────────────────────────────────────────────────
// Reads the EDOS CSV, parses schedule + TAT fields, and provides
// an in-memory lookup Map plus optional Redis cache.
// ────────────────────────────────────────────────────────────────
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const { parseSchedule } = require('../utils/scheduleParser');
const { parseTAT } = require('../utils/tatParser');
const logger = require('../utils/logger');

/** In-memory lookup: test_name (lowercase) → edos record */
const edosMap = new Map();

/** In-memory lookup: test_code (lowercase) → edos record */
const edosCodeMap = new Map();

const CSV_PATH = path.resolve(__dirname, '../../..', 'python-service', 'config', 'Edos List.csv');
const JSON_PATH = path.resolve(__dirname, '../../data/edos.json');

/**
 * Load EDOS data from CSV into memory.
 * Optionally writes edos.json for inspection.
 * @param {import('ioredis').Redis} [redis] – optional, to cache in Redis hash
 */
function loadEdos(redis) {
  return new Promise((resolve, reject) => {
    const records = [];
    let lineNum = 0;

    fs.createReadStream(CSV_PATH)
      .pipe(csv({
        skipLines: 1,  // Skip the "Edos List,,,,,,,,,,," title row
        mapHeaders: ({ header }) => header.trim().toLowerCase(),
      }))
      .on('data', (row) => {
        lineNum++;

        const testCode = (row['test code'] || '').trim();
        const testName = (row['test name'] || '').trim();
        const schedule = (row['test schedule'] || '').trim();
        const tat = (row['tat'] || '').trim();

        if (!testName) return; // skip empty rows

        const record = {
          row_num:       parseInt(row['#'], 10) || lineNum,
          state:         (row['state'] || '').trim(),
          city:          (row['city'] || '').trim(),
          test_code:     testCode,
          test_name:     testName,
          mrp:           parseFloat(row['mrp']) || 0,
          group:         (row['group'] || '').trim(),
          specimen_type: (row['specimen type'] || '').trim(),
          method:        (row['method'] || '').trim(),
          temp:          (row['temp'] || '').trim(),
          schedule_raw:  schedule,
          tat_raw:       tat,
          schedule:      parseSchedule(schedule),
          tat:           parseTAT(tat),
        };

        records.push(record);
        edosMap.set(testName.toLowerCase(), record);
        if (testCode) {
          edosCodeMap.set(testCode.toLowerCase(), record);
        }
      })
      .on('end', async () => {
        logger.success(`EDOS loaded: ${records.length} test records parsed`);

        // Write JSON for inspection
        try {
          const dataDir = path.dirname(JSON_PATH);
          if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
          fs.writeFileSync(JSON_PATH, JSON.stringify(records, null, 2));
          logger.info(`EDOS JSON written to ${JSON_PATH}`);
        } catch (err) {
          logger.warn(`Could not write edos.json: ${err.message}`);
        }

        // Cache in Redis if available
        if (redis) {
          try {
            const pipeline = redis.pipeline();
            for (const rec of records) {
              pipeline.hset('edos:tests', rec.test_name.toLowerCase(), JSON.stringify(rec));
              if (rec.test_code) {
                pipeline.hset('edos:codes', rec.test_code.toLowerCase(), JSON.stringify(rec));
              }
            }
            await pipeline.exec();
            logger.info('EDOS cached in Redis');
          } catch (err) {
            logger.warn(`Redis EDOS cache failed: ${err.message}`);
          }
        }

        resolve(records);
      })
      .on('error', (err) => {
        logger.error(`EDOS CSV read error: ${err.message}`);
        reject(err);
      });
  });
}

/**
 * Lookup a test by name or code (case-insensitive).
 */
function lookupTest(testName, testCode) {
  if (testName && edosMap.has(testName.toLowerCase())) {
    return edosMap.get(testName.toLowerCase());
  }
  if (testCode && edosCodeMap.has(testCode.toLowerCase())) {
    return edosCodeMap.get(testCode.toLowerCase());
  }
  return null;
}

/** Get the full in-memory map */
function getEdosMap() { return edosMap; }

module.exports = { loadEdos, lookupTest, getEdosMap };
