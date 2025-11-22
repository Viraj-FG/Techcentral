# Kaeva Master Blueprint

## Complete Application Architecture & User Journey

---

## 1. Authentication & Onboarding Flow

```mermaid
graph TD
    Start[User Opens App] --> CheckAuth{Authenticated?}
    CheckAuth -->|No| AuthPage[Auth Page]
    CheckAuth -->|Yes| CheckProfile{Profile Complete?}
    
    AuthPage --> EmailAuth[Email/Password]
    AuthPage --> GoogleAuth[Google OAuth]
    EmailAuth --> CreateProfile[Create Profile Entry]
    GoogleAuth --> CreateProfile
    CreateProfile --> CheckProfile
    
    CheckProfile -->|No| PermReq[Permission Request]
    CheckProfile -->|Yes| Dashboard[Dashboard]
    
    PermReq --> ReqMic[Request Microphone]
    PermReq --> ReqCam[Request Camera]
    PermReq --> ReqLoc[Request Location]
    ReqMic --> AllGranted{All Granted?}
    ReqCam --> AllGranted
    ReqLoc --> AllGranted
    
    AllGranted -->|Yes| VoiceOnboard[Voice Onboarding]
    AllGranted -->|No| ManualOnboard[Manual Onboarding]
    
    VoiceOnboard --> ConfigAgent[configure-elevenlabs-agent]
    ConfigAgent --> ElevenLabs[ElevenLabs Conversation]
    ElevenLabs --> CollectBio[Collect Biometrics]
    ElevenLabs --> CollectDiet[Collect Dietary Info]
    ElevenLabs --> CollectHouse[Collect Household Data]
    
    CollectBio --> UpdateProfile[Update profiles table]
    CollectDiet --> UpdateProfile
    CollectHouse --> CreateMembers[Create household_members]
    CollectHouse --> CreatePets[Create pets entries]
    
    UpdateProfile --> MarkComplete[Set onboarding_completed=true]
    CreateMembers --> MarkComplete
    CreatePets --> MarkComplete
    MarkComplete --> Dashboard
    ManualOnboard --> Dashboard
```

---

## 2. Dashboard Architecture

```mermaid
graph TB
    Dashboard[Dashboard Component] --> VoiceAssist[Voice Assistant]
    Dashboard --> PulseHeader[Pulse Header]
    Dashboard --> SafetyShield[Safety Shield]
    Dashboard --> HouseholdQuick[Household Quick Access]
    Dashboard --> NutritionWidget[Nutrition Widget]
    Dashboard --> SmartCart[Smart Cart Widget]
    Dashboard --> InventoryMatrix[Inventory Matrix]
    Dashboard --> RecentActivity[Recent Activity]
    Dashboard --> FAB[Floating Action Button]
    
    VoiceAssist --> WakeWord[Hey Kaeva Detection]
    VoiceAssist --> ElevenLabs[ElevenLabs Agent]
    ElevenLabs --> ClientTools[Client Tools]
    ClientTools --> SearchInv[searchInventory]
    ClientTools --> SuggestRecipe[suggestRecipes]
    ClientTools --> AddToCart[addToShoppingList]
    
    PulseHeader --> UserGreet[User Greeting]
    PulseHeader --> QuickStats[Quick Stats]
    
    SafetyShield --> AllergyCheck[Allergy Monitoring]
    SafetyShield --> ToxicCheck[Pet Toxicity Check]
    SafetyShield --> QueryProfiles[Query profiles.allergies]
    SafetyShield --> QueryPets[Query pets.toxic_flags_enabled]
    
    HouseholdQuick --> FetchMembers[Fetch household_members]
    HouseholdQuick --> DisplayCards[Display Member Cards]
    
    NutritionWidget --> FetchTDEE[Fetch profiles.calculated_tdee]
    NutritionWidget --> FetchMeals[Fetch Today's meal_logs]
    NutritionWidget --> CalcProgress[Calculate Calories Progress]
    NutritionWidget --> DisplayPhotos[Display 3 Meal Photos]
    
    SmartCart --> FetchLowInv[Fetch Low Inventory]
    SmartCart --> CheckStatus{status=low|critical?}
    CheckStatus --> DisplayList[Display Shopping List]
    
    InventoryMatrix --> FetchAllInv[Fetch All Inventory Items]
    InventoryMatrix --> GroupByCat[Group by Category]
    InventoryMatrix --> DisplayFridge[Fridge Items]
    InventoryMatrix --> DisplayPantry[Pantry Items]
    InventoryMatrix --> DisplayBeauty[Beauty Items]
    InventoryMatrix --> DisplayPets[Pet Items]
    
    RecentActivity --> FetchActivity[Fetch Last 10 Activities]
    RecentActivity --> ShowTimeline[Show Timeline]
    
    FAB --> OpenScanner[Open Smart Scanner]
```

