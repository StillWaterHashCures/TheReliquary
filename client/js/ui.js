// Eldritch TCG - UI Controller
// Handles all user interface interactions, card rendering, and visual feedback

class EldritchUI {
    constructor() {
        this.draggedCard = null;
        this.draggedFromHand = false;
        this.selectedCard = null;
        this.gameContainer = document.getElementById('game-container');
        
        this.initializeElements();
        this.attachEventListeners();
        this.setupDragAndDrop();
        
        console.log('Eldritch UI initialized');
    }

    // Initialize DOM element references
    initializeElements() {
        // Battlefield elements
        this.playerSlots = document.querySelectorAll('#player-area .card-slot');
        this.opponentSlots = document.querySelectorAll('#opponent-area .card-slot');
        
        // Hand elements
        this.playerHand = document.getElementById('player-hand');
        this.opponentHand = document.getElementById('opponent-hand');
        
        // Deck elements
        this.playerDeck = document.getElementById('player-deck');
        this.opponentDeck = document.getElementById('opponent-deck');
        
        // Meridian elements
        this.meridianFill = document.getElementById('meridian-fill');
        this.meridianText = document.getElementById('meridian-text');
        
        // Deck counters
        this.playerDeckCounter = this.playerDeck.querySelector('.deck-counter');
        this.opponentDeckCounter = this.opponentDeck.querySelector('.deck-counter');
        
        // Create turn indicator
        this.createTurnIndicator();
    }

