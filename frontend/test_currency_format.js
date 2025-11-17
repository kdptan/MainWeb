// Test file for currency formatting
import { formatCurrency, formatNumber } from '../src/utils/formatters';

console.log('=== Currency Formatting Tests ===\n');

// Test cases
const testCases = [
  { value: 0, label: 'Zero' },
  { value: 12.50, label: 'Small amount' },
  { value: 100, label: 'Hundreds' },
  { value: 1234.56, label: 'Thousands' },
  { value: 12345.67, label: 'Ten thousands' },
  { value: 123456.78, label: 'Hundred thousands' },
  { value: 1234567.89, label: 'Millions' },
  { value: 12345678.90, label: 'Ten millions' },
  { value: '1234', label: 'String number' },
  { value: null, label: 'Null value' },
  { value: undefined, label: 'Undefined value' },
];

console.log('formatCurrency() tests:');
testCases.forEach(({ value, label }) => {
  console.log(`${label.padEnd(20)} ${String(value).padEnd(15)} → ${formatCurrency(value)}`);
});

console.log('\n\nformatNumber() tests:');
testCases.forEach(({ value, label }) => {
  console.log(`${label.padEnd(20)} ${String(value).padEnd(15)} → ${formatNumber(value)}`);
});

console.log('\n\n=== All Tests Complete ===');