---

## 3. Smart Scanner Complete Flow

```mermaid
graph TD
    ScanStart[User Opens Scanner] --> CaptureMode{Capture Mode}
    
    CaptureMode --> SingleCapture[Single Frame Capture]
    CaptureMode --> HoldRecord[Hold to Record]
    
    SingleCapture --> DetectIntent[detect-intent Edge Function]
    HoldRecord --> RecordFrames[Capture Multiple Frames]
    RecordFrames --> Deduplicate[Deduplicate Items]
    Deduplicate --> DetectIntent
    
    DetectIntent --> GeminiVision[Google Gemini 1.5 Flash Vision]
    GeminiVision --> ClassifyIntent{Classify Intent}
    
    ClassifyIntent --> InventorySweep[INVENTORY_SWEEP]
    ClassifyIntent --> NutritionTrack[NUTRITION_TRACK]
    ClassifyIntent --> ProductAnalysis[PRODUCT_ANALYSIS]
    ClassifyIntent --> PetId[PET_ID]
    ClassifyIntent --> VanitySweep[VANITY_SWEEP]
    ClassifyIntent --> ApplianceScan[APPLIANCE_SCAN]
    ClassifyIntent --> EmptyPackage[EMPTY_PACKAGE]
    
    InventorySweep --> EnrichProduct[enrich-product Function]
    EnrichProduct --> FatSecretAPI[FatSecret API]
    FatSecretAPI --> GetNutrition[Get Nutrition Data]
    GetNutrition --> InsertInventory[Insert into inventory table]
    InsertInventory --> ShowInventoryResult[InventorySweepResult UI]
    
    NutritionTrack --> CheckSubtype{Subtype?}
    CheckSubtype -->|raw| SuggestRecipes[suggest-recipes Function]
    CheckSubtype -->|cooked| AnalyzeMeal[analyze-meal Function]
    
    SuggestRecipes --> GeminiRecipe[Gemini Recipe Generation]
    GeminiRecipe --> ShowRecipes[Show Recipe Cards]
    ShowRecipes --> OrderIngredients[Order Ingredients Button]
    OrderIngredients --> CreateCart[instacart-create-cart]
    
    AnalyzeMeal --> GeminiMealVision[Gemini Vision: Detect Items]
    GeminiMealVision --> ExtractItems[Extract Item Names & Quantities]
    ExtractItems --> EnrichEachItem[For Each Item: Call FatSecret]
    EnrichEachItem --> GetItemNutrition[Get calories, protein, carbs, fat, fiber]
    GetItemNutrition --> AggregateTotals[Aggregate Total Macros]
    AggregateTotals --> ShowNutritionResult[NutritionTrackResult UI]
    
    ShowNutritionResult --> DisplayPhoto[Display Captured Photo]
    ShowNutritionResult --> DisplayItems[Display Item Breakdown]
    ShowNutritionResult --> DisplayChart[Display Macro Pie Chart]
    ShowNutritionResult --> EditButton[Edit Item Button]
    ShowNutritionResult --> LogButton[Log Meal Button]
    
    EditButton --> SearchModal[Open Search Modal]
    SearchModal --> SearchFatSecret[Call enrich-product]
    SearchFatSecret --> SelectReplacement[Select Replacement Item]
    SelectReplacement --> UpdateItem[Update Item in List]
    UpdateItem --> RecalcMacros[Recalculate Macros]
    RecalcMacros --> ShowNutritionResult
    
    LogButton --> InsertMealLog[Insert into meal_logs]
    InsertMealLog --> SaveImage[Save image_url]
    InsertMealLog --> SaveItems[Save items JSON]
    InsertMealLog --> SaveMacros[Save calories, protein, carbs, fat, fiber]
    InsertMealLog --> SaveTimestamp[Save logged_at timestamp]
    SaveTimestamp --> ShowToast[Show Success Toast]
    ShowToast --> RefreshWidget[Refresh NutritionWidget]
    RefreshWidget --> CloseScan[Close Scanner]
    
    ProductAnalysis --> IdentifyProduct[identify-product Function]
    IdentifyProduct --> OpenFoodFacts[OpenFoodFacts API]
    OpenFoodFacts --> GetBarcode[Get Barcode Data]
    GetBarcode --> GetIngredients[Get Ingredients List]
    GetIngredients --> CheckAllergens[Check Against User Allergies]
    CheckAllergens --> CalcTruthScore[Calculate Truth Score]
    CalcTruthScore --> ShowProductResult[ProductAnalysisResult UI]
    
    PetId --> GeminiPetVision[Gemini Vision: Identify Pet]
    GeminiPetVision --> DetectSpecies[Detect Species]
    DetectSpecies --> DetectBreed[Detect Breed]
    DetectBreed --> ShowPetResult[PetIdResult UI]
    ShowPetResult --> EnterName[Enter Pet Name]
    EnterName --> InsertPet[Insert into pets table]
    
    VanitySweep --> GeminiBeautyVision[Gemini Vision: Detect Beauty Products]
    GeminiBeautyVision --> ExtractPAO[Extract PAO Symbol]
    ExtractPAO --> CalcExpiry[Calculate Expiry Date]
    CalcExpiry --> InsertBeauty[Insert into inventory with category=beauty]
    InsertBeauty --> ShowVanityResult[VanitySweepResult UI]
    
    ApplianceScan --> GeminiApplianceVision[Gemini Vision: Detect Appliances]
    GeminiApplianceVision --> DetectBrand[Detect Brand/Model]
    DetectBrand --> UpdateProfileAppliances[Update profiles.beauty_profile]
    UpdateProfileAppliances --> ShowApplianceResult[ApplianceScanResult UI]
    ShowApplianceResult --> UnlockRecipes[Show Unlocked Recipes]
    
    EmptyPackage --> FindInventory[Find Item in inventory]
    FindInventory --> MarkOut[Set status=out_of_stock]
    MarkOut --> AddToShoppingList[Insert into shopping_list]
    AddToShoppingList --> ShowEmptyResult[Show Confirmation]
```

