// Custom date parser for the inconsistent formats

export function parseDate(dateStr) {
  if (!dateStr || typeof dateStr !== 'string') return null;
  
  const cleaned = dateStr.trim().replace(/^"|"$/g, '');
  if (!cleaned) return null;

  // Try standard JS date parsing
  let d = new Date(cleaned);
  if (!isNaN(d.getTime())) return d;

  // Handle DD-MM-YYYY or DD-MM-YY, MM-DD-YYYY, etc.
  // Format: "25-03-2024 16.31" or "25-03-2024"
  const dateTimeParts = cleaned.split(' ');
  const datePart = dateTimeParts[0];
  const timePart = dateTimeParts[1];

  // Try matching DD-MM-YYYY or DD-MM-YY (e.g., 25-03-2024, 13-Mar-24, 02-Feb-24)
  const hyphens = datePart.split('-');
  const slashes = datePart.split('/');
  
  let day, month, year;
  let hour = 0, minute = 0;

  if (timePart) {
    const timeParts = timePart.split('.');
    if (timeParts.length >= 2) {
      hour = parseInt(timeParts[0], 10) || 0;
      minute = parseInt(timeParts[1], 10) || 0;
    }
  }

  const monthsMap = {
    jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
    jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
    january: 0, february: 1, march: 2, april: 3, june: 5,
    july: 6, august: 7, september: 8, october: 9, november: 10, december: 11
  };

  const parseMonth = (str) => {
    const s = str.toLowerCase();
    if (monthsMap[s] !== undefined) return monthsMap[s];
    const val = parseInt(str, 10);
    return !isNaN(val) ? val - 1 : null;
  };

  if (hyphens.length === 3) {
    // DD-MM-YYYY or DD-MMM-YY
    day = parseInt(hyphens[0], 10);
    month = parseMonth(hyphens[1]);
    year = parseInt(hyphens[2], 10);
    if (year < 100) year += 2000; // 24 -> 2024
  } else if (slashes.length === 3) {
    // MM/DD/YYYY or DD/MM/YYYY
    // Let's check if first is month or day. If first > 12, it's day (DD/MM/YYYY).
    const p0 = parseInt(slashes[0], 10);
    const p1 = parseInt(slashes[1], 10);
    const p2 = parseInt(slashes[2], 10);
    
    if (p0 > 12) {
      day = p0;
      month = p1 - 1;
    } else {
      month = p0 - 1;
      day = p1;
    }
    year = p2;
    if (year < 100) year += 2000;
  }

  if (day !== undefined && month !== null && year !== undefined) {
    const finalDate = new Date(year, month, day, hour, minute);
    if (!isNaN(finalDate.getTime())) return finalDate;
  }

  return null;
}

// Function to check if the row is meaningless
export function isMeaningless(text) {
  if (!text || typeof text !== 'string') return true;
  
  const trimmed = text.trim();
  if (trimmed.length === 0) return true;

  // 1. Check if the string contains any letters or numbers (Unicode aware)
  // If there are no letters or digits, it's just punctuation, spaces, or emojis
  if (!/[\p{L}\p{N}]/u.test(trimmed)) {
    return true;
  }

  // 2. repeating characters, e.g., "aaaaaaaaaaaaaaa"
  if (/^(.)\1{4,}$/i.test(trimmed)) return true;

  const lowercase = trimmed.toLowerCase();
  
  // 3. Known meaningless texts
  const meaninglessWords = [
    'meh', 'ok i guess', 'meh!', 'meh!!!!', 'ok i guess!!!!',
    'test test test ignore', 'test', 'ignore', 'testing',
    '👍', '👎', 'ok', 'okay', 'yes', 'no'
  ];
  if (meaninglessWords.includes(lowercase)) return true;

  return false;
}

// Function to remove system signatures, order details, agents, city tags
export function cleanFeedbackText(text) {
  if (!text) return '';

  let cleaned = text;

  // Trim outer quotes if double quoted
  cleaned = cleaned.trim().replace(/^"|"$/g, '');

  // 1. Remove Agent info: "Agent Priya was handling it.", "Agent Meera was handling it.!!!!", "Agent Vikram was handling it"
  cleaned = cleaned.replace(/\bAgent \w+ was handling it(?:\.!!!|\.!\!|\.|\b|\!+)?/gi, '');

  // 2. Remove order numbers: "(order #123456)", "(order #123456)!!!!", "(ooorder #847204)"
  cleaned = cleaned.replace(/\((?:order|ooorder)\s*#\d+\)(?:\.!!!|\.!\!|\.|\b|\!+)?/gi, '');

  // 3. Remove time repetition tags: "This is the first time.", "This is the fourth time.!!!!"
  cleaned = cleaned.replace(/\bThis is the (?:first|second|third|fourth) time(?:\.!!!|\.!\!|\.|\b|\!+)?/gi, '');

  // 4. Remove city/order context: "- my groceries order in Pune", "- my biryani order in Chennai", "- my thali order in Kolkata"
  cleaned = cleaned.replace(/-\s*my\s+\w+(?:\s+\w+)?\s+order\s+in\s+\w+/gi, '');

  // 5. Clean up duplicate exclamation marks / extra spaces / trailing dots
  cleaned = cleaned.replace(/\s+/g, ' '); // collapse spaces
  cleaned = cleaned.replace(/!{2,}/g, '!'); // collapse exclamation marks
  cleaned = cleaned.replace(/\.{2,}/g, '.'); // collapse multiple dots
  
  // Clean up trailing/leading punctuation/spaces left after removals
  cleaned = cleaned.trim();

  return cleaned;
}
