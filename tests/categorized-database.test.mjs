import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = name => JSON.parse(fs.readFileSync(new URL(`../data/${name}`, import.meta.url), 'utf8'));
const source = read('records.json');
const candidate = read('categorized-records.candidate.json');
const replacement = read('records.replacement.json');

test('candidate database is complete, separate, and preserves every source record', () => {
  assert.equal(candidate.meta.status, 'candidate');
  assert.equal(candidate.meta.replacesExistingDatabase, false);
  assert.equal(candidate.entries.length, source.length);
  assert.deepEqual(candidate.entries.map(({ classification, ...record }) => record), source);
  assert.ok(candidate.entries.every(entry => (
    entry.classification.purchaseType
    && entry.classification.category
    && entry.classification.subcategory
    && entry.classification.normalizedItem
  )));
});

test('classification does not introduce isolated 3D fragments', () => {
  assert.ok(candidate.entries.every(entry => !/\b3[\s‐‑‒–—-]+d\b/iu.test(entry.classification.normalizedItem)));
});

test('current Chester rows receive complete classifications', () => {
  assert.ok(candidate.entries.every(entry => entry.classification.category));
  assert.ok(candidate.entries.every(entry => entry.classification.subcategory));
  assert.ok(candidate.entries.every(entry => entry.classification.normalizedItem.length > 0));
});

test('replacement database promotes normalized fields and retains source provenance', () => {
  assert.equal(replacement.length, source.length);
  assert.deepEqual(replacement.map(entry => entry.id), source.map(entry => entry.id));
  assert.ok(replacement.every(entry => ['material', 'supply', 'equipment', 'service'].includes(entry.purchaseType)));
  assert.ok(replacement.every(entry => entry.source.item && entry.source.category && entry.source.subcategory));
  assert.ok(replacement.every(entry => entry.source.sourceIds.length > 0));

  const original = source[0];
  const normalized = replacement.find(entry => entry.id === original.id);
  assert.equal(normalized.source.item, original.item);
  assert.deepEqual(normalized.source.sourceIds, [original.sourceId]);
});
