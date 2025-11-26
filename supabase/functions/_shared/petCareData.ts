interface PetCareTip {
  category: 'health' | 'grooming' | 'exercise' | 'diet' | 'lifespan';
  tip: string;
}

interface BreedData {
  species: 'dog' | 'cat';
  size?: 'small' | 'medium' | 'large';
  commonIssues: string[];
  groomingNeeds: string;
  exerciseNeeds: string;
  dietaryNotes: string[];
  lifespan: string;
}

// Common dog breed data
const DOG_BREEDS: Record<string, BreedData> = {
  'golden retriever': {
    species: 'dog',
    size: 'large',
    commonIssues: ['Hip dysplasia', 'Heart disease', 'Cancer'],
    groomingNeeds: 'Regular brushing (2-3x/week). Shedding is moderate to heavy.',
    exerciseNeeds: 'High energy. Requires 60-90 minutes of daily exercise.',
    dietaryNotes: ['Prone to obesity - monitor food intake', 'May benefit from joint supplements'],
    lifespan: '10-12 years'
  },
  'labrador': {
    species: 'dog',
    size: 'large',
    commonIssues: ['Hip dysplasia', 'Elbow dysplasia', 'Obesity'],
    groomingNeeds: 'Low maintenance. Weekly brushing recommended.',
    exerciseNeeds: 'Very high energy. Needs 90+ minutes daily exercise.',
    dietaryNotes: ['High appetite - prone to overeating', 'Watch for food allergies'],
    lifespan: '10-12 years'
  },
  'german shepherd': {
    species: 'dog',
    size: 'large',
    commonIssues: ['Hip dysplasia', 'Degenerative myelopathy', 'Bloat'],
    groomingNeeds: 'Heavy shedding. Daily brushing during shedding seasons.',
    exerciseNeeds: 'High energy. Needs mental and physical stimulation.',
    dietaryNotes: ['Prone to digestive issues', 'May need grain-free diet'],
    lifespan: '9-13 years'
  },
  'bulldog': {
    species: 'dog',
    size: 'medium',
    commonIssues: ['Breathing issues', 'Hip dysplasia', 'Skin fold infections'],
    groomingNeeds: 'Clean facial folds daily. Moderate brushing needs.',
    exerciseNeeds: 'Low to moderate. Avoid overheating.',
    dietaryNotes: ['Watch for food allergies', 'Prone to obesity'],
    lifespan: '8-10 years'
  },
  'beagle': {
    species: 'dog',
    size: 'small',
    commonIssues: ['Epilepsy', 'Hip dysplasia', 'Hypothyroidism'],
    groomingNeeds: 'Low maintenance. Weekly brushing.',
    exerciseNeeds: 'Moderate to high. Loves to sniff and explore.',
    dietaryNotes: ['Voracious appetite - prone to overeating', 'Watch portion sizes'],
    lifespan: '10-15 years'
  },
  'poodle': {
    species: 'dog',
    size: 'medium',
    commonIssues: ['Progressive retinal atrophy', 'Epilepsy', 'Hip dysplasia'],
    groomingNeeds: 'High maintenance. Professional grooming every 4-6 weeks.',
    exerciseNeeds: 'Moderate to high. Very intelligent, needs mental stimulation.',
    dietaryNotes: ['May have food sensitivities', 'Needs high-quality protein'],
    lifespan: '12-15 years'
  }
};

