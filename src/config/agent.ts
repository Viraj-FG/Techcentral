// Centralized ElevenLabs Agent Configuration
// Single source of truth for agent settings

export const ELEVENLABS_CONFIG = {
  agentId: "agent_0501kakwnx5rffaby5px9y1pskkb",
  voiceId: "9BWtsMINqrJLrRacOk9x", // Aria - warm and friendly
  model: "eleven_turbo_v2_5",
  promptVersion: "v3.0-structured-onboarding"
} as const;

export const AGENT_FEATURES = [
  {
    name: "The Palate",
    description: "Food preferences & allergies",
    color: "kaeva-sage"
  },
  {
    name: "The Mirror",
    description: "Skin type & hair type",
    color: "kaeva-terracotta"
  },
  {
    name: "The Tribe",
    description: "Household & pet details",
    color: "kaeva-electric-sky"
  },
  {
    name: "The Biome",
    description: "Health metrics & TDEE",
    color: "kaeva-sage"
  },
  {
    name: "The Mission",
    description: "Health & lifestyle goals",
    color: "kaeva-electric-sky"
  }
] as const;