---

## 4. Voice Assistant Post-Onboarding

```mermaid
graph TD
    VoiceStart[Voice Assistant Active] --> ListenWake[Listen for Wake Word]
    ListenWake --> DetectWake{Detect Hey Kaeva?}
    
    DetectWake -->|No| ListenWake
    DetectWake -->|Yes| PlayWakeSound[Play wake.mp3]
    PlayWakeSound --> ShowKaevaAperture[Show Kaeva Aperture Animation]
    ShowKaevaAperture --> StartConversation[Start ElevenLabs Conversation]
    
    StartConversation --> AgentListens[Agent Listens to User]
    AgentListens --> ProcessIntent{Intent?}
    
    ProcessIntent --> SearchIntent[Search Inventory]
    ProcessIntent --> RecipeIntent[Suggest Recipes]
    ProcessIntent --> AddCartIntent[Add to Shopping List]
    ProcessIntent --> CheckNutritionIntent[Check Nutrition]
    ProcessIntent --> GeneralQuery[General Question]
    
    SearchIntent --> CallSearchTool[Call searchInventory Client Tool]
    CallSearchTool --> QueryInventoryDB[Query inventory table]
    QueryInventoryDB --> ReturnResults[Return Results to Agent]
    ReturnResults --> AgentResponds[Agent Speaks Response]
    
    RecipeIntent --> CallRecipeTool[Call suggestRecipes Client Tool]
    CallRecipeTool --> FetchUserProfile[Fetch profiles data]
    FetchUserProfile --> FetchInventoryItems[Fetch inventory items]
    FetchInventoryItems --> CallSuggestRecipes[Call suggest-recipes Edge Function]
    CallSuggestRecipes --> GeminiRecipes[Gemini Recipe Generation]
    GeminiRecipes --> ReturnRecipes[Return Recipes to Agent]
    ReturnRecipes --> AgentResponds
    
    AddCartIntent --> CallAddTool[Call addToShoppingList Client Tool]
    CallAddTool --> InsertShopping[Insert into shopping_list]
    InsertShopping --> ReturnConfirm[Return Confirmation]
    ReturnConfirm --> AgentResponds
    
    CheckNutritionIntent --> QueryMealLogs[Query meal_logs]
    QueryMealLogs --> CalcDailyTotals[Calculate Daily Totals]
    CalcDailyTotals --> CompareTDEE[Compare to TDEE]
    CompareTDEE --> ReturnNutritionData[Return Nutrition Data]
    ReturnNutritionData --> AgentResponds
    
    GeneralQuery --> AgentKnowledge[Agent Knowledge Base]
    AgentKnowledge --> AgentResponds
    
    AgentResponds --> ConversationEnd{Conversation Complete?}
    ConversationEnd -->|No| AgentListens
    ConversationEnd -->|Yes| HideAperture[Hide Aperture]
    HideAperture --> BackToSleep[Back to Sleep Mode]
    BackToSleep --> ListenWake
```

