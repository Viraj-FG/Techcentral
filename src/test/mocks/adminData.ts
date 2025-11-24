export const mockAdminUser = {
  id: 'd0ac4e49-ef8f-4820-87e5-94691a88eb5f',
  email: 'admin@example.com',
  role: 'admin',
  user_metadata: {
    email: "admin@example.com",
    email_verified: true,
    phone_verified: false,
    sub: "d0ac4e49-ef8f-4820-87e5-94691a88eb5f"
  },
};

export const mockRealProfile = {
  id: "d0ac4e49-ef8f-4820-87e5-94691a88eb5f",
  created_at: "2025-11-24T03:32:14.40236+00:00",
  updated_at: "2025-11-24T18:11:47.612662+00:00",
  onboarding_completed: true,
  user_name: "Alex Morgan",
  language: "English",
  dietary_preferences: ["vegetarian", "gluten-free"],
  allergies: ["peanuts", "shellfish"],
  beauty_profile: {},
  health_goals: ["maintain weight", "increase energy"],
  lifestyle_goals: [],
  household_adults: 1,
  household_kids: 0,
  agent_configured: false,
  agent_configured_at: null,
  permissions_granted: true,
  preferred_retailer_id: null,
  preferred_retailer_name: null,
  user_zip_code: "10001",
  last_retailer_refresh: null,
  user_age: 34,
  user_weight: 68,
  user_height: 165,
  user_gender: "female",
  user_activity_level: "moderately_active",
  calculated_tdee: 2100,
  agent_last_configured_at: null,
  agent_prompt_version: "v1.0",
  current_household_id: "7c8adf93-25f8-4df3-9b71-8a12664ea576"
};

export const mockProfiles = [
  mockRealProfile,
  ...Array.from({ length: 49 }, (_, i) => ({
    id: `user-${i}`,
    user_name: `User ${i}`,
    full_name: `Test User ${i}`,
    onboarding_completed: i % 3 !== 0, // 2/3 completed
    created_at: new Date(Date.now() - i * 86400000).toISOString(), // Spread over days
    updated_at: new Date().toISOString(),
  }))
];

export const mockSystemLogs = [
  { id: '1', level: 'info', message: 'System started', created_at: new Date().toISOString(), source: 'system' },
  { id: '2', level: 'warning', message: 'High memory usage', created_at: new Date(Date.now() - 10000).toISOString(), source: 'monitor' },
  { id: '3', level: 'error', message: 'Database connection failed', created_at: new Date(Date.now() - 20000).toISOString(), source: 'db' },
  { id: '4', level: 'info', message: 'User logged in', created_at: new Date(Date.now() - 30000).toISOString(), source: 'auth' },
  { id: '5', level: 'info', message: 'Backup completed', created_at: new Date(Date.now() - 40000).toISOString(), source: 'backup' },
];

export const mockAgentStatus = [
  { id: '1', name: 'Agent Alpha', status: 'online', last_ping: new Date().toISOString(), version: '1.0.0' },
  { id: '2', name: 'Agent Beta', status: 'offline', last_ping: new Date(Date.now() - 3600000).toISOString(), version: '1.0.0' },
  { id: '3', name: 'Agent Gamma', status: 'maintenance', last_ping: new Date().toISOString(), version: '1.1.0' },
];

export const mockConversationMetrics = [
  { id: '1', started_at: new Date().toISOString(), completed: true, message_count: 5, duration: 120 },
  { id: '2', started_at: new Date(Date.now() - 3600000).toISOString(), completed: true, message_count: 10, duration: 300 },
  { id: '3', started_at: new Date(Date.now() - 7200000).toISOString(), completed: false, message_count: 2, duration: 60 },
];

export const mockConversationEvents = [
  {
    id: '1',
    conversation_id: 'conv-1',
    user_id: 'user-1',
    agent_type: 'assistant',
    event_type: 'user_transcript',
    event_data: { text: 'Hello World Event' },
    role: 'user',
    created_at: new Date().toISOString(),
  },
  {
    id: '2',
    conversation_id: 'conv-1',
    user_id: 'user-1',
    agent_type: 'assistant',
    event_type: 'agent_response',
    event_data: { text: 'Hello! How can I help you?' },
    role: 'assistant',
    created_at: new Date(Date.now() + 1000).toISOString(),
  }
];

