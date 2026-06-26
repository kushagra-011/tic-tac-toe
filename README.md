# Neon Tic Tac Toe Game

A highly polished, responsive, and visually stunning Tic Tac Toe game featuring modern glassmorphism panels, glowing neon design, customized sound effects, and multiple gameplay modes including an unbeatable AI opponent.

## Features

- **Sleek Visual Design**: Glowing neon assets (cyan for Player X, pink/magenta for Player O), turn indicators, and responsive glassmorphism interfaces.
- **Multiple Game Modes**:
  - **Local PvP**: Play locally on the same screen with a friend.
  - **VS Computer**: Play against the computer with three difficulty levels:
    - *Easy*: Random AI selections.
    - *Medium*: A balanced blend of tactical moves (defending/attacking) and random play.
    - *Unbeatable*: Evaluates every move using the Minimax algorithm.
- **Micro-Animations & Audio Feedback**:
  - Visual strike-through line matching the winning combination.
  - Sidebar-launched confetti physics celebration.
  - Custom synthesized sound effects (Web Audio API) for turns, clicks, wins, and draws (can be muted via header toggle).
- **Persistent Scoreboard**: Wins and ties are saved in browser `localStorage` and persist through page reloads.

## File Structure

- `index.html` - App structure and DOM components.
- `styles.css` - Custom styling rules, keyframes, transitions, and theme variables.
- `script.js` - Sound synthesis, minimax tree algorithm, confetti particles, and logic.
- `server.js` - Zero-dependency static Node.js server to run the application locally.

## Getting Started

### 1. Run via Local Server (Node.js)
If you have Node.js installed, you can start the built-in server by running:
```bash
node server.js
```
Then, open [http://localhost:3000/](http://localhost:3000/) in your browser.

### 2. Run Directly
Alternatively, you can simply double-click `index.html` to open and play the game directly in any modern web browser.