    // Attach event listeners
    attachEventListeners() {
        // Deck click to draw (for testing)
        this.playerDeck.addEventListener('click', () => {
            if (game.gameState.currentPlayer === 'player') {
                // Play card draw sound
                if (window.eldritchAudio) {
                    eldritchAudio.playCardDraw();
                }
                game.drawCard('player');
            }
        });

        // End turn button (we'll add this to the meridian area)
        this.createEndTurnButton();
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === ' ' || e.key === 'Enter') {
                e.preventDefault();
                this.endTurn();
            }
        });
    }

    // Create end turn button
    createEndTurnButton() {
        const meridianContainer = document.getElementById('meridian-container');
        const endTurnBtn = document.createElement('button');
        endTurnBtn.id = 'end-turn-btn';
        endTurnBtn.textContent = 'End Turn';
        endTurnBtn.style.cssText = `
            width: 100%;
            margin-top: 10px;
            padding: 10px;
            background: linear-gradient(135deg, #4a4a4a 0%, #2d2d2d 100%);
            border: 2px solid #808080;
            border-radius: 8px;
            color: #c0c0c0;
            font-family: 'Abaddon', cursive;
            font-size: 12px;
            cursor: pointer;
            transition: all 0.3s ease;
        `;
        
        endTurnBtn.addEventListener('click', () => {
            console.log('🎮 End Turn button clicked');
            this.endTurn();
        });
        endTurnBtn.addEventListener('mouseover', () => {
            endTurnBtn.style.background = 'linear-gradient(135deg, #808080 0%, #4a4a4a 100%)';
            endTurnBtn.style.boxShadow = '0 0 15px rgba(128, 128, 128, 0.5)';
        });
        endTurnBtn.addEventListener('mouseout', () => {
            endTurnBtn.style.background = 'linear-gradient(135deg, #4a4a4a 0%, #2d2d2d 100%)';
            endTurnBtn.style.boxShadow = 'none';
        });
        
        meridianContainer.appendChild(endTurnBtn);
    }

    // Create turn indicator
    createTurnIndicator() {
        const meridianContainer = document.getElementById('meridian-container');
        const turnIndicator = document.createElement('div');
        turnIndicator.id = 'turn-indicator';
        turnIndicator.style.cssText = `
            width: 100%;
            margin-bottom: 10px;
            padding: 8px;
            background: linear-gradient(135deg, #3a3a3a 0%, #1a1a1a 100%);
            border: 2px solid #808080;
            border-radius: 8px;
            color: #c0c0c0;
            font-family: 'Abaddon', cursive;
            font-size: 11px;
            text-align: center;
            transition: all 0.3s ease;
        `;
        turnIndicator.textContent = 'Waiting for game...';
        
        // Insert before meridian bar
        meridianContainer.insertBefore(turnIndicator, meridianContainer.firstChild);
        this.turnIndicator = turnIndicator;
    }

    // Setup drag and drop for cards
    setupDragAndDrop() {
        // Make card slots droppable
        this.playerSlots.forEach((slot, index) => {
            slot.addEventListener('dragover', (e) => {
                e.preventDefault();
                if (this.draggedFromHand) {
                    slot.classList.add('drag-over');
                }
            });

            slot.addEventListener('dragleave', () => {
                slot.classList.remove('drag-over');
            });

            slot.addEventListener('drop', (e) => {
                e.preventDefault();
                slot.classList.remove('drag-over');
                
                if (this.draggedCard && this.draggedFromHand) {
                    const handIndex = Array.from(this.playerHand.children).indexOf(this.draggedCard);
                    if (handIndex !== -1) {
                        // Play card sound effect
                        if (window.eldritchAudio) {
                            eldritchAudio.playCardPlay();
                        }
                        game.playCard('player', handIndex, index);
                    }
                }
                
                this.draggedCard = null;
                this.draggedFromHand = false;
            });
        });
    }

    // Create a card element
    createCardElement(card, isInHand = false, owner = null) {
        const cardEl = document.createElement('div');
        cardEl.className = 'card';
        cardEl.draggable = isInHand;
        
        if (isInHand && game.canAffordCard('player', card)) {
            cardEl.classList.add('playable');
        }

        cardEl.innerHTML = `
            <div class="card-name">${card.name}</div>
            <div class="card-art">
                <img src="assets/images/${card.art}" alt="${card.name}" 
                     onerror="console.error('Failed to load image: assets/images/${card.art}'); this.style.display='none';" 
                     onload="console.log('Successfully loaded image: assets/images/${card.art}');" />
            </div>
            <div class="card-cost">${card.cost}</div>
            <div class="card-stats">
                <div class="card-attack">${card.attack}</div>
                <div class="card-health">${card.currentHealth}</div>
            </div>
        `;
        
        // Add visual indicator for summoning sickness
        if (!isInHand && card.justPlayed) {
            cardEl.style.opacity = '0.6';
            cardEl.style.filter = 'grayscale(50%)';
            cardEl.title = 'Cannot attack this turn (summoning sickness)';
            
            // Add a small "zzz" indicator
            const sleepIndicator = document.createElement('div');
            sleepIndicator.style.cssText = `
                position: absolute;
                top: 2px;
                right: 2px;
                color: #ffff00;
                font-size: 12px;
                font-weight: bold;
                text-shadow: 1px 1px 2px rgba(0,0,0,0.8);
                pointer-events: none;
            `;
            sleepIndicator.textContent = '💤';
            cardEl.appendChild(sleepIndicator);
        }

        // Add drag events for hand cards
        if (isInHand) {
            cardEl.addEventListener('dragstart', (e) => {
                this.draggedCard = cardEl;
                this.draggedFromHand = true;
                cardEl.classList.add('dragging');
            });

            cardEl.addEventListener('dragend', () => {
                cardEl.classList.remove('dragging');
            });
        }

        // Add click events for field cards
        if (!isInHand) {
            if (owner === 'player') {
                // Player cards: click to select/deselect
                cardEl.addEventListener('click', () => {
                    console.log('🎯 Player card clicked');
                    if (this.selectedCard === cardEl) {
                        this.deselectCard();
                    } else {
                        this.selectCard(cardEl);
                    }
                });
            } else if (owner === 'opponent') {
                // Opponent cards: click to attack (only if we have a card selected)
                cardEl.addEventListener('click', () => {
                    console.log('🎯 Opponent card clicked');
                    if (this.selectedCard) {
                        const playerSlotIndex = Array.from(this.playerSlots).findIndex(
                            slot => slot.contains(this.selectedCard)
                        );
                        const opponentSlotIndex = Array.from(this.opponentSlots).findIndex(
                            slot => slot.contains(cardEl)
                        );
                        
                        console.log(`🗡️ Attacking from slot ${playerSlotIndex} to slot ${opponentSlotIndex}`);
                        if (playerSlotIndex !== -1 && opponentSlotIndex !== -1) {
                            game.attackWithCard('player', playerSlotIndex, opponentSlotIndex);
                            this.deselectCard();
                        }
                    } else {
                        console.log('❌ No card selected for attack');
                    }
                });
            }
        }

        // Hover effects
        cardEl.addEventListener('mouseenter', () => {
            if (!cardEl.classList.contains('dragging')) {
                this.showCardTooltip(card, cardEl);
            }
        });

        cardEl.addEventListener('mouseleave', () => {
            this.hideCardTooltip();
        });

        return cardEl;
    }

    // Select/deselect cards for combat
    selectCard(cardElement) {
        console.log('🎯 Card selected:', cardElement);
        // Remove previous selection
        this.deselectCard();
        
        this.selectedCard = cardElement;
        cardElement.classList.add('selected');
        
        // Add visual indication that opponent cards are now attackable
        this.opponentSlots.forEach(slot => {
            if (slot.children.length > 0) {
                slot.classList.add('valid-target');
            }
        });
    }

    deselectCard() {
        if (this.selectedCard) {
            this.selectedCard.classList.remove('selected');
            this.selectedCard = null;
        }
        
        // Remove target highlights
        this.opponentSlots.forEach(slot => {
            slot.classList.remove('valid-target');
        });
    }

    // Highlight possible attack targets
    highlightPossibleTargets() {
        console.log('🎯 Highlighting possible targets');
        this.opponentSlots.forEach((slot, index) => {
            if (slot.children.length > 0) {
                slot.classList.add('valid-target');
                slot.onclick = () => {
                    console.log(`🎯 Target clicked: slot ${index}`);
                    const playerSlotIndex = Array.from(this.playerSlots).findIndex(
                        s => s.contains(this.selectedCard)
                    );
                    console.log(`🗡️ Attacking from slot ${playerSlotIndex} to slot ${index}`);
                    if (playerSlotIndex !== -1) {
                        game.attackWithCard('player', playerSlotIndex, index);
                        this.deselectCard();
                    }
                };
            }
        });
    }

    // Show card tooltip with lore
    showCardTooltip(card, cardElement) {
        // Remove existing tooltip
        this.hideCardTooltip();
        
        const tooltip = document.createElement('div');
        tooltip.id = 'card-tooltip';
        tooltip.style.cssText = `
            position: absolute;
            background: linear-gradient(135deg, rgba(32, 32, 32, 0.95) 0%, rgba(16, 16, 16, 0.95) 100%);
            border: 2px solid #d4af37;
            border-radius: 8px;
            padding: 10px;
            color: #d4af37;
            font-family: 'Abaddon', cursive;
            font-size: 10px;
            max-width: 200px;
            z-index: 1000;
            box-shadow: 0 0 20px rgba(212, 175, 55, 0.3);
            pointer-events: none;
        `;
        
        tooltip.innerHTML = `
            <div style="font-weight: bold; margin-bottom: 5px;">${card.name}</div>
            <div style="font-style: italic; opacity: 0.8;">"${card.lore}"</div>
            <div style="margin-top: 5px;">
                Cost: ${card.cost} | Attack: ${card.attack} | Health: ${card.currentHealth}
            </div>
        `;

        document.body.appendChild(tooltip);

        // Position tooltip
        const rect = cardElement.getBoundingClientRect();
        tooltip.style.left = (rect.left + rect.width / 2 - tooltip.offsetWidth / 2) + 'px';
        tooltip.style.top = (rect.top - tooltip.offsetHeight - 10) + 'px';
        
        // Ensure tooltip stays on screen
        const tooltipRect = tooltip.getBoundingClientRect();
        if (tooltipRect.left < 10) tooltip.style.left = '10px';
        if (tooltipRect.right > window.innerWidth - 10) {
            tooltip.style.left = (window.innerWidth - tooltip.offsetWidth - 10) + 'px';
        }
        if (tooltipRect.top < 10) {
            tooltip.style.top = (rect.bottom + 10) + 'px';
        }
    }

    hideCardTooltip() {
        const tooltip = document.getElementById('card-tooltip');
        if (tooltip) {
            tooltip.remove();
        }
    }

    // Update the entire UI based on game state
    updateGameUI(gameState) {
        this.updateMeridianBar(gameState.player.meridian);
        this.updateHands(gameState);
        this.updateBattlefield(gameState);
        this.updateDeckCounters(gameState);
        this.updateTurnIndicator(gameState);
        
        // Check for game end
        if (gameState.gamePhase === 'ended') {
            this.showGameEndScreen(gameState.winner);
        }
    }

    // Update Meridian bar
    updateMeridianBar(meridian) {
        const percentage = (meridian.current / meridian.max) * 100;
        this.meridianFill.style.width = percentage + '%';
        this.meridianText.textContent = `${meridian.current}/${meridian.max}`;
    }

    // Update player hands
    updateHands(gameState) {
        // Clear hands
        this.playerHand.innerHTML = '';
        this.opponentHand.innerHTML = '';

        // Render player hand (maximum 4 cards)
        gameState.player.hand.forEach(card => {
            const cardEl = this.createCardElement(card, true);
            this.playerHand.appendChild(cardEl);
        });

        // Render opponent hand (face down, maximum 4 cards)
        for (let i = 0; i < gameState.opponent.hand.length; i++) {
            const cardBack = document.createElement('div');
            cardBack.className = 'card card-back';
            cardBack.innerHTML = '<div class="card-art">?</div>';
            this.opponentHand.appendChild(cardBack);
        }
    }

    // Update battlefield
    updateBattlefield(gameState) {
        // Remember if we had a selected card before clearing
        const hadSelectedCard = !!this.selectedCard;
        let selectedCardSlot = -1;
        
        if (hadSelectedCard) {
            selectedCardSlot = Array.from(this.playerSlots).findIndex(
                slot => slot.contains(this.selectedCard)
            );
        }

        // Clear battlefield
        this.playerSlots.forEach(slot => slot.innerHTML = '');
        this.opponentSlots.forEach(slot => slot.innerHTML = '');

        // Render player field
        gameState.player.field.forEach((card, index) => {
            console.log(`🎯 Player slot ${index}:`, card);
            if (card && card.currentHealth > 0) {
                const cardEl = this.createCardElement(card, false, 'player');
                this.playerSlots[index].appendChild(cardEl);
                this.playerSlots[index].classList.add('occupied');
            } else {
                this.playerSlots[index].classList.remove('occupied');
                if (card && card.currentHealth <= 0) {
                    console.log(`💀 Dead card removed from player slot ${index}: ${card.name}`);
                }
            }
        });

        // Render opponent field
        gameState.opponent.field.forEach((card, index) => {
            console.log(`🎯 Opponent slot ${index}:`, card);
            if (card && card.currentHealth > 0) {
                const cardEl = this.createCardElement(card, false, 'opponent');
                this.opponentSlots[index].appendChild(cardEl);
                this.opponentSlots[index].classList.add('occupied');
            } else {
                this.opponentSlots[index].classList.remove('occupied');
                if (card && card.currentHealth <= 0) {
                    console.log(`💀 Dead card removed from opponent slot ${index}: ${card.name}`);
                }
            }
        });

        // Restore selection if we had one
        if (hadSelectedCard && selectedCardSlot !== -1 && this.playerSlots[selectedCardSlot].children.length > 0) {
            const cardToReselect = this.playerSlots[selectedCardSlot].children[0];
            this.selectCard(cardToReselect);
        }
    }

    // Update deck counters
    updateDeckCounters(gameState) {
        this.playerDeckCounter.textContent = gameState.player.deckCount;
        this.opponentDeckCounter.textContent = gameState.opponent.deckCount;
    }

    // Update turn indicator
    updateTurnIndicator(gameState) {
        // Update turn indicator text and style
        if (this.turnIndicator) {
            const isMyTurn = gameState.currentPlayer === 'player';
            if (gameState.gamePhase === 'playing') {
                this.turnIndicator.textContent = isMyTurn ? 'YOUR TURN' : 'OPPONENT\'S TURN';
                this.turnIndicator.style.borderColor = isMyTurn ? '#ffd700' : '#808080';
                this.turnIndicator.style.color = isMyTurn ? '#ffd700' : '#c0c0c0';
                this.turnIndicator.style.background = isMyTurn 
                    ? 'linear-gradient(135deg, #4a3f00 0%, #2d2600 100%)'
                    : 'linear-gradient(135deg, #3a3a3a 0%, #1a1a1a 100%)';
            } else {
                this.turnIndicator.textContent = gameState.gamePhase === 'waiting' ? 'Waiting for game...' : 'Game ended';
                this.turnIndicator.style.borderColor = '#808080';
                this.turnIndicator.style.color = '#c0c0c0';
            }
        }

        // Update end turn button state
        const endTurnBtn = document.getElementById('end-turn-btn');
        if (endTurnBtn) {
            endTurnBtn.disabled = gameState.currentPlayer !== 'player' || gameState.gamePhase !== 'playing';
            endTurnBtn.style.opacity = (gameState.currentPlayer === 'player' && gameState.gamePhase === 'playing') ? '1' : '0.5';
        }

        // Disable card interactions when not player's turn
        this.togglePlayerInteractions(gameState.currentPlayer === 'player' && gameState.gamePhase === 'playing');
    }

    // Enable/disable player interactions
    togglePlayerInteractions(enabled) {
        const playerHand = document.getElementById('player-hand');
        const playerArea = document.getElementById('player-area');
        
        if (playerHand) {
            playerHand.style.pointerEvents = enabled ? 'auto' : 'none';
            playerHand.style.opacity = enabled ? '1' : '0.7';
        }
        
        if (playerArea) {
            playerArea.style.pointerEvents = enabled ? 'auto' : 'none';
        }
    }

    // Show game end screen
    showGameEndScreen(winner) {
        // Play victory or defeat sound
        if (window.simpleAudio) {
            console.log(`🎵 UI: Triggering ${winner === 'player' ? 'victory' : 'defeat'} sound`);
            if (winner === 'player') {
                simpleAudio.playVictory();
            } else {
                simpleAudio.playDefeat();
            }
        } else {
            console.log('❌ UI: simpleAudio not available for victory/defeat');
        }
        
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 2000;
        `;

        const modal = document.createElement('div');
        modal.style.cssText = `
            background: linear-gradient(135deg, rgba(51, 51, 51, 0.95) 0%, rgba(32, 32, 32, 0.95) 100%);
            border: 3px solid #d4af37;
            border-radius: 15px;
            padding: 40px;
            text-align: center;
            color: #d4af37;
            font-family: 'Abaddon', cursive;
            box-shadow: 0 0 50px rgba(212, 175, 55, 0.8);
        `;

        modal.innerHTML = `
            <h2 style="margin-top: 0; font-size: 24px; text-shadow: 0 0 15px rgba(212, 175, 55, 0.8);">
                ${winner === 'player' ? 'Victory!' : 'Defeat...'}
            </h2>
            <p style="font-size: 16px; margin: 20px 0;">
                ${winner === 'player' 
                    ? 'The eldritch forces bow to your will!' 
                    : 'The void has consumed your mind...'}
            </p>
            <button onclick="location.reload()" style="
                padding: 12px 24px;
                background: linear-gradient(135deg, rgba(51, 51, 51, 0.9) 0%, rgba(32, 32, 32, 0.9) 100%);
                border: 2px solid #d4af37;
                border-radius: 8px;
                color: #d4af37;
                font-family: 'Abaddon', cursive;
                font-size: 14px;
                cursor: pointer;
            ">New Game</button>
        `;

        overlay.appendChild(modal);
        document.body.appendChild(overlay);
    }

    // End turn
    endTurn() {
        if (game.gameState.currentPlayer === 'player') {
            game.endTurn();
        }
    }

    // Initialize the game UI
    startGame() {
        game.initializeGame();
    }
}

// Global UI instance and helper function
let eldritchUI = new EldritchUI();

// Global function for game.js to call
function updateGameUI(gameState) {
    eldritchUI.updateGameUI(gameState);
}

// Auto-start game when page loads
document.addEventListener('DOMContentLoaded', () => {
    console.log('Starting Eldritch TCG...');
    eldritchUI.startGame();
    
    // Initialize simple audio
    console.log('Setting up simple audio...');
    
    // Music mute button
    const muteBtn = document.getElementById('mute-music');
    if (muteBtn) {
        muteBtn.addEventListener('click', () => {
            console.log('Mute button clicked');
            if (window.simpleAudio) {
                const isMuted = window.simpleAudio.toggleAmbientMusic();
                // Update button text based on state
                if (isMuted) {
                    muteBtn.innerHTML = '🔇 Music';
                    muteBtn.style.opacity = '0.6';
                } else {
                    muteBtn.innerHTML = '🔊 Music';
                    muteBtn.style.opacity = '1';
                }
            } else {
                console.error('simpleAudio not found');
            }
        });
    }


});