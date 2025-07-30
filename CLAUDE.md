# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Minesweeper game project built as a Progressive Web App (PWA). The core game is built with HTML/CSS/JavaScript and can be installed on smartphones and PCs as a standalone app without any app store.

## Core Architecture

### Core Files
- **index.html**: Main HTML structure with semantic layout and PWA meta tags
- **style.css**: Modern CSS with Flexbox/Grid, gradients, animations, and responsive design
- **script.js**: ES6+ class-based `Minesweeper` game logic with comprehensive event handling

### PWA Files
- **manifest.json**: Web App Manifest defining app metadata, icons, and display settings
- **service-worker.js**: Service Worker for offline functionality and caching
- **icons/**: Multiple icon sizes for different devices and contexts
- **icon.svg**: Source vector icon for generating raster icons

### Key Design Patterns
- Single `Minesweeper` class managing all game state and UI
- Cell data structure: `{isMine, isRevealed, isFlagged, neighborMines, element}`
- Event-driven architecture with proper delegation
- CSS Transform-based zoom functionality with dynamic padding adjustment

## Common Development Commands

### Running the Web Version
```bash
# Open directly in browser (limited PWA functionality)
open index.html

# Run local server (full PWA support)
python3 -m http.server 8000
# Access at http://localhost:8000
```

### PWA Testing
```bash
# Test Service Worker locally
python3 -m http.server 8000

# Check PWA readiness in Chrome DevTools
# 1. Open http://localhost:8000
# 2. Press F12 to open DevTools
# 3. Go to Application tab
# 4. Check Manifest, Service Workers sections
```

### Deployment (Free Options)
```bash
# GitHub Pages
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/[username]/minesweeper.git
git push -u origin main
# Enable GitHub Pages in repository settings

# Or use drag-and-drop services like Netlify/Vercel
```

## Critical Implementation Details

### Special Features
1. **Chord Function**: Double-click on revealed number cells to auto-reveal adjacent unflagged cells (if flag count matches the number)
2. **First Click Protection**: Mines are never placed on the first clicked cell
3. **Auto-reveal**: Empty cells trigger recursive neighbor revealing
4. **Zoom System**: 50%-300% zoom with scroll wrapper ensuring all edges remain accessible
5. **Extreme Difficulty**: 64×64 grid with 999 mines, requires special CSS handling
6. **PWA Support**: Installable as standalone app with offline functionality
7. **Service Worker**: Caches all game assets for offline play

### Performance Considerations
- DOM manipulation is optimized for the 64×64 extreme difficulty
- Zoom uses CSS transforms for performance
- Event delegation reduces listener count
- Cell size dynamically adjusts based on difficulty

### Important Functions
- `placeMines(excludeRow, excludeCol)`: Mine placement with first-click exclusion
- `revealCell(row, col)`: Core game logic for revealing cells
- `handleDoubleClick()`: Implements chord functionality
- `updateZoom()`: Manages zoom state and dynamic padding
- `createGameBoardWrapper()`: Creates scroll container for zoom functionality

## Code Style Guidelines

### JavaScript
- ES6+ features (classes, arrow functions, template literals)
- camelCase naming
- Single class pattern
- No external dependencies

### CSS
- Flexbox and Grid for layout
- CSS variables for theming potential
- kebab-case naming
- Mobile-first responsive design

### General
- All comments and documentation in Japanese
- Self-contained project (no external libraries)
- Semantic HTML structure
- Consistent indentation and formatting

## Testing Approach

The project doesn't have formal tests, but when making changes:
1. Test all difficulty levels (especially extreme 64×64)
2. Verify zoom functionality at all levels
3. Check mobile responsiveness
4. Test chord function edge cases
5. Ensure first-click protection works
6. Verify PWA installation on different browsers
7. Test offline functionality after caching
8. Check Service Worker updates work correctly

## Important Notes

- Always read README.md first for detailed implementation
- Maintain design pattern consistency
- Preserve self-contained nature (no external dependencies)
- Follow existing event handling patterns
- Consider mobile compatibility for all changes
- Test PWA features in HTTPS context (localhost is exception)
- Service Worker requires secure context except for localhost
- Update Service Worker version when changing cached files

## PWA-Specific Guidelines

### Icon Generation
- Use `icon.svg` as source for all icon sizes
- Run `python3 generate_icons.py` if ImageMagick is installed
- Otherwise use online tools or the placeholder scripts
- Minimum required: 192x192 and 512x512 icons

### Cache Management
- Update `CACHE_NAME` version in service-worker.js when deploying changes
- Test cache invalidation in browser DevTools
- Verify offline functionality after updates

### Manifest Updates
- Keep manifest.json in sync with any app metadata changes
- Test on both Android and iOS for compatibility
- Verify theme_color matches app design