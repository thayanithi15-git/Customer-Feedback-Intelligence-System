import fs from 'fs';
import csv from 'csv-parser';

const file = 'e:\\New One\\customer_feedback_raw.csv';
const rows = [];

fs.createReadStream(file)
  .pipe(csv())
  .on('data', (row) => rows.push(row))
  .on('end', () => {
    console.log('Total Rows:', rows.length);
    
    const ids = rows.map(r => r.id);
    const uniqueIds = new Set(ids);
    console.log('Unique IDs:', uniqueIds.size);
    
    const rawTexts = rows.map(r => r.feedback_text);
    const uniqueRawTexts = new Set(rawTexts);
    console.log('Unique Raw Texts:', uniqueRawTexts.size);

    // Let's count duplicate IDs
    const idCounts = {};
    ids.forEach(id => {
      idCounts[id] = (idCounts[id] || 0) + 1;
    });
    const dupIds = Object.keys(idCounts).filter(id => idCounts[id] > 1);
    console.log('Duplicate IDs count:', dupIds.length);

    // Let's print some duplicate IDs
    console.log('Sample Duplicate IDs:', dupIds.slice(0, 5));
    
    // Check rows with one of the duplicate IDs
    if (dupIds.length > 0) {
      const targetId = dupIds[0];
      const matchingRows = rows.filter(r => r.id === targetId);
      console.log(`\nRows for duplicate ID "${targetId}":`);
      console.log(matchingRows);
    }
  });
