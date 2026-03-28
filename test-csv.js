const fs = require('fs');
const csv = require('csv-parser');
const path = require('path');

const CSV_PATH = path.resolve(__dirname, 'Edos List.csv');

fs.createReadStream(CSV_PATH)
  .pipe(csv({
    skipLines: 1,
    mapHeaders: ({ header }) => header.trim().toLowerCase(),
  }))
  .on('data', (row) => {
    console.log('Row keys:', Object.keys(row));
    console.log('Test Name:', row['test name']);
    process.exit(0);
  })
  .on('error', (err) => {
    console.error('Error:', err);
  });
