import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { sourceContext } from '../lib/source-context.mjs';
const read = name => JSON.parse(fs.readFileSync(new URL('../data/' + name, import.meta.url), 'utf8'));
const records = read('records.json');
const source = read('eplan-source.json');
const details = read('mobile-details.json');

test('mobile details remain reproducible from the source and preserve program/account boundaries', () => {
  for (const record of records) {
    assert.deepEqual(details[record.id], sourceContext(record, source.rows));
    assert.ok(details[record.id].length > 0, `${record.id} has no ePlan budget detail`);
    for (const link of details[record.id]) {
      const row = source.rows.find(r=>r.sourceId===link.sourceId);
      assert.ok(row);
      assert.equal(row.program,record.program);
      assert.equal(row.account,record.account);
      assert.equal(row.line,record.line);
      for (const association of link.associations) assert.ok(row.narrative.includes(association.excerpt));
    }
  }
});
test('no school is carried across revision boundaries or inferred for unmatched items', () => {
  const item = {program:'p',account:'71100',line:'429',item:'Cardstock'};
  const rows = [{...item,sourceId:'s',narrative:'School A - $10\nPaper\nRevision 1\nCardstock'}];
  assert.deepEqual(sourceContext(item,rows)[0].associations,[]);
  const fallback = sourceContext({...item,item:'Markers'},rows);
  assert.equal(fallback[0].sourceId, 's');
  assert.deepEqual(fallback[0].associations, []);
});

test('rebuilt catalog records receive their matching ePlan budget line and narrative', () => {
  const item = records[0];
  const links = sourceContext(item, source.rows);
  assert.ok(links.length > 0);
  assert.ok(links.some(link => source.rows.find(row => row.sourceId === link.sourceId)?.narrative === item.narrative));
});

import { locationBlurb } from '../lib/source-context.mjs';
test('location blurbs preserve unmatched excerpts verbatim', () => {
  assert.equal(locationBlurb('Chester Middle - $100\nSupplies for families'), 'Chester Middle - $100\nSupplies for families');
});
