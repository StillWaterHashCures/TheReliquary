// Eldritch TCG - Core Game Logic
// Handles game state, turn management, Meridian system, and win conditions

class EldritchGame {
    constructor() {
        this.gameState = {
            player: {
                hand: [],
                field: [null, null, null, null], // 4 slots, null = empty
                deck: [],
                meridian: { current: 3, max: 3 },
                deckCount: 20
            },
            opponent: {
                hand: [],
                field: [null, null, null, null],
                deck: [],
                meridian: { current: 3, max: 3 },
                deckCount: 20
            },
            turn: 1,
            currentPlayer: 'player',
            gamePhase: 'waiting', // waiting, playing, ended
            winner: null
        };
        
        this.cardDatabase = [];
        this.actionHistory = [];
        this.loadCardDatabase();
    }

    // Initialize a new game
    async initializeGame() {
        console.log('Initializing Eldritch TCG...');
        
        // Create random decks for both players
        this.gameState.player.deck = this.createRandomDeck();
        this.gameState.opponent.deck = this.createRandomDeck();
        
        // Draw initial hands (4 cards each - max hand size)
        for (let i = 0; i < 4; i++) {
            this.drawCard('player');
            this.drawCard('opponent');
        }
        
        // Start the game
        this.gameState.gamePhase = 'playing';
        this.updateUI();
        
        console.log('Game initialized. Player goes first.');
    }

    // Load card database (will be expanded with cards.json)
    loadCardDatabase() {
        // Placeholder eldritch-themed cards
        this.cardDatabase = [
            {
                id: 1,
                name: "Void Spawn",
                attack: 2,
                health: 1,
                cost: 1,
                lore: "It whispers from the spaces between...",
                art: "👁️"
            },
            {
                id: 2,
                name: "Tentacled Horror",
                attack: 3,
                health: 3,
                cost: 3,
                lore: "Flesh writhes in impossible geometries.",
                art: "🐙"
            },
            {
                id: 3,
                name: "Cosmic Dread",
                attack: 1,
                health: 5,
                cost: 2,
                lore: "The stars align for something terrible.",
                art: "🌌"
            },
            {
                id: 4,
                name: "Elder Sigil",
                attack: 4,
                health: 2,
                cost: 4,
                lore: "Ancient symbols burn with eldritch power.",
                art: "⚡"
            },
            {
                id: 5,
                name: "Madness Incarnate",
                attack: 5,
                health: 1,
                cost: 3,
                lore: "Sanity crumbles before its presence.",
                art: "💀"
            }
        ];
    }

    // Create a random 20-card deck
    createRandomDeck() {
        const deck = [];
        for (let i = 0; i < 20; i++) {
            const randomCard = this.cardDatabase[Math.floor(Math.random() * this.cardDatabase.length)];
            // Create a copy with unique ID
            deck.push({
                ...randomCard,
                uniqueId: Date.now() + Math.random(),
                currentHealth: randomCard.health
            });
        }
        return this.shuffleDeck(deck);
    }

    // Shuffle deck array
    shuffleDeck(deck) {
        for (let i = deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [deck[i], deck[j]] = [deck[j], deck[i]];
        }
        return deck;
    }

    // Draw a card from deck to hand
    drawCard(player) {
        const playerState = this.gameState[player];
        
        if (playerState.deck.length === 0) {
            console.log(`${player} deck is empty!`);
            this.checkWinCondition();
            return null;
        }

        // Check if hand is already at maximum size (4 cards)
        if (playerState.hand.length >= 4) {
            console.log(`${player} hand is full! Card discarded.`);
            const discardedCard = playerState.deck.pop();
            // Don't decrease deckCount for drawing - only combat deaths decrease it
            console.log(`${player} discarded: ${discardedCard.name}`);
            return null;
        }

        const card = playerState.deck.pop();
        playerState.hand.push(card);
        // Don't decrease deckCount for drawing - only combat deaths decrease it
        
        // Play card draw sound (only for the current player to avoid double sounds)
        if (player === 'player' && window.simpleAudio) {
            console.log('🎵 GAME: Triggering card draw sound');
            simpleAudio.playCardDraw();
        } else if (player === 'player') {
            console.log('❌ GAME: simpleAudio not available for card draw');
        }
        
        console.log(`${player} draws: ${card.name}`);
        return card;
    }