---

## 5. Household Management Flow

```mermaid
graph TD
    HouseholdPage[/household Route] --> FetchProfile[Fetch User Profile]
    HouseholdPage --> FetchMembers[Fetch household_members]
    HouseholdPage --> FetchPets[Fetch pets]
    
    FetchProfile --> DisplayUserCard[Display User DigitalTwinCard]
    FetchMembers --> DisplayMemberCards[Display Member Cards]
    FetchPets --> DisplayPetCards[Display Pet Cards]
    
    DisplayUserCard --> EditUser{Edit User?}
    DisplayMemberCards --> EditMember{Edit Member?}
    DisplayMemberCards --> AddMember{Add Member?}
    DisplayPetCards --> EditPet{Edit Pet?}
    
    EditUser --> OpenForm[Open HouseholdMemberForm]
    EditMember --> OpenForm
    AddMember --> OpenForm
    
    OpenForm --> EnterData[Enter/Edit Data]
    EnterData --> CalcTDEE[Calculate TDEE]
    CalcTDEE --> ValidateForm[Validate Form]
    ValidateForm --> SaveMember{Save?}
    
    SaveMember -->|New| InsertMember[Insert into household_members]
    SaveMember -->|Existing| UpdateMember[Update household_members]
    
    InsertMember --> RefreshList[Refresh Member List]
    UpdateMember --> RefreshList
    RefreshList --> ShowSuccess[Show Success Toast]
    
    EditPet --> OpenPetForm[Open Pet Form]
    OpenPetForm --> EnterPetData[Enter Pet Data]
    EnterPetData --> SavePet[Update pets table]
    SavePet --> RefreshPets[Refresh Pet List]
    
    DisplayUserCard --> InviteLink[Generate Invite Link]
    InviteLink --> ShareLink[Share Family Invite]
```

---

## 6. Smart Cart & Instacart Integration

```mermaid
graph TD
    SmartCartWidget[Smart Cart Widget] --> CheckRetailer{Retailer Selected?}
    
    CheckRetailer -->|No| OpenStoreSelector[Open StoreSelector]
    CheckRetailer -->|Yes| FetchShoppingList[Fetch shopping_list items]
    
    OpenStoreSelector --> RequestLocation[Request Geolocation]
    RequestLocation --> GetCoords[Get Coordinates]
    GetCoords --> ReverseGeocode[Nominatim Reverse Geocode]
    ReverseGeocode --> ExtractZip[Extract Zip Code]
    ExtractZip --> CallInstacartService[instacart-service Function]
    
    CallInstacartService --> InstacartAPI[Instacart API]
    InstacartAPI --> FetchRetailers[Fetch Nearby Retailers]
    FetchRetailers --> DisplayStores[Display Store List]
    DisplayStores --> UserSelectStore[User Selects Store]
    UserSelectStore --> SaveRetailer[Update profiles.preferred_retailer_id]
    SaveRetailer --> SaveRetailerName[Update profiles.preferred_retailer_name]
    SaveRetailerName --> FetchShoppingList
    
    FetchShoppingList --> DisplayItems[Display Shopping List Items]
    DisplayItems --> CheckoutButton[Checkout Button]
    
    CheckoutButton --> CallCreateCart[instacart-create-cart Function]
    CallCreateCart --> PrepareCartData[Prepare Cart Items]
    PrepareCartData --> InstacartCreateAPI[Instacart Create Cart API]
    InstacartCreateAPI --> GetCartURL[Get Instacart Cart URL]
    GetCartURL --> RedirectUser[Redirect to Instacart]
    
    RedirectUser --> UserCompletes[User Completes Purchase]
    UserCompletes --> WebhookCallback[Instacart Webhook Callback]
    WebhookCallback --> UpdateInventory[Update inventory quantities]
    UpdateInventory --> ClearShoppingList[Clear shopping_list items]
```

