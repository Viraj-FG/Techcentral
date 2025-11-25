# Kaeva Documentation

Complete documentation for the Kaeva household management application.

## Table of Contents

1. [Architecture Overview](./ARCHITECTURE.md)
   - System Architecture
   - Routing Structure
   - Data Flow
   - State Management

2. [Component Reference](./COMPONENTS.md)
   - Screen Pages
   - Layout Components
   - Dashboard Components
   - Voice Components
   - Scanner Components
   - UI Components

3. [User Journeys](./USER_JOURNEYS.md)
   - Complete User Journey Map
   - Onboarding Flow
   - Daily Usage Patterns

4. [Database Schema](./DATABASE_SCHEMA.md)
   - Entity Relationship Diagram
   - Table Specifications
   - RLS Policies

5. [Edge Functions](./EDGE_FUNCTIONS.md)
   - Vision Processing
   - Nutrition Tracking
   - Shopping Integration
   - Household Management

6. [Custom Hooks](./HOOKS.md)
   - Voice Hooks
   - Realtime Hooks
   - Utility Hooks

## Diagrams

All diagrams are available in two formats:

- **Mermaid Source** (`/docs/diagrams/*.mmd`) - Editable source files
- **SVG Export** - Generate using the script in `/docs/scripts/generate-svgs.sh`

### Available Diagrams

- System Architecture
- Routing Structure
- Component Hierarchy
- Data Flow
- Database ERD
- User Journey Map
- Voice Architecture
- State Management Flow
- Edge Functions Map

## Generating SVG Diagrams

### Method 1: Using the Script (Recommended)

```bash
cd docs/scripts
./generate-svgs.sh
```

This requires [Mermaid CLI](https://github.com/mermaid-js/mermaid-cli) to be installed:

```bash
npm install -g @mermaid-js/mermaid-cli
```

### Method 2: Manual Export

1. Copy the content from any `.mmd` file in `/docs/diagrams/`
2. Paste into [Mermaid Live Editor](https://mermaid.live)
3. Click "Actions" → "Export SVG"

### Method 3: VS Code Extension

Install the [Mermaid Preview Extension](https://marketplace.visualstudio.com/items?itemName=bierner.markdown-mermaid) and export directly from VS Code.

## Technology Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS with custom design tokens
- **UI Components**: Radix UI, shadcn/ui
- **Animation**: Framer Motion
- **Backend**: Lovable Cloud (Supabase)
- **Database**: PostgreSQL with Row Level Security
- **Realtime**: Supabase Realtime subscriptions
- **Voice AI**: ElevenLabs Conversational AI
- **Vision AI**: Google Gemini 2.5 Pro
- **External APIs**: Instacart, FatSecret, Google Places

## Architecture Principles

1. **Progressive Enhancement**: Voice and vision features enhance but don't block core functionality
2. **Household-Centric**: All data organized by household for multi-user sharing
3. **Realtime-First**: Live updates via Supabase subscriptions for collaborative experiences
4. **Security by Default**: Row Level Security (RLS) on all tables
5. **Mobile-First**: Responsive design with safe area support for notches/home bars

## Getting Started with Development

See [ARCHITECTURE.md](./ARCHITECTURE.md) for system architecture details and data flow patterns.

## Support

For questions or issues, refer to the component documentation in [COMPONENTS.md](./COMPONENTS.md) or the hooks reference in [HOOKS.md](./HOOKS.md).
