// Pet care tips data for common breeds

interface PetCareTip {
  category: string;
  tip: string;
}

interface BreedData {
  species: string;
  commonIssues: string;
  grooming: string;
  exercise: string;
  diet: string;
  lifespan: string;
}

// Dog breed data
const DOG_BREEDS: Record<string, BreedData> = {
  'labrador': {
    species: 'dog',
    commonIssues: 'Hip dysplasia, obesity, ear infections',
    grooming: 'Weekly brushing, occasional baths',
    exercise: '1-2 hours daily, loves swimming',
    diet: 'High-quality protein, watch portions to prevent obesity',
    lifespan: '10-12 years'
  },
  'golden retriever': {
    species: 'dog',
    commonIssues: 'Hip dysplasia, cancer, heart disease',
    grooming: 'Daily brushing, regular baths',
    exercise: '1-2 hours daily, highly active',
    diet: 'High-quality protein, joint supplements',
    lifespan: '10-12 years'
  },
  'german shepherd': {
    species: 'dog',
    commonIssues: 'Hip/elbow dysplasia, bloat, degenerative myelopathy',
    grooming: 'Frequent brushing, sheds heavily',
    exercise: '2 hours daily, needs mental stimulation',
    diet: 'High-protein, large-breed formula',
    lifespan: '9-13 years'
  },
  'bulldog': {
    species: 'dog',
    commonIssues: 'Breathing problems, skin fold infections, hip dysplasia',
    grooming: 'Clean facial wrinkles daily, moderate brushing',
    exercise: 'Short walks, avoid heat',
    diet: 'Quality protein, avoid overfeeding',
    lifespan: '8-10 years'
  },
  'poodle': {
    species: 'dog',
    commonIssues: 'Hip dysplasia, eye disorders, Addison\'s disease',
    grooming: 'Professional grooming every 6-8 weeks, daily brushing',
    exercise: '1 hour daily, highly intelligent',
    diet: 'High-quality protein, balanced nutrition',
    lifespan: '12-15 years'
  },
  'beagle': {
    species: 'dog',
    commonIssues: 'Obesity, ear infections, epilepsy',
    grooming: 'Weekly brushing, ear cleaning',
    exercise: '1 hour daily, strong nose drive',
    diet: 'Portion control essential, prone to overeating',
    lifespan: '10-15 years'
  },
  'chihuahua': {
    species: 'dog',
    commonIssues: 'Dental problems, patellar luxation, heart disease',
    grooming: 'Minimal grooming, regular dental care',
    exercise: '30 minutes daily, indoor play',
    diet: 'Small-breed formula, small frequent meals',
    lifespan: '12-20 years'
  }
};

// Cat breed data
const CAT_BREEDS: Record<string, BreedData> = {
  'persian': {
    species: 'cat',
    commonIssues: 'Breathing problems, polycystic kidney disease, eye conditions',
    grooming: 'Daily brushing required, professional grooming recommended',
    exercise: 'Low activity, gentle play sessions',
    diet: 'High-quality protein, hairball formula',
    lifespan: '12-17 years'
  },
  'siamese': {
    species: 'cat',
    commonIssues: 'Dental issues, respiratory infections, crossed eyes',
    grooming: 'Minimal grooming, occasional brushing',
    exercise: 'Very active, needs interactive play',
    diet: 'High-protein, lean meats',
    lifespan: '15-20 years'
  },
  'maine coon': {
    species: 'cat',
    commonIssues: 'Hip dysplasia, hypertrophic cardiomyopathy, spinal muscular atrophy',
    grooming: 'Regular brushing 2-3 times per week',
    exercise: 'Moderately active, enjoys climbing',
    diet: 'High-quality protein, large-breed formula',
    lifespan: '12-15 years'
  },
  'ragdoll': {
    species: 'cat',
    commonIssues: 'Hypertrophic cardiomyopathy, bladder stones, obesity',
    grooming: 'Weekly brushing, low matting',
    exercise: 'Low to moderate, gentle play',
    diet: 'High-protein, portion control',
    lifespan: '12-17 years'
  },
  'bengal': {
    species: 'cat',
    commonIssues: 'Progressive retinal atrophy, hip dysplasia, heart disease',
    grooming: 'Minimal grooming, loves water',
    exercise: 'Very high, needs enrichment',
    diet: 'High-protein, raw diet friendly',
    lifespan: '12-16 years'
  },
  'sphynx': {
    species: 'cat',
    commonIssues: 'Skin problems, heart disease, respiratory issues',
    grooming: 'Weekly baths required, ear cleaning',
    exercise: 'Very active and playful',
    diet: 'High-calorie to maintain body heat',
    lifespan: '8-14 years'
  }
};

// Generic tips for dogs
const GENERIC_DOG_TIPS: PetCareTip[] = [
  { category: 'Health', tip: 'Annual vet checkups and vaccinations are essential' },
  { category: 'Exercise', tip: 'Regular daily walks help maintain physical and mental health' },
  { category: 'Diet', tip: 'Avoid grapes, chocolate, onions, garlic, and xylitol - toxic to dogs' },
  { category: 'Grooming', tip: 'Nail trimming, ear cleaning, and dental care prevent health issues' }
];

// Generic tips for cats
const GENERIC_CAT_TIPS: PetCareTip[] = [
  { category: 'Health', tip: 'Annual vet checkups and vaccinations are essential' },
  { category: 'Exercise', tip: 'Interactive play sessions keep cats mentally and physically stimulated' },
  { category: 'Diet', tip: 'Avoid onions, garlic, chocolate, grapes, and lilies - toxic to cats' },
  { category: 'Grooming', tip: 'Regular brushing reduces hairballs and maintains coat health' }
];

export function getPetCareTips(species: string, breed?: string): PetCareTip[] {
  const normalizedSpecies = species.toLowerCase();
  const normalizedBreed = breed?.toLowerCase() || '';

  // Try to find breed-specific data
  let breedData: BreedData | undefined;
  
  if (normalizedSpecies === 'dog' && normalizedBreed) {
    breedData = Object.keys(DOG_BREEDS).find(key => normalizedBreed.includes(key))
      ? DOG_BREEDS[Object.keys(DOG_BREEDS).find(key => normalizedBreed.includes(key))!]
      : undefined;
  } else if (normalizedSpecies === 'cat' && normalizedBreed) {
    breedData = Object.keys(CAT_BREEDS).find(key => normalizedBreed.includes(key))
      ? CAT_BREEDS[Object.keys(CAT_BREEDS).find(key => normalizedBreed.includes(key))!]
      : undefined;
  }

  // If breed-specific data found, format into tips
  if (breedData) {
    return [
      { category: 'Common Health Issues', tip: breedData.commonIssues },
      { category: 'Grooming Needs', tip: breedData.grooming },
      { category: 'Exercise Requirements', tip: breedData.exercise },
      { category: 'Diet Recommendations', tip: breedData.diet },
      { category: 'Average Lifespan', tip: breedData.lifespan }
    ];
  }

  // Fall back to generic tips based on species
  if (normalizedSpecies === 'dog') {
    return GENERIC_DOG_TIPS;
  } else if (normalizedSpecies === 'cat') {
    return GENERIC_CAT_TIPS;
  }

  // Default generic pet tips
  return [
    { category: 'Health', tip: 'Regular veterinary checkups are important for all pets' },
    { category: 'Nutrition', tip: 'Feed a balanced diet appropriate for your pet\'s species and age' },
    { category: 'Exercise', tip: 'Ensure your pet gets appropriate exercise and mental stimulation' }
  ];
}
