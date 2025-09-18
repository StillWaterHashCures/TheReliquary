// Eldritch TCG - Server-Side Game Logic
// Authoritative game state management and validation

class EldritchGameLogic {
    constructor(cardDatabase) {
        this.cardDatabase = cardDatabase || [];
    }

    // Initialize game state for two players
    initializeGame(playerIds) {
        console.log('Initializing game for players:', playerIds);
        
        const gameState = {
            turn: 1,
            currentPlayer: playerIds[0], // First player starts
            gamePhase: 'playing',
            winner: null,
            players: {}
        };

        // Initialize each player's state
        playerIds.forEach((playerId, index) => {
            const deck = this.generateRandomDeck();
            const hand = [];
            
            // Draw initial hand (4 cards - max hand size)
            for (let i = 0; i < 4; i++) {
                if (deck.length > 0) {
                    hand.push(deck.pop());
                }
            }

            gameState.players[playerId] = {
                hand: hand,
                field: [null, null, null, null], // 4 slots
                deck: deck,
                meridian: { current: 3, max: 3 },
                deckCount: 20, // Total deck size (including cards in hand)
                role: index === 0 ? 'player' : 'opponent'
            };
        });

        console.log('Game initialized with state:', gameState);
        return gameState;
    }

    // Generate a random 20-card deck
    generateRandomDeck() {
        const deck = [];
        
        // Use card database if available, otherwise create random cards
        const availableCards = this.cardDatabase.length > 0 ? this.cardDatabase : this.getDefaultCards();
        
        for (let i = 0; i < 20; i++) {
            const randomCard = availableCards[Math.floor(Math.random() * availableCards.length)];
            deck.push({
                ...randomCard,
                uniqueId: Date.now() + Math.random(),
                currentHealth: randomCard.health
            });
        }
        
        return this.shuffleDeck(deck);
    }

