# Eldritch TCG 🌌

A browser-based trading card game with an ultra-minimalist, eldritch style inspired by Lovecraftian horror. Battle your opponent in real-time using cosmic entities and eldritch abominations.

## 🎮 Game Features

- **Minimalist Eldritch Design**: Dark purples, void blacks, and eerie animations
- **Real-time Multiplayer**: WebSocket-based PvP with 4-digit room codes
- **Simple Core Loop**: Draw cards → Play cards OR Attack → Win by depleting opponent's deck
- **Meridian System**: Mana that increases each turn (capped at 10)
- **4-Slot Battlefield**: Strategic positioning with limited field space
- **20 Unique Cards**: Each with eldritch lore and cosmic horror themes

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- Web browser (modern browsers with WebSocket support)

### Installation & Running

1. **Install Dependencies**
   ```bash
   cd eldritch-tcg
   npm install
   ```

2. **Start the Server**
   ```bash
   npm start
   ```
   The server will start on `http://localhost:3000` with WebSocket on port 3001.

3. **Play the Game**
   - Open `http://localhost:3000` in two browser windows/tabs
   - First player gets a 4-digit room code to share
   - Second player enters the room code to join
   - Game starts automatically when both players connect!

## 🎯 How to Play

### Basic Rules
- **Objective**: Deplete your opponent's deck (20 cards) to win
- **Turn Structure**: Draw 1 card → Play cards OR Attack → End turn
- **Meridian**: Starts at 3, increases each turn (max 10), used to play cards
- **Field Limit**: Maximum 4 cards on the battlefield per player
- **Hand Limit**: Maximum 4 cards in hand per player

### Controls
- **Drag & Drop**: Drag cards from hand to battlefield slots
- **Click to Attack**: Click your field cards, then click opponent's cards to attack
- **End Turn**: Click "End Turn" button or press Space/Enter
- **Card Info**: Hover over cards to see lore and stats

### Card Stats
- **Cost** (blue circle): Meridian required to play
- **Attack** (red circle): Damage dealt in combat
- **Health** (green circle): Damage required to destroy

## 🏗️ Project Structure

```
eldritch-tcg/
├── client/                 # Frontend files
│   ├── index.html         # Main game interface
│   ├── css/
│   │   ├── main.css       # Core styling & layout
│   │   └── cards.css      # Card-specific styles
│   ├── js/
│   │   ├── game.js        # Game state management
│   │   ├── ui.js          # User interface controller
│   │   └── websocket.js   # Multiplayer networking
│   └── assets/
│       ├── sounds/
│       └── images/
├── server/                # Backend files
│   ├── app.js            # Express server & WebSocket handler
│   ├── gameLogic.js      # Authoritative game logic
│   ├── rooms.js          # Room management system
│   └── cards.json        # Card database
├── package.json          # Dependencies & scripts
└── README.md
```

## 🎨 Technical Highlights

### Frontend
- **Vanilla JavaScript**: No frameworks, lightweight and fast
- **CSS Grid/Flexbox**: Responsive battlefield layout
- **Drag & Drop API**: Intuitive card playing
- **WebSocket Client**: Real-time multiplayer sync
- **Eldritch Animations**: CSS keyframes for atmospheric effects

### Backend
- **Node.js + Express**: Lightweight server
- **WebSocket (ws)**: Real-time bidirectional communication
- **Authoritative Server**: All game logic validated server-side
- **Room System**: 4-digit codes for easy game sharing
- **JSON Card Database**: Easy to expand and modify

## 🌟 Game Design Philosophy

### Ultra-Minimalism
- **No Deck Building**: Random 20-card decks for instant play
- **Simple Mechanics**: Attack/Health/Cost only
- **Fast Matches**: 5-10 minutes per game
- **One Core Decision**: Play card OR Attack each turn

### Eldritch Atmosphere
- **Cosmic Horror Theme**: Lovecraftian creatures and lore
- **Dark Aesthetic**: Deep purples, void blacks, eerie glows
- **Subtle Animations**: Pulsing sigils, flowing meridian, void swirls
- **Atmospheric Fonts**: Creepster and Nosifer for authentic feel

## 🔧 Development

### Adding New Cards
Edit `server/cards.json`:
```json
{
    "id": 21,
    "name": "Your Horror",
    "type": "creature",
    "attack": 3,
    "health": 2,
    "cost": 2,
    "lore": "Your eldritch flavor text...",
    "art": "🔥"
}
```

### Customizing Styles
- **Colors**: Edit CSS custom properties in `main.css`
- **Animations**: Modify keyframes for different effects
- **Layout**: Adjust grid/flexbox in battlefield containers

### Server Configuration
- **Ports**: Default 3000 (HTTP) and 3001 (WebSocket)
- **Room Expiry**: 30 minutes of inactivity
- **Max Players**: 2 per room (easily configurable)

## 🚢 Deployment

### VPS Deployment
1. **Upload Files**: Copy project to VPS
2. **Install Node.js**: Ensure Node.js is installed
3. **Install Dependencies**: Run `npm install`
4. **Start Server**: `npm start` or use PM2 for production
5. **Configure Firewall**: Open ports 3000 and 3001
6. **Domain Setup**: Point domain to VPS IP

### Environment Variables
```bash
PORT=3000          # HTTP server port
WS_PORT=3001       # WebSocket port
NODE_ENV=production
```

## 🎭 Cards Overview

The game includes 20 eldritch-themed creatures:

- **Low Cost (1-2)**: Void Spawn, Lurking Shadow, Mind Flenser, Bone Crawler
- **Mid Cost (3-4)**: Tentacled Horror, Elder Sigil, Aberrant Mind, Eldritch Worm
- **High Cost (5+)**: Void Titan, Forgotten One (premium threats)
- **Special**: Cosmic Eye (0 attack, 7 health defender), Creeping Dread (0 attack utility)

Each card features:
- Unique eldritch lore text
- Emoji-based art for universal appeal
- Balanced stats for strategic gameplay
- Lovecraftian naming conventions

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### Development Ideas
- [ ] Sound effects and ambient audio
- [ ] Card animations and VFX
- [ ] Spectator mode
- [ ] Tournament brackets
- [ ] AI opponent for single-player
- [ ] Mobile-responsive improvements
- [ ] Additional card types (spells, artifacts)

## 📜 License

MIT License - feel free to use this project for learning or creating your own TCG!

---

*"In the void between stars, ancient entities play games with mortal minds..."*

**Made with ⚫ and cosmic dread** ∙ **Perfect for learning WebSocket gaming** ∙ **Deploy anywhere Node.js runs**