---

## 7. Settings Management

```mermaid
graph TD
    SettingsPage[/settings Route] --> TabSelection{Tab Selected}
    
    TabSelection --> ProfileTab[Profile Tab]
    TabSelection --> SafetyTab[Safety Tab]
    TabSelection --> HouseholdTab[Household Tab]
    TabSelection --> HistoryTab[History Tab]
    TabSelection --> StoreTab[Store Tab]
    
    ProfileTab --> EditName[Edit Name]
    ProfileTab --> EditBio[Edit Biometrics]
    ProfileTab --> EditActivity[Edit Activity Level]
    EditName --> UpdateProfile[Update profiles table]
    EditBio --> RecalcTDEE[Recalculate TDEE]
    RecalcTDEE --> UpdateProfile
    EditActivity --> RecalcTDEE
    UpdateProfile --> SaveProfile[Save Changes]
    
    SafetyTab --> EditAllergies[Edit Allergies]
    SafetyTab --> EditDietary[Edit Dietary Restrictions]
    SafetyTab --> EditHealth[Edit Health Conditions]
    EditAllergies --> UpdateProfile
    EditDietary --> UpdateProfile
    EditHealth --> UpdateProfile
    
    HouseholdTab --> ViewMembers[View Members Summary]
    ViewMembers --> LinkToHousehold[Link to /household]
    
    HistoryTab --> ViewMealLogs[View meal_logs History]
    ViewMealLogs --> FilterByDate[Filter by Date]
    FilterByDate --> ExportData[Export Option]
    
    StoreTab --> ChangeStore[Change Preferred Store]
    ChangeStore --> OpenStoreSelector2[Open Store Selector]
    OpenStoreSelector2 --> UpdateRetailer[Update profiles.preferred_retailer_id]
```

---

## 8. Database Schema & Relationships

```mermaid
erDiagram
    profiles ||--o{ household_members : "has"
    profiles ||--o{ pets : "has"
    profiles ||--o{ inventory : "owns"
    profiles ||--o{ meal_logs : "logs"
    profiles ||--o{ shopping_list : "maintains"
    profiles ||--o{ notifications : "receives"
    profiles ||--o{ conversation_history : "has"
    profiles ||--o{ user_roles : "has"
    inventory ||--o| shopping_list : "links"
    
    profiles {
        uuid id PK
        string user_name
        int user_age
        string user_gender
        float user_height
        float user_weight
        string user_activity_level
        int calculated_tdee
        json allergies
        json dietary_preferences
        json health_goals
        json lifestyle_goals
        json beauty_profile
        int household_adults
        int household_kids
        string language
        string preferred_retailer_id
        string preferred_retailer_name
        timestamp last_retailer_refresh
        boolean agent_configured
        timestamp agent_configured_at
        string agent_prompt_version
        boolean onboarding_completed
        boolean permissions_granted
        string user_zip_code
    }
    
    household_members {
        uuid id PK
        uuid user_id FK
        string member_type
        string name
        int age
        string age_group
        string gender
        float height
        float weight
        string activity_level
        int calculated_tdee
        json allergies
        json dietary_restrictions
        json health_conditions
        json medication_interactions
    }
    
    pets {
        uuid id PK
        uuid user_id FK
        string name
        string species
        string breed
        int age
        boolean toxic_flags_enabled
        text notes
    }
    
    inventory {
        uuid id PK
        uuid user_id FK
        string name
        string brand_name
        string barcode
        enum category
        int quantity
        string unit
        float fill_level
        date expiry_date
        enum status
        json nutrition_data
        json allergens
        json dietary_flags
        string product_image_url
        string fatsecret_id
        timestamp last_enriched_at
        timestamp last_activity_at
        boolean auto_order_enabled
        int reorder_threshold
    }
    
    meal_logs {
        uuid id PK
        uuid user_id FK
        timestamp logged_at
        string meal_type
        int calories
        float protein
        float carbs
        float fat
        float fiber
        json items
        string image_url
    }
    
    shopping_list {
        uuid id PK
        uuid user_id FK
        uuid inventory_id FK
        string item_name
        int quantity
        string unit
        string source
        enum status
        enum priority
    }
    
    notifications {
        uuid id PK
        uuid user_id FK
        string type
        string title
        text message
        json metadata
        boolean read
    }
    
    conversation_history {
        uuid id PK
        uuid user_id FK
        string conversation_id
        string role
        text message
        json metadata
    }
    
    user_roles {
        uuid id PK
        uuid user_id FK
        enum role
    }
    
    product_cache {
        uuid id PK
        string search_term
        json fatsecret_response
        json nutrition_summary
        string image_url
        timestamp cached_at
        timestamp expires_at
    }
```