// Common cat breed data
const CAT_BREEDS: Record<string, BreedData> = {
  'persian': {
    species: 'cat',
    commonIssues: ['Polycystic kidney disease', 'Breathing issues', 'Eye problems'],
    groomingNeeds: 'Daily brushing required. Professional grooming recommended.',
    exerciseNeeds: 'Low activity. Enjoys quiet play.',
    dietaryNotes: ['May need special diet for kidney health', 'Flat face may affect eating'],
    lifespan: '12-17 years'
  },
  'siamese': {
    species: 'cat',
    commonIssues: ['Dental disease', 'Asthma', 'Heart disease'],
    groomingNeeds: 'Low maintenance. Weekly brushing sufficient.',
    exerciseNeeds: 'High energy. Very vocal and social.',
    dietaryNotes: ['May be picky eaters', 'High protein diet recommended'],
    lifespan: '15-20 years'
  },
  'maine coon': {
    species: 'cat',
    commonIssues: ['Hip dysplasia', 'Hypertrophic cardiomyopathy', 'Spinal muscular atrophy'],
    groomingNeeds: 'Regular brushing (3-4x/week). Check for mats.',
    exerciseNeeds: 'Moderate. Playful and enjoys climbing.',
    dietaryNotes: ['Large breed - needs higher calorie intake', 'Monitor for obesity'],
    lifespan: '12-15 years'
  },
  'ragdoll': {
    species: 'cat',
    commonIssues: ['Hypertrophic cardiomyopathy', 'Bladder stones', 'Obesity'],
    groomingNeeds: 'Moderate. Brush 2-3x/week to prevent tangles.',
    exerciseNeeds: 'Low to moderate. Calm and docile.',
    dietaryNotes: ['Prone to overeating', 'May need weight management food'],
    lifespan: '15-20 years'
  }
};

// Generic pet care tips when breed is unknown
const GENERIC_DOG_TIPS: PetCareTip[] = [
  { category: 'health', tip: 'Annual vet checkups and vaccinations are essential' },
  { category: 'health', tip: 'Keep heartworm and flea prevention up to date' },
  { category: 'grooming', tip: 'Regular nail trims prevent pain and mobility issues' },
  { category: 'exercise', tip: 'Daily walks and playtime keep dogs healthy and happy' },
  { category: 'diet', tip: 'Fresh water should always be available' },
  { category: 'diet', tip: 'Avoid toxic foods: chocolate, grapes, onions, xylitol' }
];

const GENERIC_CAT_TIPS: PetCareTip[] = [
  { category: 'health', tip: 'Annual vet exams catch issues early' },
  { category: 'health', tip: 'Indoor cats still need flea prevention' },
  { category: 'grooming', tip: 'Regular brushing reduces hairballs' },
  { category: 'exercise', tip: 'Interactive toys prevent boredom and obesity' },
  { category: 'diet', tip: 'Cats are obligate carnivores - need meat-based diet' },
  { category: 'diet', tip: 'Avoid toxic foods: onions, garlic, chocolate, lilies' }
];

export function getPetCareTips(species: string, breed?: string): PetCareTip[] {
  const speciesLower = species.toLowerCase();
  const breedLower = breed?.toLowerCase() || '';

  // Try to find specific breed data
  let breedData: BreedData | undefined;
  
  if (speciesLower.includes('dog')) {
    breedData = DOG_BREEDS[breedLower];
    
    if (breedData) {
      return [
        { category: 'health', tip: `Common health issues: ${breedData.commonIssues.join(', ')}` },
        { category: 'grooming', tip: breedData.groomingNeeds },
        { category: 'exercise', tip: breedData.exerciseNeeds },
        { category: 'diet', tip: breedData.dietaryNotes.join('. ') },
        { category: 'lifespan', tip: `Expected lifespan: ${breedData.lifespan}` }
      ];
    }
    
    return GENERIC_DOG_TIPS;
  }
  
  if (speciesLower.includes('cat')) {
    breedData = CAT_BREEDS[breedLower];
    
    if (breedData) {
      return [
        { category: 'health', tip: `Common health issues: ${breedData.commonIssues.join(', ')}` },
        { category: 'grooming', tip: breedData.groomingNeeds },
        { category: 'exercise', tip: breedData.exerciseNeeds },
        { category: 'diet', tip: breedData.dietaryNotes.join('. ') },
        { category: 'lifespan', tip: `Expected lifespan: ${breedData.lifespan}` }
      ];
    }
    
    return GENERIC_CAT_TIPS;
  }

  // Unknown species
  return [
    { category: 'health', tip: 'Regular veterinary checkups are important for all pets' },
    { category: 'diet', tip: 'Provide species-appropriate food and fresh water' },
    { category: 'exercise', tip: 'Ensure adequate physical and mental stimulation' }
  ];
}
