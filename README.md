# Suika Game - Merge Fruits!

A fun fruit merging game built with Phaser.js. Drop fruits, merge them, and reach the watermelon!

## How to Play

1. **Move your mouse** to position the fruit horizontally
2. **Click** to drop the fruit
3. **Match fruits** of the same type to merge them into bigger fruits
4. **Avoid** letting fruits pile up above the red danger line for too long
5. **Score points** by merging fruits - bigger merges = more points!

### Power-Ups

Use strategic power-ups to help you survive longer:

1. **Click a power-up button** on the right side to select it
2. **Press SPACE** to activate the selected power-up

#### Available Power-Ups

- **💣 Bomb** (Available from start)
  - Drops a bomb that explodes on contact
  - Clears all fruits in a large radius
  - Great for clearing crowded areas

- **🌈 Rainbow Fruit** (Available from start)
  - Merges with ANY fruit type
  - Evolves the fruit it touches to the next level
  - Perfect for creating strategic combos

- **🔬 Shrink Ray** (Unlocked at 50 points)
  - Temporarily shrinks ALL fruits for 5 seconds
  - Creates more space in the container
  - Use when things get tight!

- **⏰ Time Freeze** (Unlocked at 100 points)
  - Freezes physics for 3 seconds
  - Plan your next move while everything is paused
  - Perfect for setting up big combos

## Fruit Evolution Chain

🍒 Cherry → 🍓 Strawberry → 🍇 Grape → 🍊 Orange → 🍎 Apple → 🍐 Pear → 🍑 Peach → 🍍 Pineapple → 🍈 Melon → 🍉 Watermelon

## Running the Game

### Option 1: Simple HTTP Server (Easiest)

Open `index.html` directly in your browser, or use any local server:

```bash
# Using Python 3
python -m http.server 8000

# Using Node.js (http-server)
npx http-server

# Using PHP
php -S localhost:8000
```

Then open http://localhost:8000 in your browser.

### Option 2: Vite Dev Server (Recommended for development)

```bash
npm run dev
```

Then open the URL shown in the terminal (usually http://localhost:5173).

## Features

- ✅ Physics-based fruit dropping and merging
- ✅ 10 different fruit types with evolution chain
- ✅ 4 unique power-ups (Bomb, Rainbow, Shrink Ray, Time Freeze)
- ✅ Unlockable power-ups based on score
- ✅ Particle effects and visual polish
- ✅ Game over detection with danger line
- ✅ Intuitive UI and controls

## Future Enhancements

- 🎵 Sound effects and background music
- 🏆 Persistent high score system
- 🎨 Custom fruit sprites and animations
- 🎮 Multiple game modes (Time Attack, Zen Mode, etc.)
- 🌍 Global leaderboards
- 📱 Mobile touch controls optimization

## Controls

- **Mouse Movement**: Position fruit horizontally
- **Left Click**: Drop fruit into container
- **Click Power-Up Button**: Select a power-up
- **SPACE**: Activate selected power-up
- **Click after Game Over**: Restart game

## Tips & Strategy

- Plan ahead! Think about where fruits will land after merging
- Use power-ups strategically - don't waste them on small problems
- The Rainbow fruit is great for creating combos with mismatched fruits
- The Bomb is best saved for emergency situations when you're close to game over
- Try to keep larger fruits at the bottom to prevent them from blocking smaller merges

Enjoy merging fruits and reaching that watermelon! 🍉