---

## 9. Edge Functions Architecture

```mermaid
graph TB
    Client[React Frontend] --> EdgeFunc[Edge Functions]
    
    EdgeFunc --> CheckAdmin[check-admin]
    EdgeFunc --> ConfigAgent[configure-elevenlabs-agent]
    EdgeFunc --> DetectIntent[detect-intent]
    EdgeFunc --> IdentifyProduct[identify-product]
    EdgeFunc --> EnrichProduct[enrich-product]
    EdgeFunc --> AnalyzeMeal[analyze-meal]
    EdgeFunc --> SuggestRecipes[suggest-recipes]
    EdgeFunc --> CookRecipe[cook-recipe]
    EdgeFunc --> InstacartService[instacart-service]
    EdgeFunc --> InstacartCreateCart[instacart-create-cart]
    EdgeFunc --> NotifySpoilage[notify-spoilage]
    EdgeFunc --> GenerateSignedURL[generate-signed-url]
    
    CheckAdmin --> UserRoles[Query user_roles]
    UserRoles --> ReturnAdmin{role=admin?}
    
    ConfigAgent --> ElevenLabsAPI[ElevenLabs API]
    ElevenLabsAPI --> CreateAgent[Create/Update Agent]
    CreateAgent --> SetPrompt[Set System Prompt]
    SetPrompt --> RegisterTools[Register Client Tools]
    RegisterTools --> ReturnAgentID[Return Agent ID]
    
    DetectIntent --> GeminiAPI1[Google Gemini Vision API]
    GeminiAPI1 --> AnalyzeImage[Analyze Image]
    AnalyzeImage --> ClassifyIntent2[Classify Intent]
    ClassifyIntent2 --> ExtractItems2[Extract Items]
    ExtractItems2 --> ReturnIntentData[Return Intent + Items]
    
    IdentifyProduct --> OpenFoodFactsAPI[OpenFoodFacts API]
    OpenFoodFactsAPI --> SearchBarcode[Search by Barcode]
    SearchBarcode --> GetProductInfo[Get Product Info]
    GetProductInfo --> ReturnProductData[Return Product Data]
    
    EnrichProduct --> CheckCache[Check product_cache]
    CheckCache --> CacheHit{Cache Hit?}
    CacheHit -->|Yes| ReturnCached[Return Cached Data]
    CacheHit -->|No| FatSecretSearch[FatSecret API Search]
    FatSecretSearch --> GetNutritionInfo[Get Nutrition Info]
    GetNutritionInfo --> StoreCache[Store in product_cache]
    StoreCache --> ReturnNutritionData2[Return Nutrition Data]
    
    AnalyzeMeal --> GeminiAPI2[Google Gemini Vision API]
    GeminiAPI2 --> DetectMealItems[Detect Items + Quantities]
    DetectMealItems --> ForEachItem[For Each Item]
    ForEachItem --> CallFatSecret[Call FatSecret]
    CallFatSecret --> GetMacros[Get Macros]
    GetMacros --> AggregateData[Aggregate Totals]
    AggregateData --> ReturnMealData[Return Items + Totals]
    
    SuggestRecipes --> FetchUserData[Fetch profiles + inventory]
    FetchUserData --> GeminiAPI3[Google Gemini API]
    GeminiAPI3 --> GenerateRecipes[Generate Recipes]
    GenerateRecipes --> ReturnRecipeList[Return Recipe List]
    
    CookRecipe --> ParseIngredients[Parse Recipe Ingredients]
    ParseIngredients --> LogRecipeItems[Log as meal_logs]
    LogRecipeItems --> ReturnSuccess[Return Success]
    
    InstacartService --> GetLocation[Get User Location]
    GetLocation --> InstacartRetailerAPI[Instacart Retailer API]
    InstacartRetailerAPI --> FetchStores[Fetch Nearby Stores]
    FetchStores --> ReturnStoreList[Return Store List]
    
    InstacartCreateCart --> GetShoppingList[Get shopping_list items]
    GetShoppingList --> InstacartCartAPI[Instacart Create Cart API]
    InstacartCartAPI --> CreateInstacartCart[Create Cart]
    CreateInstacartCart --> ReturnCartURL[Return Cart URL]
    
    NotifySpoilage --> CheckSpoilage[Call check_spoilage SQL Function]
    CheckSpoilage --> FindExpired[Find Expired Items]
    FindExpired --> CreateNotifications[Insert into notifications]
    CreateNotifications --> SendPush[Send Push Notification]
    
    GenerateSignedURL --> SupabaseStorage[Supabase Storage]
    SupabaseStorage --> CreateSignedURL[Create Signed URL]
    CreateSignedURL --> ReturnURL[Return URL]
```

