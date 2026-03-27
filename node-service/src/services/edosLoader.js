// ─── EDOS Loader ────────────────────────────────────────────────
// Reads the EDOS CSV, parses schedule + TAT fields, and provides
// an in-memory lookup Map plus optional Redis cache.
//
// Fallback chain:
//   1. CSV file  (Edos List.csv in root)
//   2. JSON file (data/edos.json) — pre-generated
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

const CSV_PATH = path.resolve(__dirname, '../../..', 'Edos List.csv');
const JSON_PATH = path.resolve(__dirname, '../../data/edos.json');

/**
 * Populate the in-memory maps from an array of parsed records.
 */
function indexRecords(records) {
  for (const record of records) {
    if (record.test_name) {
      edosMap.set(record.test_name.toLowerCase(), record);
    }
    if (record.test_code) {
      edosCodeMap.set(record.test_code.toLowerCase(), record);
    }
  }
}

/**
 * Load EDOS data from CSV into memory.
 * Falls back to edos.json if CSV is not available.
 * Optionally writes edos.json for inspection.
 * @param {import('ioredis').Redis} [redis] – optional, to cache in Redis hash
 */
function loadEdos(redis) {
  return new Promise((resolve, reject) => {
    // ── Check if CSV exists ────────────────────────────────────
    if (!fs.existsSync(CSV_PATH)) {
      logger.warn(`EDOS CSV not found at ${CSV_PATH}`);
      // Try JSON fallback
      if (fs.existsSync(JSON_PATH)) {
        logger.info(`Loading EDOS from JSON fallback: ${JSON_PATH}`);
        try {
          const raw = fs.readFileSync(JSON_PATH, 'utf-8');
          const records = JSON.parse(raw);

          // Re-parse schedule and TAT from raw strings (they may not be in JSON)
          for (const rec of records) {
            if (rec.schedule_raw && !rec.schedule) {
              rec.schedule = parseSchedule(rec.schedule_raw);
            }
            if (rec.tat_raw && !rec.tat) {
              rec.tat = parseTAT(rec.tat_raw);
            }
          }

          indexRecords(records);
          logger.success(`EDOS loaded from JSON: ${records.length} test records`);

          // Cache in Redis if available
          if (redis) {
            cacheInRedis(redis, records).catch(() => {});
          }

          return resolve(records);
        } catch (err) {
          logger.error(`Failed to load EDOS JSON: ${err.message}`);
          return reject(err);
        }
      } else {
        logger.warn('No EDOS data source available (CSV or JSON). Continuing with empty EDOS.');
        return resolve([]);
      }
    }

    // ── Parse CSV ──────────────────────────────────────────────
    const records = [];
    let lineNum = 0;

    fs.createReadStream(CSV_PATH)
      .pipe(csv({
        skipLines: 1,  // Skip the "Edos List,,,,,,,,,,,," title row
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
      })
      .on('end', async () => {
        indexRecords(records);
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
          await cacheInRedis(redis, records);
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
 * Cache EDOS records in Redis for fast cross-process lookups.
 */
async function cacheInRedis(redis, records) {
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
