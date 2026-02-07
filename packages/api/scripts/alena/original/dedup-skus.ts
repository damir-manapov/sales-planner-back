import { readFileSync, writeFileSync } from 'node:fs';
import { parse } from 'csv-parse/sync';

let input = readFileSync('skus_original_with_dups.csv', 'utf-8');

// Strip BOM if present
if (input.charCodeAt(0) === 0xfeff) {
  input = input.slice(1);
}

interface SkuRecord {
  code: string;
  title: string;
  category: string;
  title2: string;
  group: string;
  supplier: string;
  status?: string;
}

// Use csv-parse to properly handle multiline quoted fields
const records = parse(input, {
  columns: true,
  skip_empty_lines: true,
  trim: true,
  delimiter: ';',
  relax_column_count: true,
}) as SkuRecord[];

// Dedupe by code
const seen = new Set<string>();
const deduped: SkuRecord[] = [];

for (const record of records) {
  const code = record.code;
  if (code && !seen.has(code)) {
    seen.add(code);
    deduped.push(record);
  }
}

// Write back as CSV - properly escape fields with quotes/semicolons
const header = 'code;title;category;title2;group;supplier;status';

function escapeField(value: string | undefined): string {
  if (!value) return '';
  // If contains semicolon, quote, or newline - wrap in quotes and escape inner quotes
  if (value.includes(';') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

const rows = deduped.map((r) =>
  [r.code, r.title, r.category, r.title2, r.group, r.supplier, r.status].map(escapeField).join(';'),
);

writeFileSync('skus.csv', [header, ...rows].join('\n'));
console.log(`Original: ${records.length} records`);
console.log(`Deduped: ${deduped.length} records`);
