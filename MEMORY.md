# MEMORY.md - Long-Term Memory

## User
- **Name**: Viraj Sharma
- **WhatsApp**: +2063765245
- **X/Twitter**: @Viraj_Sharma_05
- **Reddit**: Calm-Cow250
- **Timezone**: America/Los_Angeles (PST)
- **Preferences**: Wants free/local AI (Ollama), maximum content volume, Docker-based deployments
- **Models**: Prefers Claude 4.6 and Kimi for development

## Active Projects

### Amazon Marketing (Amazon-Marketing repo)
- **Path**: `C:\Users\12066\.openclaw\workspace-wolfie\Amazon-Marketing`
- **GitHub**: github.com/Viraj-FG/Amazon-Marketing (Public, pushed to `main`)
- **GitHub username**: Viraj-FG (also has org Raspbaby-Inc)
- **Purpose**: Automated Amazon affiliate marketing pipeline — takes affiliate links, generates content across 15+ formats, monitors Reddit for opportunities, posts to X/Reddit/WordPress
- **AI Backend**: Ollama (free, local) with llama3.1:8b as default; OpenAI as optional paid fallback
- **Pipeline**: scraper → content_gen → poster → tracker, plus reddit_monitor, blog_generator, content_pump
- **Docker**: 4 services (content-engine, blog-generator, content-pump, reddit-monitor)
- **Products**: 8 affiliate links in links.txt (AirPods 4, Fire TV Stick 4K Max, Echo Dot, Kindle Paperwhite, AirTag 2, Deco X55, Waterpik, Scanmarker Pro)
- **Content pump**: NOT YET RUN — sub-agent failed (went off-script, added bot scripts instead of running pump)
- **X API**: Fully configured (Pay Per Use tier, $0 balance — may need credits to post)
- **Reddit API**: Blocked on CAPTCHA — form pre-filled on old.reddit.com/prefs/apps, user needs to complete
- **Key rule**: Reddit bot does NOT auto-post (TOS compliance) — sends alerts, user posts manually
- **Kimi K2.5 cloud**: Hangs via Ollama — use llama3.1:8b for content generation instead

### Kaeva Deepfake Detection
- Discussed architecture, intent detection, monetization
- Sub-agent drafted 100-page technical document outline
- Status: Planning/design phase

## Technical Environment
- **OS**: Windows 10 (x64), PowerShell
- **Shell quirks**: Use `;` not `&&` for command chaining; `Remove-Item -Recurse -Force` for dirs
- **Ollama models installed**: Llama 3.1 8B (4.9GB), Mistral 7B (4.4GB), Gemma3 4B, Kimi K2.5
- **Brave Search API**: Rate-limited on free plan (1 req/s, 2000 quota)
- **Browser Relay**: Works with Brave browser; user must manually attach tabs

## Ethical Boundaries
- Refused to build Reddit spam/evasion bot — offered legitimate alternatives
- Won't create social media accounts on user's behalf (requires personal verification)
- Reddit content is alert-only, no auto-posting
