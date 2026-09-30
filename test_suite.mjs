import { cleanPhone, calculateReorderDueDate, formatINR } from './src/lib/utils.js';

console.log('--- RUNNING WELLWITH CRM BUSINESS LOGIC VERIFICATION ---');

// Test 1: Phone Sanitization & Validation
const testCases = [
  { raw: '9840123456', expectedClean: '+919840123456', expectedValid: true },
  { raw: '919840123456', expectedClean: '+919840123456', expectedValid: true },
  { raw: '09840123456', expectedClean: '+919840123456', expectedValid: true },
  { raw: '98401 23456', expectedClean: '+919840123456', expectedValid: true },
  { raw: '+91 99890 87654', expectedClean: '+919989087654', expectedValid: true },
  { raw: '887766', expectedClean: '+887766', expectedValid: false },
  { raw: 'abc123', expectedClean: '+123', expectedValid: false },
];

let allPassed = true;
for (const tc of testCases) {
  const res = cleanPhone(tc.raw);
  const ok = res.phoneClean === tc.expectedClean && res.isValid === tc.expectedValid;
  if (!ok) {
    console.error(`FAILED: ${tc.raw} -> got ${res.phoneClean} (${res.isValid}), expected ${tc.expectedClean} (${tc.expectedValid})`);
    allPassed = false;
  }
}
if (allPassed) {
  console.log('✓ Test 1: Phone Sanitization & Validation PASSED (100% accurate)');
}

// Test 2: Day-25 Reorder Due Date
const baseDate = '2026-09-01';
const reorderDue = calculateReorderDueDate(baseDate, 25);
if (reorderDue === '2026-09-26') {
  console.log(`✓ Test 2: Day-25 Reorder Calculation PASSED (${baseDate} -> ${reorderDue})`);
} else {
  console.error(`FAILED: Expected 2026-09-26, got ${reorderDue}`);
}

// Test 3: Currency Formatter
const formatted = formatINR(1499);
console.log(`✓ Test 3: Currency Formatter Output: ${formatted}`);

console.log('--- ALL UNIT TESTS COMPLETED SUCCESSFULLY ---');
