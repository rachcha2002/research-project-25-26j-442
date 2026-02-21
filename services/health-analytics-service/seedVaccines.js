const mongoose = require('mongoose');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/health-analytics');

const vaccineTypeSchema = new mongoose.Schema({
  name: String,
  description: String,
  recommendedDoses: Number,
  ageRecommendations: String,
  isActive: { type: Boolean, default: true },
  displayOrder: Number,
}, { timestamps: true });

const VaccineType = mongoose.model('VaccineType', vaccineTypeSchema);

const commonVaccines = [
  { name: 'DTaP (Diphtheria, Tetanus, Pertussis)', recommendedDoses: 5, ageRecommendations: '2, 4, 6, 15-18 months, 4-6 years', displayOrder: 1 },
  { name: 'MMR (Measles, Mumps, Rubella)', recommendedDoses: 2, ageRecommendations: '12-15 months, 4-6 years', displayOrder: 2 },
  { name: 'Polio (IPV)', recommendedDoses: 4, ageRecommendations: '2, 4, 6-18 months, 4-6 years', displayOrder: 3 },
  { name: 'Hepatitis B', recommendedDoses: 3, ageRecommendations: 'Birth, 1-2 months, 6-18 months', displayOrder: 4 },
  { name: 'Hepatitis A', recommendedDoses: 2, ageRecommendations: '12-23 months, 18-24 months', displayOrder: 5 },
  { name: 'Hib (Haemophilus influenzae type b)', recommendedDoses: 4, ageRecommendations: '2, 4, 6, 12-15 months', displayOrder: 6 },
  { name: 'Varicella (Chickenpox)', recommendedDoses: 2, ageRecommendations: '12-15 months, 4-6 years', displayOrder: 7 },
  { name: 'PCV (Pneumococcal)', recommendedDoses: 4, ageRecommendations: '2, 4, 6, 12-15 months', displayOrder: 8 },
  { name: 'Rotavirus', recommendedDoses: 3, ageRecommendations: '2, 4, 6 months', displayOrder: 9 },
  { name: 'Influenza (Flu)', recommendedDoses: 1, ageRecommendations: 'Annual, starting at 6 months', displayOrder: 10 },
  { name: 'Meningococcal', recommendedDoses: 2, ageRecommendations: '11-12 years, 16 years', displayOrder: 11 },
  { name: 'HPV (Human Papillomavirus)', recommendedDoses: 2, ageRecommendations: '11-12 years', displayOrder: 12 },
  { name: 'COVID-19', recommendedDoses: 2, ageRecommendations: '6 months+', displayOrder: 13 },
  { name: 'Other', recommendedDoses: 1, ageRecommendations: 'As prescribed', displayOrder: 99 },
];

async function seed() {
  try {
    console.log('Deleting existing vaccine types...');
    await VaccineType.deleteMany({});
    
    console.log('Inserting new vaccine types...');
    const created = await VaccineType.insertMany(commonVaccines);
    
    console.log(`✅ Successfully seeded ${created.length} vaccine types!`);
    console.log('\nVaccines added:');
    created.forEach((v, i) => {
      console.log(`  ${i + 1}. ${v.name} (${v.recommendedDoses} doses)`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

seed();
