import { normalize } from './search.mjs';

// Match catalog phrases only within the same program, account and line item.
// Preserve source spelling and avoid assigning a school from a neighboring block.
export function sourceContext(item, rows) {
  const sourceSpelling = item.item.match(/\(source:\s*([^)]*)\)/i)?.[1];
  const phrases = (sourceSpelling ? [sourceSpelling] : item.item.replace(/\s*\([^)]*\)/g, '').split(/\s+\/\s+/))
    .map(normalize).filter(Boolean);
  const mentions = text => phrases.some(phrase => {
    const normalizedText = ` ${normalize(text)} `;
    if (normalizedText.includes(` ${phrase} `)) return true;
    // ePlan sometimes contains the same item words in a different order than
    // the curated card label (for example, “Filament for 3-D Printer”).
    const words = phrase.split(' ').filter(Boolean);
    return words.length > 1 && words.every(word => normalizedText.includes(` ${word} `));
  });
  const budgetLineRows = rows.filter(row => row.program === item.program && row.account === item.account && row.line === item.line);
  const matchedRows = budgetLineRows.filter(row =>
    item.sourceId ? row.sourceId === item.sourceId : mentions(row.narrative || ''));
  // Older curated catalog entries do not always carry an ePlan source id, and
  // their concise item wording can differ from the narrative word order. In
  // that case the program/account/line combination is the authoritative ePlan
  // relationship. Keep every matching budget row so every result card can
  // expose its source fields and original narrative.
  const candidates = matchedRows.length ? matchedRows : budgetLineRows;
  return candidates.map(row => {
    const narrative = row.narrative || '';
    const associations = [];
    let school = null;
    for (const raw of narrative.split(/\r?\n/)) {
      const line = raw.trim();
      if (/^(?:FY\d+ Original Budget|Revision\s+\d+)/i.test(line)) school = null;
      const heading = line.match(/^(.+?)\s*[-–—]\s*\$[\d,]+(?:\.\d+)?\s*$/);
      if (heading) { school = heading[1].trim(); continue; }
      if (!school || !mentions(line)) continue;
      const category = line.match(/^([^:–—]+?)\s*(?:\s-\s|:|\s[–—]\s)/)?.[1]?.trim();
      if (!associations.some(a => a.school === school && a.excerpt === line))
        associations.push({ school, ...(category ? { category } : {}), excerpt: line });
    }
    return { sourceId: row.sourceId, associations };
  });
}

// Keep a short source-derived purpose statement; the dialog retains the full text.
export function locationBlurb(excerpt) {
  const purpose = excerpt.split(/\s+including\s+|;\s*supplies include|;\s*materials include/i)[0].trim();
  if (purpose.length <= 180) return purpose.replace(/[;,:]$/, '');
  return purpose.slice(0, 177).replace(/\s+\S*$/, '') + '…';
}