---

## 10. Complete User Journey Timeline

```mermaid
gantt
    title Kaeva User Journey Timeline
    dateFormat YYYY-MM-DD
    section Authentication
    Land on app           :milestone, m1, 2024-01-01, 0d
    Email/Password signup :active, a1, 2024-01-01, 1d
    Create profile entry  :a2, after a1, 1d
    
    section Onboarding
    Request permissions   :a3, after a2, 1d
    Voice onboarding      :active, a4, after a3, 2d
    Collect biometrics    :a5, after a4, 1d
    Collect dietary info  :a6, after a5, 1d
    Add household members :a7, after a6, 1d
    Mark onboarding done  :milestone, m2, after a7, 0d
    
    section Dashboard Use
    View dashboard        :active, b1, after a7, 30d
    Voice assistant active:b2, after a7, 30d
    Nutrition tracking    :b3, after a7, 30d
    
    section Scanner Use
    First scan            :milestone, m3, 2024-01-10, 0d
    Inventory sweep       :c1, 2024-01-10, 5d
    Meal tracking         :active, c2, 2024-01-12, 20d
    Product analysis      :c3, 2024-01-15, 10d
    
    section Smart Cart
    Add items to cart     :d1, 2024-01-20, 10d
    First Instacart order :milestone, m4, 2024-01-25, 0d
    Checkout with Instacart:active, d2, 2024-01-25, 1d
    
    section Household
    Manage household      :e1, 2024-01-15, 20d
    Update member profiles:e2, 2024-01-20, 5d
```

---

## 11. Data Flow Summary

```mermaid
graph LR
    User[User] --> Frontend[React Frontend]
    Frontend --> Supabase[Supabase Client]
    
    Supabase --> Auth[Auth System]
    Supabase --> Database[PostgreSQL Database]
    Supabase --> Storage[File Storage]
    Supabase --> EdgeFunctions[Edge Functions]
    
    EdgeFunctions --> ExternalAPIs[External APIs]
    
    ExternalAPIs --> ElevenLabs[ElevenLabs]
    ExternalAPIs --> Gemini[Google Gemini]
    ExternalAPIs --> FatSecret[FatSecret]
    ExternalAPIs --> OpenFood[OpenFoodFacts]
    ExternalAPIs --> Instacart[Instacart]
    ExternalAPIs --> Nominatim[Nominatim Geocoding]
    
    Database --> Tables[Database Tables]
    Tables --> Profiles[profiles]
    Tables --> Members[household_members]
    Tables --> Pets[pets]
    Tables --> Inventory[inventory]
    Tables --> Meals[meal_logs]
    Tables --> Shopping[shopping_list]
    Tables --> Notifications[notifications]
    Tables --> Conversations[conversation_history]
    Tables --> Roles[user_roles]
    Tables --> Cache[product_cache]
    
    Frontend --> Components[UI Components]
    Components --> Dashboard2[Dashboard]
    Components --> Scanner[Smart Scanner]
    Components --> Voice[Voice Assistant]
    Components --> Household2[Household Management]
    Components --> Settings2[Settings]
    Components --> Admin[Admin Panel]
```

