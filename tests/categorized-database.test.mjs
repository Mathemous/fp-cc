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

test('all filament wording is normalized under 3D Supplies without isolated tokens', () => {
  const filament = candidate.entries.filter(entry => /filament/iu.test(entry.item));
  assert.equal(filament.length, 4);
  for (const entry of filament) {
    assert.deepEqual(entry.classification, {
      purchaseType: 'supply',
      category: '3D Supplies',
      subcategory: 'Filament',
      normalizedItem: '3D printer filament',
    });
  }
  assert.ok(candidate.entries.every(entry => !/\b3[\s‐‑‒–—-]+d\b/iu.test(entry.classification.normalizedItem)));
});

test('3D printer accessories remain a whole 3D concept', () => {
  const sdCards = candidate.entries.find(entry => entry.item === 'SD cards' && entry.subcategory === '3-D printer supplies');
  assert.equal(sdCards.classification.category, '3D Supplies');
  assert.equal(sdCards.classification.subcategory, 'Storage Media');
});

test('replacement database promotes normalized fields and retains source provenance', () => {
  assert.equal(replacement.length, source.length);
  assert.deepEqual(replacement.map(entry => entry.id), source.map(entry => entry.id));
  assert.ok(replacement.every(entry => ['material', 'supply', 'equipment', 'service'].includes(entry.purchaseType)));
  assert.ok(replacement.every(entry => entry.source.item && entry.source.category && entry.source.subcategory));
  assert.ok(replacement.every(entry => entry.source.sourceIds.length > 0));

  const original = source.find(entry => entry.id === 'title-1-a-283');
  const normalized = replacement.find(entry => entry.id === original.id);
  assert.equal(normalized.item, '3D printer filament');
  assert.equal(normalized.category, '3D Supplies');
  assert.equal(normalized.subcategory, 'Filament');
  assert.equal(normalized.source.item, original.item);
});