    // Play a card from hand to field
    playCard(player, handIndex, fieldSlot) {
        // Only allow actions if it's the player's turn
        if (this.gameState.currentPlayer !== 'player' || player !== 'player') {
            console.log('Not your turn!');
            return false;
        }

        const playerState = this.gameState[player];
        const card = playerState.hand[handIndex];
        
        if (!card) {
            console.log('Invalid card selection');
            return false;
        }

        if (!this.canAffordCard(player, card)) {
            console.log(`Not enough Meridian to play ${card.name}`);
            return false;
        }

        if (fieldSlot < 0 || fieldSlot > 3 || playerState.field[fieldSlot] !== null) {
            console.log('Invalid field slot');
            return false;
        }

        // Send action to server instead of processing locally
        if (typeof websocket !== 'undefined') {
            websocket.sendMessage('playerAction', {
                type: 'playCard',
                handIndex: handIndex,
                fieldSlot: fieldSlot
            });
        } else {
            console.warn('No WebSocket connection - falling back to local play');
            // Fallback to local processing for single-player testing
            this.processLocalPlayCard(player, handIndex, fieldSlot, card);
        }

        return true;
    }

    // Local fallback for single-player testing
    processLocalPlayCard(player, handIndex, fieldSlot, card) {
        const playerState = this.gameState[player];
        playerState.field[fieldSlot] = card;
        playerState.hand.splice(handIndex, 1);
        playerState.meridian.current -= card.cost;
        
        console.log(`${player} plays ${card.name} to slot ${fieldSlot}`);
        this.actionHistory.push({
            type: 'playCard',
            player,
            card: card.name,
            slot: fieldSlot,
            turn: this.gameState.turn
        });

        this.updateUI();
    }

    // Check if player can afford card
    canAffordCard(player, card) {
        return this.gameState[player].meridian.current >= card.cost;
    }

    // Attack with a card
    attackWithCard(attackerPlayer, fieldSlot, targetSlot = null) {
        console.log(`🗡️ attackWithCard called: attacker=${attackerPlayer}, fieldSlot=${fieldSlot}, targetSlot=${targetSlot}`);
        console.log(`Current game state:`, this.gameState.currentPlayer, 'vs player turn check');
        
        // Only allow attacks if it's the player's turn
        if (this.gameState.currentPlayer !== 'player' || attackerPlayer !== 'player') {
            console.log('Not your turn!');
            return false;
        }

        const attacker = this.gameState[attackerPlayer].field[fieldSlot];
        const defenderPlayer = attackerPlayer === 'player' ? 'opponent' : 'player';
        
        if (!attacker) {
            console.log('No card in that slot');
            return false;
        }

        if (targetSlot !== null) {
            // Attack specific card
            const defender = this.gameState[defenderPlayer].field[targetSlot];
            if (!defender) {
                console.log('No target card in that slot');
                return false;
            }
            
            // Send attack action to server instead of processing locally
            if (typeof websocket !== 'undefined') {
                console.log(`🗡️ Sending attack: ${attacker.name} attacks ${defender.name}`);
                websocket.sendMessage('playerAction', {
                    type: 'attack',
                    attackerSlot: fieldSlot,
                    targetSlot: targetSlot
                });
            } else {
                console.warn('No WebSocket connection - falling back to local combat');
                // Fallback to local processing for single-player testing
                this.cardCombat(attacker, defender, attackerPlayer, defenderPlayer, fieldSlot, targetSlot);
            }
        } else {
            // Direct attack (if no defending cards or specific rules allow)
            console.log(`${attacker.name} attacks directly!`);
            // Could add direct attack to server logic later
        }

        this.updateUI();
        return true;
    }