---

## 12. Security & RLS Policies

```mermaid
graph TD
    RLS[Row Level Security] --> ProfileRLS[profiles RLS]
    RLS --> MemberRLS[household_members RLS]
    RLS --> PetRLS[pets RLS]
    RLS --> InventoryRLS[inventory RLS]
    RLS --> MealRLS[meal_logs RLS]
    RLS --> ShoppingRLS[shopping_list RLS]
    RLS --> NotifRLS[notifications RLS]
    RLS --> ConvoRLS[conversation_history RLS]
    
    ProfileRLS --> ProfileSelect[SELECT: user_id = auth.uid]
    ProfileRLS --> ProfileUpdate[UPDATE: user_id = auth.uid]
    ProfileRLS --> ProfileInsert[INSERT: user_id = auth.uid]
    
    MemberRLS --> MemberSelect[SELECT: user_id = auth.uid]
    MemberRLS --> MemberUpdate[UPDATE: user_id = auth.uid]
    MemberRLS --> MemberInsert[INSERT: user_id = auth.uid]
    MemberRLS --> MemberDelete[DELETE: user_id = auth.uid]
    
    PetRLS --> PetSelect[SELECT: user_id = auth.uid]
    PetRLS --> PetUpdate[UPDATE: user_id = auth.uid]
    PetRLS --> PetInsert[INSERT: user_id = auth.uid]
    PetRLS --> PetDelete[DELETE: user_id = auth.uid]
    
    InventoryRLS --> InvSelect[SELECT: user_id = auth.uid]
    InventoryRLS --> InvUpdate[UPDATE: user_id = auth.uid]
    InventoryRLS --> InvInsert[INSERT: user_id = auth.uid]
    InventoryRLS --> InvDelete[DELETE: user_id = auth.uid]
    
    MealRLS --> MealSelect[SELECT: user_id = auth.uid]
    MealRLS --> MealInsert[INSERT: user_id = auth.uid]
    MealRLS --> MealUpdate[UPDATE: user_id = auth.uid]
    MealRLS --> MealDelete[DELETE: user_id = auth.uid]
    
    ShoppingRLS --> ShopSelect[SELECT: user_id = auth.uid]
    ShoppingRLS --> ShopInsert[INSERT: user_id = auth.uid]
    ShoppingRLS --> ShopUpdate[UPDATE: user_id = auth.uid]
    ShoppingRLS --> ShopDelete[DELETE: user_id = auth.uid]
    
    NotifRLS --> NotifSelect[SELECT: user_id = auth.uid]
    NotifRLS --> NotifUpdate[UPDATE: user_id = auth.uid]
    
    ConvoRLS --> ConvoSelect[SELECT: user_id = auth.uid]
    ConvoRLS --> ConvoInsert[INSERT: user_id = auth.uid]
```

---

## Summary

This master blueprint documents the complete Kaeva application architecture including:

- **Authentication & Onboarding**: Multi-step voice-first onboarding with ElevenLabs integration
- **Dashboard**: Real-time widgets for nutrition, inventory, household, and safety monitoring
- **Smart Scanner**: Multi-intent vision AI system with 7 different scanning modes
- **Meal Tracking**: Complete flow from image capture to nutrition analysis to meal logging
- **Voice Assistant**: Post-onboarding conversational AI with client tools
- **Household Management**: CRUD operations for family members and pets with TDEE calculations
- **Smart Cart**: Instacart integration with automatic shopping list management
- **Settings**: Comprehensive user preference management
- **Database**: Complete schema with RLS policies for security
- **Edge Functions**: 12 serverless functions integrating 6 external APIs
- **Security**: Row-level security policies protecting all user data

All diagrams use mermaid syntax and can be rendered in any markdown viewer or mermaid-compatible tool.
