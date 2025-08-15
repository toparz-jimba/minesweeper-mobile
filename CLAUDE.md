# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Japanese-language Minesweeper game implemented as a vanilla JavaScript web application. The game features three difficulty levels, touch/mobile support, and a clean visual design.

## Architecture

### Core Components

1. **Minesweeper Class** (script.js:1-309)
   - Main game engine managing all game state and logic
   - Handles board initialization, mine placement, cell revealing, and win/lose conditions
   - Implements both mouse and touch controls for mobile compatibility

2. **Game Board Structure**
   - 2D array storing cell objects with properties: `isMine`, `isRevealed`, `isFlagged`, `neighborMines`
   - Dynamic grid sizing based on difficulty (9×9, 16×16, 16×30)
   - Recursive flood-fill algorithm for revealing empty cells

3. **Event Handling**
   - Dual input system: Mouse clicks and touch gestures
   - Long press (500ms) on mobile triggers flag placement with vibration feedback
   - Touch movement detection to differentiate between taps and drags

## Key Features

- **Difficulty Levels**: Easy (9×9, 10 mines), Medium (16×16, 40 mines), Hard (16×30, 99 mines)
- **Mobile Optimization**: Touch controls with long-press for flagging
- **Game Timer**: Starts on first click, displays elapsed seconds
- **Visual Feedback**: Emoji-based reset button states (😊, 😎, 😵)
- **Responsive Design**: CSS Grid layout with dynamic cell sizing

## Development Commands

Since this is a vanilla JavaScript project with no build tools:
- Open `index.html` directly in a browser to run
- No build, test, or lint commands needed
- Use browser DevTools for debugging

## Important Implementation Details

- Mine count is calculated during board creation by incrementing `neighborMines` for all adjacent cells
- Game completion is checked by comparing revealed non-mine cells to total non-mine cells
- Touch controls use a timer-based system to distinguish between tap (reveal) and long-press (flag)
- CSS uses data attributes for number coloring (`data-count` for 1-8)
- All UI text is in Japanese (リセット, 簡単, 普通, 難しい)

## Current Branch Structure

- Working on `mobile-optimization` branch
- Main development branch appears to be `difficulty-version`
- Recent commits show addition of hint functionality and advanced calculations