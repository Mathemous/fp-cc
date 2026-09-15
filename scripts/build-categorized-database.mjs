import fs from 'node:fs';

const sourcePath = new URL('../data/records.json', import.meta.url);
const outputPath = new URL('../data/categorized-records.candidate.json', import.meta.url);
const replacementPath = new URL('../data/records.replacement.json', import.meta.url);
const records = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));
const details = JSON.parse(fs.readFileSync(new URL('../data/mobile-details.json', import.meta.url), 'utf8'));

const serviceSubcategories = new Set([
  'Contracted student-support services', 'Course and program fees',
  'Cultural, career and author experiences', 'Exam fee waivers', 'Exam fees',
  'Field trip admission', 'Field trip entrance fees', 'Online instructional resources',
  'Parent & Family Engagement — event services', 'Transportation services',
]);

const materialSubcategories = new Set([
  'ACT preparation materials', 'Assessment materials', 'Books',
  'Books and instructional curriculum', 'Books and instructional resources',
  'Books and literacy materials', 'Family and Community Engagement — materials',
  'Family Engagement — materials', 'Hebrew instructional materials',
  'Instructional resources and curriculum', 'Intervention materials',
  'Parent & Family Engagement — event materials',
  'Parent & Family Engagement — take-home materials', 'Preschool instructional materials',
  'Professional development — books and guides',
  'Professional development — books and materials', 'Supplemental curriculum',
]);

const equipmentSubcategories = new Set([
  'Administrative technology equipment', 'Classroom tools', 'Instructional equipment',
  'Instructional technology', 'Learning manipulatives', 'Manipulatives for learning centers',
  'PE and sensory items', 'PE equipment', 'Private-school equipment',
]);

const categoryBySubcategory = {
  '3-D printer supplies': ['3D Supplies', 'Accessories'],
  'ACT preparation materials': ['Instructional Materials', 'Test Preparation'],
  'Administrative office supplies': ['Office Supplies', 'General Office Supplies'],
  'Administrative technology equipment': ['Technology Equipment', 'Administrative Technology'],
  'Art and craft supplies': ['Arts & Crafts', 'General Arts & Crafts'],
  'Art and home economics supplies': ['Arts & Crafts', 'Art & Home Economics'],
  'Art instructional supplies': ['Arts & Crafts', 'Art Supplies'],
  'Art supplies': ['Arts & Crafts', 'Art Supplies'],
  'Assessment materials': ['Assessment', 'Testing Materials'],
  Books: ['Books & Curriculum', 'Books'],
  'Books and instructional curriculum': ['Books & Curriculum', 'Curriculum Materials'],
  'Books and instructional resources': ['Books & Curriculum', 'Instructional Resources'],
  'Books and literacy materials': ['Books & Curriculum', 'Literacy Materials'],
  'Classroom supplies': ['Classroom Supplies', 'General Classroom Supplies'],
  'Classroom tools': ['Classroom Equipment', 'Classroom Tools'],
  'Contracted student-support services': ['Student Support Services', 'Contracted Support'],
  'Course and program fees': ['Fees & Admissions', 'Course and Program Fees'],
  'Cultural, career and author experiences': ['Student Experiences', 'Cultural, Career & Author Programs'],
  'Exam fee waivers': ['Fees & Admissions', 'Exam Fee Waivers'],
  'Exam fees': ['Fees & Admissions', 'Exam Fees'],
  'Family and Community Engagement — materials': ['Family & Community Engagement', 'Event Materials'],
  'Family Engagement — materials': ['Family & Community Engagement', 'Event Materials'],
  'Field trip admission': ['Fees & Admissions', 'Field Trip Admission'],
  'Field trip entrance fees': ['Fees & Admissions', 'Field Trip Admission'],
  'Hebrew instructional materials': ['Books & Curriculum', 'Hebrew Instructional Materials'],
  'Instructional equipment': ['Instructional Equipment', 'General Instructional Equipment'],
  'Instructional resources and curriculum': ['Books & Curriculum', 'Instructional Resources'],
  'Instructional technology': ['Technology Equipment', 'Instructional Technology'],
  'Intervention materials': ['Books & Curriculum', 'Intervention Materials'],
  'Learning manipulatives': ['Instructional Equipment', 'Learning Manipulatives'],
  'Manipulatives for learning centers': ['Instructional Equipment', 'Learning Manipulatives'],
  'Math and science supplies': ['Math & Science Supplies', 'General Math & Science Supplies'],
  'Music and theater supplies': ['Music & Theater', 'Music & Theater Supplies'],
  'Music instructional supplies': ['Music & Theater', 'Music Supplies'],
  'Musical instructional supplies': ['Music & Theater', 'Music Supplies'],
  'Online instructional resources': ['Software & Digital Services', 'Online Instructional Resources'],
  'Parent & Family Engagement — event materials': ['Family & Community Engagement', 'Event Materials'],
  'Parent & Family Engagement — event services': ['Family & Community Engagement', 'Event Services'],
  'Parent & Family Engagement — refreshments': ['Food & Refreshments', 'Family Engagement Refreshments'],
  'Parent & Family Engagement — take-home materials': ['Family & Community Engagement', 'Take-home Materials'],
  'PE and sensory items': ['Physical Education & Sensory', 'PE & Sensory Equipment'],
  'PE equipment': ['Physical Education & Sensory', 'PE Equipment'],
  'Preschool instructional materials': ['Early Childhood', 'Preschool Materials'],
  'Private-school equipment': ['Instructional Equipment', 'Private-school Equipment'],
  'Science and STEM supplies': ['Science & STEM Supplies', 'General Science & STEM Supplies'],
  'Science instructional supplies': ['Science & STEM Supplies', 'Science Supplies'],
  'Software and technology licenses': ['Software & Digital Services', 'Licenses & Subscriptions'],
  'Software subscriptions': ['Software & Digital Services', 'Licenses & Subscriptions'],
  'STEAM instructional supplies': ['Science & STEM Supplies', 'STEAM Supplies'],
  'STEM instructional supplies': ['Science & STEM Supplies', 'STEM Supplies'],
  'Student safety software': ['Software & Digital Services', 'Student Safety Software'],
  'Supplemental curriculum': ['Books & Curriculum', 'Supplemental Curriculum'],
  'Technology accessories': ['Technology Supplies', 'Accessories'],
  'Transportation services': ['Transportation Services', 'Student Transportation'],
};

