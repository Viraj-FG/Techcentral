// Centralized ElevenLabs Agent Configuration
// Single source of truth for agent settings

export const ELEVENLABS_CONFIG = {
  onboarding: {
    agentId: "agent_0501kakwnx5rffaby5px9y1pskkb",
    voiceId: "9BWtsMINqrJLrRacOk9x", // Aria - warm and friendly
    model: "eleven_turbo_v2_5",
    promptVersion: "v4.0-architect"
  },
  assistant: {
    agentId: "agent_2601kaqwv4ejfhets9fyyafzj2e6",
    voiceId: "9BWtsMINqrJLrRacOk9x", // Aria - warm and friendly
    model: "eleven_turbo_v2_5",
    promptVersion: "v2.0-operator"
  }
} as const;

export const AGENT_FEATURES = [
  {
    name: "The Palate",
    description: "Food preferences & allergies",
    color: "secondary"
  },
  {
    name: "The Mirror",
    description: "Skin type & hair type",
    color: "destructive"
  },
  {
    name: "The Tribe",
    description: "Household & pet details",
    color: "accent"
  },
  {
    name: "The Biome",
    description: "Health metrics & TDEE",
    color: "secondary"
  },
  {
    name: "The Mission",
    description: "Health & lifestyle goals",
    color: "accent"
  }
] as const;