export const mockRealInventory = [
  {
    "id": "de2131ee-4e4b-40aa-af41-37703ba41058",
    "created_at": "2025-11-24T18:12:04.200237+00:00",
    "updated_at": "2025-11-24T18:12:04.200237+00:00",
    "name": "Organic Whole Milk",
    "category": "fridge",
    "quantity": 1,
    "unit": "gallon",
    "fill_level": 75,
    "expiry_date": "2025-11-26",
    "status": "sufficient",
    "auto_order_enabled": true,
    "reorder_threshold": 20,
    "fatsecret_id": null,
    "product_image_url": null,
    "nutrition_data": {
      "fat": 8,
      "carbs": 12,
      "protein": 8,
      "calories": 150
    },
    "allergens": [
      "dairy"
    ],
    "dietary_flags": null,
    "barcode": null,
    "brand_name": null,
    "last_enriched_at": null,
    "last_activity_at": "2025-11-24T18:12:04.200237+00:00",
    "consumption_rate": null,
    "original_quantity": null,
    "household_id": "7c8adf93-25f8-4df3-9b71-8a12664ea576"
  },
  {
    "id": "253af46e-c726-462c-9271-90ab717967ee",
    "created_at": "2025-11-24T18:12:04.200237+00:00",
    "updated_at": "2025-11-24T18:12:04.200237+00:00",
    "name": "Free Range Eggs",
    "category": "fridge",
    "quantity": 6,
    "unit": "count",
    "fill_level": 25,
    "expiry_date": "2025-12-04",
    "status": "low",
    "auto_order_enabled": true,
    "reorder_threshold": 20,
    "fatsecret_id": null,
    "product_image_url": null,
    "nutrition_data": {
      "fat": 5,
      "carbs": 1,
      "protein": 6,
      "calories": 70
    },
    "allergens": [
      "eggs"
    ],
    "dietary_flags": null,
    "barcode": null,
    "brand_name": null,
    "last_enriched_at": null,
    "last_activity_at": "2025-11-24T18:12:04.200237+00:00",
    "consumption_rate": null,
    "original_quantity": null,
    "household_id": "7c8adf93-25f8-4df3-9b71-8a12664ea576"
  },
  {
    "id": "373813ca-5397-45bd-9d93-ed3986255989",
    "created_at": "2025-11-24T18:12:04.200237+00:00",
    "updated_at": "2025-11-24T18:12:04.200237+00:00",
    "name": "Chicken Breast",
    "category": "fridge",
    "quantity": 1.5,
    "unit": "lbs",
    "fill_level": 80,
    "expiry_date": "2025-11-27",
    "status": "sufficient",
    "auto_order_enabled": false,
    "reorder_threshold": 20,
    "fatsecret_id": null,
    "product_image_url": null,
    "nutrition_data": {
      "fat": 3.6,
      "carbs": 0,
      "protein": 31,
      "calories": 165
    },
    "allergens": [],
    "dietary_flags": null,
    "barcode": null,
    "brand_name": null,
    "last_enriched_at": null,
    "last_activity_at": "2025-11-24T18:12:04.200237+00:00",
    "consumption_rate": null,
    "original_quantity": null,
    "household_id": "7c8adf93-25f8-4df3-9b71-8a12664ea576"
  },
  {
    "id": "28f3224b-ec8b-4361-ad49-1db08cca3a83",
    "created_at": "2025-11-24T18:12:04.200237+00:00",
    "updated_at": "2025-11-24T18:12:04.200237+00:00",
    "name": "Greek Yogurt",
    "category": "fridge",
    "quantity": 2,
    "unit": "containers",
    "fill_level": 65,
    "expiry_date": "2025-12-01",
    "status": "sufficient",
    "auto_order_enabled": true,
    "reorder_threshold": 20,
    "fatsecret_id": null,
    "product_image_url": null,
    "nutrition_data": {
      "fat": 0,
      "carbs": 6,
      "protein": 17,
      "calories": 100
    },
    "allergens": [
      "dairy"
    ],
    "dietary_flags": null,
    "barcode": null,
    "brand_name": null,
    "last_enriched_at": null,
    "last_activity_at": "2025-11-24T18:12:04.200237+00:00",
    "consumption_rate": null,
    "original_quantity": null,
    "household_id": "7c8adf93-25f8-4df3-9b71-8a12664ea576"
  },
  {
    "id": "a8453328-15b6-42ab-9926-951f52ac5163",
    "created_at": "2025-11-24T18:12:04.200237+00:00",
    "updated_at": "2025-11-24T18:12:04.200237+00:00",
    "name": "Bell Peppers",
    "category": "fridge",
    "quantity": 3,
    "unit": "count",
    "fill_level": 90,
    "expiry_date": "2025-11-29",
    "status": "sufficient",
    "auto_order_enabled": false,
    "reorder_threshold": 20,
    "fatsecret_id": null,
    "product_image_url": null,
    "nutrition_data": {
      "fat": 0,
      "carbs": 6,
      "protein": 1,
      "calories": 31
    },
    "allergens": [],
    "dietary_flags": null,
    "barcode": null,
    "brand_name": null,
    "last_enriched_at": null,
    "last_activity_at": "2025-11-24T18:12:04.200237+00:00",
    "consumption_rate": null,
    "original_quantity": null,
    "household_id": "7c8adf93-25f8-4df3-9b71-8a12664ea576"
  }
];
