import { parseDate, isMeaningless, cleanFeedbackText } from './utils/cleaner.js';

console.log('--- TEST DATA CLEANING FUNCTIONS ---');

// Test 1: Date Parsing
const dates = [
  '02-Feb-24',
  '02/14/2024',
  '25-03-2024 16.31',
  '"March 18, 2024"',
  'Jan 18 2024',
  '03-09-2024',
  ''
];
console.log('\nTesting Date Parsing:');
dates.forEach(d => {
  console.log(`Raw: "${d}" => Parsed:`, parseDate(d)?.toISOString() || 'NULL');
});

// Test 2: Meaningless checks
const meaninglessTexts = [
  '....',
  '?????',
  '😡😡😡😡',
  '👍',
  'aaaaaaaaaaaaaaa',
  'meh',
  'ok i guess',
  'test test test ignore',
  'Nice app, love it!'
];
console.log('\nTesting Meaningless Texts:');
meaninglessTexts.forEach(t => {
  console.log(`Text: "${t}" => IsMeaningless:`, isMeaningless(t));
});

// Test 3: Boilerplate text cleaning
const boilerplates = [
  'THANK YOU TO THE AGENT PRIYA WHO HANDLED MY COMPLAINT SO WELL - MY GROCERIES ORDER IN PUNE',
  'Cannot add address, the save button is greyed out (order #409153)',
  'App keeps crashing every time I open the cart Agent Vikram was handling it.!!!!',
  'Waited two hours and the order was finally cancelled by the app. This is the third time.',
  'Super easy to use and quick checkout, well done team Agent Neha was handling it.'
];
console.log('\nTesting Boilerplate Removal:');
boilerplates.forEach(b => {
  console.log(`Original: "${b}"`);
  console.log(`Cleaned : "${cleanFeedbackText(b)}"`);
  console.log('---');
});
