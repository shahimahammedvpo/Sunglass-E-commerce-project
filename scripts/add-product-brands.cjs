
const fs = require('fs');
const path = require('path');

// Read db.json
const dbPath = path.join(__dirname, '..', 'db.json');

const database = JSON.parse(
  fs.readFileSync(dbPath, 'utf8')
);

// Brand mapping using product IDs
const brandMapping = {
  1: 'Ray-Ban',
  2: 'Fastrack',
  3: 'Vincent Chase',
  4: 'IDEE',
  5: 'Oakley',
  6: 'Titan',
  7: 'Polaroid',
  8: 'Carrera',
  9: 'Oakley',
  10: 'John Jacobs',
  11: 'Vogue Eyewear',
  12: 'Prada',
  13: 'Fastrack',
  14: 'Ray-Ban',
  15: 'Gucci',
  16: 'IDEE',
  17: 'Vincent Chase',
  18: 'Michael Kors',
  19: 'Vogue Eyewear',
  20: 'Titan',
  21: 'Ray-Ban',
  22: 'Fastrack',
  23: 'Polaroid',
  24: 'Vincent Chase',
  25: 'Oakley',
  26: 'Carrera',
  27: 'John Jacobs',
  28: 'Police',
  29: 'IDEE',
  30: 'Ray-Ban'
};

// Check that all products exist
if (!Array.isArray(database.products)) {
  throw new Error('Products array not found in db.json');
}

const missingIds = database.products
  .filter(product => !brandMapping[product.id])
  .map(product => product.id);

if (missingIds.length > 0) {
  throw new Error(
    `Missing brand mappings for product IDs: ${missingIds.join(', ')}`
  );
}

// Add brand names to products
database.products = database.products.map(product => ({
  ...product,
  brand: brandMapping[product.id]
}));

// Save updated database
fs.writeFileSync(
  dbPath,
  JSON.stringify(database, null, 2),
  'utf8'
);

console.log('Successfully added brands to products!');

database.products.forEach(product => {
  console.log(`${product.id}. ${product.name} - ${product.brand}`);
});