function normalize3D(value) {
  return value.replace(/\b3[\s‐‑‒–—-]*d\b/giu, '3D');
}

function classify(record) {
  const original = record.item;
  const item = normalize3D(original).replace(/\s+/g, ' ').trim();
  const haystack = `${item} ${record.subcategory}`.toLocaleLowerCase('en-US');

  if (/\bfilament\b/u.test(haystack)) {
    return { purchaseType: 'supply', category: '3D Supplies', subcategory: 'Filament', normalizedItem: '3D printer filament' };
  }
  if (/\b3d printers?\b/u.test(haystack)) {
    return { purchaseType: 'equipment', category: '3D Equipment', subcategory: '3D Printers', normalizedItem: item };
  }
  if (record.subcategory === '3-D printer supplies' && /\bsd cards?\b/u.test(haystack)) {
    return { purchaseType: 'supply', category: '3D Supplies', subcategory: 'Storage Media', normalizedItem: item };
  }
  if (record.subcategory.startsWith('Professional development —')) {
    if (/books|guides|materials/u.test(record.subcategory.toLowerCase())) {
      return { purchaseType: 'material', category: 'Professional Development', subcategory: 'Books & Materials', normalizedItem: item };
    }
    return { purchaseType: 'service', category: 'Professional Development', subcategory: record.subcategory.split('—')[1].trim().replace(/^./u, c => c.toUpperCase()), normalizedItem: item };
  }

  const [category, subcategory] = categoryBySubcategory[record.subcategory] ?? ['Other Purchases', record.subcategory];
  let purchaseType = 'supply';
  if (serviceSubcategories.has(record.subcategory) || /software|subscription|license/u.test(record.subcategory.toLowerCase())) purchaseType = 'service';
  else if (materialSubcategories.has(record.subcategory)) purchaseType = 'material';
  else if (equipmentSubcategories.has(record.subcategory)) purchaseType = 'equipment';

  return { purchaseType, category, subcategory, normalizedItem: item };
}

const entries = records.map(record => ({
  ...record,
  classification: classify(record),
}));

const typeCounts = Object.fromEntries(['material', 'supply', 'equipment', 'service'].map(type => [
  type,
  entries.filter(entry => entry.classification.purchaseType === type).length,
]));
const categories = [...new Set(entries.map(entry => entry.classification.category))].sort();

const database = {
  meta: {
    status: 'candidate',
    purpose: 'Reviewable mobile catalog classification; not connected to the application.',
    source: 'records.json',
    sourceRecordCount: records.length,
    generatedRecordCount: entries.length,
    preservesSourceFields: true,
    replacesExistingDatabase: false,
    normalizationRules: [
      '3-D and typographic-dash variants are normalized to 3D as one concept.',
      'No single-character aliases or isolated single-digit search terms are generated.',
      'Original item wording remains in the top-level item field.',
    ],
    purchaseTypes: ['material', 'supply', 'equipment', 'service'],
    typeCounts,
    categories,
  },
  entries,
};

if (entries.length !== records.length) throw new Error('Candidate record count does not match source.');
if (entries.some(entry => !entry.classification.category || !entry.classification.subcategory)) throw new Error('Unclassified record.');
if (entries.some(entry => /\b3[\s‐‑‒–—-]+d\b/iu.test(entry.classification.normalizedItem))) throw new Error('Unnormalized 3-D term.');

fs.writeFileSync(outputPath, `${JSON.stringify(database, null, 2)}\n`);
const replacement = entries.map(({ classification, ...record }) => ({
  id: record.id,
  program: record.program,
  account: record.account,
  category: classification.category,
  subcategory: classification.subcategory,
  item: classification.normalizedItem,
  line: record.line,
  purchaseType: classification.purchaseType,
  source: {
    category: record.category,
    subcategory: record.subcategory,
    item: record.item,
    sourceIds: [...new Set((details[record.id] ?? []).map(link => link.sourceId))],
  },
}));

if (replacement.some(entry => entry.source.sourceIds.length === 0)) throw new Error('Replacement record lacks ePlan provenance.');
fs.writeFileSync(replacementPath, `${JSON.stringify(replacement, null, 2)}\n`);
console.log(`Created ${entries.length} candidate entries in data/categorized-records.candidate.json`);
console.log(`Created ${replacement.length} replacement-ready entries in data/records.replacement.json`);
console.log(JSON.stringify({ typeCounts, categoryCount: categories.length }, null, 2));
