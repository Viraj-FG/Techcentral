#!/bin/bash

# Generate SVG diagrams from Mermaid source files
# Requires: npm install -g @mermaid-js/mermaid-cli

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if mmdc is installed
if ! command -v mmdc &> /dev/null; then
    echo -e "${RED}Error: mermaid-cli (mmdc) is not installed${NC}"
    echo "Install it with: npm install -g @mermaid-js/mermaid-cli"
    exit 1
fi

# Create output directory
mkdir -p ../diagrams/svg

echo "Generating SVG diagrams..."

# Array of diagram files
diagrams=(
    "system-architecture"
    "routing-structure"
    "component-hierarchy"
    "data-flow"
    "database-erd"
    "user-journey"
    "voice-architecture"
    "state-management"
    "edge-functions-map"
)

# Convert each diagram
for diagram in "${diagrams[@]}"; do
    input="../diagrams/${diagram}.mmd"
    output="../diagrams/svg/${diagram}.svg"
    
    if [ -f "$input" ]; then
        echo "Converting ${diagram}..."
        mmdc -i "$input" -o "$output" -t default -b transparent
        
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✓ ${diagram}.svg created${NC}"
        else
            echo -e "${RED}✗ Failed to convert ${diagram}${NC}"
        fi
    else
        echo -e "${RED}✗ ${input} not found${NC}"
    fi
done

echo ""
echo -e "${GREEN}Done! SVG files are in docs/diagrams/svg/${NC}"
echo ""
echo "You can also generate SVGs manually at:"
echo "https://mermaid.live"
