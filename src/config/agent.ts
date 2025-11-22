// Centralized ElevenLabs Agent Configuration
// Single source of truth for agent settings

export const ELEVENLABS_CONFIG = {
  agentId: "agent_0501kakwnx5rffaby5px9y1pskkb",
  voiceId: "9BWtsMINqrJLrRacOk9x", // Aria
  model: "eleven_turbo_v2_5",
  promptVersion: "v2.0-master-brain"
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