    // Default cards if no database loaded
    getDefaultCards() {
        return [
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

    // Shuffle deck array
    shuffleDeck(deck) {
        for (let i = deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [deck[i], deck[j]] = [deck[j], deck[i]];
        }
        return deck;
    }

    // Process a player action and return validation result
    processAction(room, playerId, actionData) {
        const gameState = room.gameState;
        
        if (!gameState) {
            return { success: false, error: 'Game not initialized' };
        }

        if (gameState.gamePhase !== 'playing') {
            return { success: false, error: 'Game is not in playing state' };
        }

        try {
            switch (actionData.type) {
                case 'playCard':
                    return this.processPlayCard(gameState, playerId, actionData);
                
                case 'attack':
                    return this.processAttack(gameState, playerId, actionData);
                
                case 'endTurn':
                    console.log(`📝 Received endTurn action from player ${playerId}`);
                    return this.processEndTurn(gameState, playerId);
                
                default:
                    return { success: false, error: 'Unknown action type' };
            }
        } catch (error) {
            console.error('Error processing action:', error);
            return { success: false, error: 'Failed to process action' };
        }
    }

    // Validate and process card play
    processPlayCard(gameState, playerId, actionData) {
        const player = gameState.players[playerId];
        
        if (gameState.currentPlayer !== playerId) {
            return { success: false, error: 'Not your turn' };
        }

        const { handIndex, fieldSlot } = actionData;
        const card = player.hand[handIndex];
        
        if (!card) {
            return { success: false, error: 'Invalid card' };
        }

        if (fieldSlot < 0 || fieldSlot > 3 || player.field[fieldSlot] !== null) {
            return { success: false, error: 'Invalid field slot' };
        }

        if (player.meridian.current < card.cost) {
            return { success: false, error: 'Not enough Meridian' };
        }

        // Execute the action
        card.justPlayed = true; // Add summoning sickness - can't attack this turn
        player.field[fieldSlot] = card;
        player.hand.splice(handIndex, 1);
        player.meridian.current -= card.cost;

        console.log(`Player ${playerId} played ${card.name} to slot ${fieldSlot} (summoning sickness applied)`);

        return { 
            success: true, 
            gameState: gameState,
            gameEnded: false
        };
    }

    // Validate and process attack
    processAttack(gameState, playerId, actionData) {
        const player = gameState.players[playerId];
        
        if (gameState.currentPlayer !== playerId) {
            return { success: false, error: 'Not your turn' };
        }

        const { attackerSlot, targetSlot } = actionData;
        const attacker = player.field[attackerSlot];
        
        if (!attacker) {
            return { success: false, error: 'No card in attacker slot' };
        }

        // Check for summoning sickness - cards can't attack the turn they're played
        if (attacker.justPlayed) {
            return { success: false, error: 'Card cannot attack the turn it was played (summoning sickness)' };
        }

        // Get opponent
        const opponentId = Object.keys(gameState.players).find(id => id !== playerId);
        const opponent = gameState.players[opponentId];
        
        if (targetSlot !== null && targetSlot !== undefined) {
            const defender = opponent.field[targetSlot];
            if (!defender) {
                return { success: false, error: 'No target card' };
            }
            
            // Execute combat
            attacker.currentHealth -= defender.attack;
            defender.currentHealth -= attacker.attack;
            
            console.log(`Combat: ${attacker.name} vs ${defender.name}`);
            console.log(`💥 After combat - Attacker health: ${attacker.currentHealth}, Defender health: ${defender.currentHealth}`);
            
            // Remove destroyed cards and decrease deck count (representing destroyed cards)
            let deathCount = 0;
            if (attacker.currentHealth <= 0) {
                console.log(`💀 DEATH: ${attacker.name} (attacker) destroyed!`);
                player.field[attackerSlot] = null;
                player.deckCount = Math.max(0, player.deckCount - 1);
                deathCount++;
                console.log(`💀 DECK LOSS: ${playerId} deck count: ${player.deckCount + 1} → ${player.deckCount}`);
            }
            
            if (defender.currentHealth <= 0) {
                console.log(`💀 DEATH: ${defender.name} (defender) destroyed!`);
                opponent.field[targetSlot] = null;
                opponent.deckCount = Math.max(0, opponent.deckCount - 1);
                deathCount++;
                console.log(`💀 DECK LOSS: ${opponentId} deck count: ${opponent.deckCount + 1} → ${opponent.deckCount}`);
            }
            
            console.log(`⚰️ COMBAT SUMMARY: ${deathCount} cards died this combat`);
            console.log(`📊 Final deck counts - ${playerId}: ${player.deckCount}, ${opponentId}: ${opponent.deckCount}`);
            
            console.log(`🎯 Player field after combat:`, player.field.map(c => c ? c.name + '(' + c.currentHealth + ')' : 'null'));
            console.log(`🎯 Opponent field after combat:`, opponent.field.map(c => c ? c.name + '(' + c.currentHealth + ')' : 'null'));
        }

        return { 
            success: true, 
            gameState: gameState,
            gameEnded: false
        };
    }

    // Process end turn
    processEndTurn(gameState, playerId) {
        console.log(`🔄 Processing end turn for player ${playerId}, current player is ${gameState.currentPlayer}`);
        
        if (gameState.currentPlayer !== playerId) {
            return { success: false, error: 'Not your turn' };
        }

        // Switch to next player
        const playerIds = Object.keys(gameState.players);
        const currentIndex = playerIds.indexOf(playerId);
        const nextIndex = (currentIndex + 1) % playerIds.length;
        const previousPlayer = gameState.currentPlayer;
        gameState.currentPlayer = playerIds[nextIndex];
        
        console.log(`🔄 Turn switched from ${previousPlayer} to ${gameState.currentPlayer}`);
        
        // If back to first player, increment turn
        if (nextIndex === 0) {
            gameState.turn++;
            console.log(`🔄 Turn incremented to ${gameState.turn}`);
        }
        
        // Update Meridian for new active player
        const newActivePlayer = gameState.players[gameState.currentPlayer];
        newActivePlayer.meridian.max = Math.min(10, gameState.turn + 2); // Start at 3, cap at 10
        newActivePlayer.meridian.current = newActivePlayer.meridian.max;
        
        // Clear summoning sickness for the new active player's cards
        newActivePlayer.field.forEach(card => {
            if (card && card.justPlayed) {
                card.justPlayed = false;
                console.log(`🌅 ${card.name} can now attack (summoning sickness cleared)`);
            }
        });
        
        // Draw a card (max hand size is 4) - deckCount no longer decreases from drawing!
        let discardedCardInfo = null;
        if (newActivePlayer.deck.length > 0) {
            if (newActivePlayer.hand.length < 4) {
                const drawnCard = newActivePlayer.deck.pop();
                newActivePlayer.hand.push(drawnCard);
                // Don't decrease deckCount - it only decreases from combat deaths
                console.log(`Player ${gameState.currentPlayer} draws a card`);
            } else {
                // Hand is full, discard the card
                const discardedCard = newActivePlayer.deck.pop();
                // Don't decrease deckCount - it only decreases from combat deaths
                discardedCardInfo = {
                    playerId: gameState.currentPlayer,
                    cardName: discardedCard.name
                };
                console.log(`Player ${gameState.currentPlayer} hand is full! Card discarded: ${discardedCard.name}`);
            }
        }
        
        // Check win condition
        const winner = this.checkWinCondition(gameState);
        if (winner) {
            gameState.gamePhase = 'ended';
            gameState.winner = winner;
            
            console.log(`Game ended. Winner: ${winner}`);
            
            return { 
                success: true, 
                gameState: gameState,
                gameEnded: true,
                winner: winner,
                discardedCard: discardedCardInfo
            };
        }

        console.log(`Turn ${gameState.turn}: ${gameState.currentPlayer}'s turn`);

        return { 
            success: true, 
            gameState: gameState,
            gameEnded: false,
            discardedCard: discardedCardInfo
        };
    }

    // Check win conditions
    checkWinCondition(gameState) {
        // Win condition: opponent's deck is depleted
        for (const [playerId, playerState] of Object.entries(gameState.players)) {
            if (playerState.deckCount === 0) {
                // This player loses, opponent wins
                const opponentId = Object.keys(gameState.players).find(id => id !== playerId);
                return opponentId;
            }
        }
        
        return null; // No winner yet
    }

    // Validate game state integrity
    validateGameState(gameState) {
        try {
            // Check required fields
            if (!gameState.players || Object.keys(gameState.players).length !== 2) {
                return false;
            }
            
            // Validate each player state
            for (const playerState of Object.values(gameState.players)) {
                if (!Array.isArray(playerState.hand) || 
                    !Array.isArray(playerState.field) ||
                    !Array.isArray(playerState.deck) ||
                    playerState.field.length !== 4) {
                    return false;
                }
            }
            
            return true;
        } catch (error) {
            return false;
        }
    }
}

module.exports = { EldritchGameLogic };