    // Handle combat between two cards
    cardCombat(attacker, defender, attackerPlayer, defenderPlayer, attackerSlot, defenderSlot) {
        console.log(`${attacker.name} (${attacker.attack}/${attacker.currentHealth}) attacks ${defender.name} (${defender.attack}/${defender.currentHealth})`);
        
        // Play combat hit sound
        if (window.simpleAudio) {
            console.log('🎵 GAME: Triggering card hit sound');
            simpleAudio.playCardHit();
        } else {
            console.log('❌ GAME: simpleAudio not available for card hit');
        }
        
        // Apply damage
        attacker.currentHealth -= defender.attack;
        defender.currentHealth -= attacker.attack;
        
        // Remove destroyed cards
        let cardsDied = false;
        if (attacker.currentHealth <= 0) {
            this.gameState[attackerPlayer].field[attackerSlot] = null;
            console.log(`${attacker.name} is destroyed!`);
            cardsDied = true;
        }
        
        if (defender.currentHealth <= 0) {
            this.gameState[defenderPlayer].field[defenderSlot] = null;
            console.log(`${defender.name} is destroyed!`);
            cardsDied = true;
        }
        
        // Play death sound if any cards died
        if (cardsDied && window.simpleAudio) {
            console.log('🎵 GAME: Triggering card death sound');
            simpleAudio.playCardDeath();
        } else if (cardsDied) {
            console.log('❌ GAME: simpleAudio not available for card death');
        }

        this.actionHistory.push({
            type: 'combat',
            attacker: attacker.name,
            defender: defender.name,
            turn: this.gameState.turn
        });
    }

    // End current turn
    endTurn() {
        console.log('🔄 EndTurn called, current player:', this.gameState.currentPlayer);
        
        // Only allow ending turn if it's the player's turn
        if (this.gameState.currentPlayer !== 'player') {
            console.log('❌ Not your turn!');
            return;
        }

        console.log('✅ Sending endTurn action to server');
        
        // Send end turn action to server
        if (typeof websocket !== 'undefined') {
            websocket.sendMessage('playerAction', {
                type: 'endTurn'
            });
        } else {
            console.warn('No WebSocket connection - falling back to local turn end');
            // Fallback to local processing for single-player testing
            this.processLocalEndTurn();
        }
    }

    // Local fallback for single-player testing
    processLocalEndTurn() {
        const currentPlayer = this.gameState.currentPlayer;
        
        // Switch to other player
        this.gameState.currentPlayer = currentPlayer === 'player' ? 'opponent' : 'player';
        
        // If both players have played, increment turn counter
        if (this.gameState.currentPlayer === 'player') {
            this.gameState.turn++;
        }
        
        // Increase Meridian for new active player
        const newPlayer = this.gameState.currentPlayer;
        const playerState = this.gameState[newPlayer];
        
        playerState.meridian.max = Math.min(10, this.gameState.turn + 2); // Start at 3, cap at 10
        playerState.meridian.current = playerState.meridian.max;
        
        // Draw a card
        this.drawCard(newPlayer);
        
        console.log(`Turn ${this.gameState.turn}: ${newPlayer}'s turn`);
        console.log(`${newPlayer} Meridian: ${playerState.meridian.current}/${playerState.meridian.max}`);
        
        this.updateUI();
        this.checkWinCondition();
    }

    // Check win conditions
    checkWinCondition() {
        if (this.gameState.player.deckCount === 0) {
            this.gameState.winner = 'opponent';
            this.gameState.gamePhase = 'ended';
            console.log('Opponent wins! Player deck depleted.');
            this.updateUI();
            return true;
        }
        
        if (this.gameState.opponent.deckCount === 0) {
            this.gameState.winner = 'player';
            this.gameState.gamePhase = 'ended';
            console.log('Player wins! Opponent deck depleted.');
            this.updateUI();
            return true;
        }
        
        return false;
    }

    // Update the UI (placeholder - will be implemented in ui.js)
    updateUI() {
        if (typeof updateGameUI === 'function') {
            updateGameUI(this.gameState);
        }
    }

    // Get current game state (for debugging/networking)
    getGameState() {
        return { ...this.gameState };
    }
}

// Global game instance
let game = new EldritchGame();