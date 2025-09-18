// Eldritch TCG - WebSocket Client
// Handles real-time multiplayer communication

class EldritchNetworking {
    constructor() {
        this.socket = null;
        this.connected = false;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 1000;
        this.playerId = null;
        this.gameRoom = null;
        
        // Try to connect to server (default localhost for development)
        this.serverUrl = 'ws://localhost:3000';
        this.connect();
    }

    // Connect to WebSocket server
    connect() {
        try {
            console.log('Attempting to connect to server...');
            this.socket = new WebSocket(this.serverUrl);
            
            this.socket.onopen = (event) => {
                console.log('Connected to Eldritch TCG server');
                this.connected = true;
                this.reconnectAttempts = 0;
                
                // Request to join a game room
                this.requestGameRoom();
            };

            this.socket.onmessage = (event) => {
                try {
                    const message = JSON.parse(event.data);
                    this.handleMessage(message);
                } catch (error) {
                    console.error('Error parsing WebSocket message:', error);
                }
            };

            this.socket.onclose = (event) => {
                console.log('Disconnected from server');
                this.connected = false;
                
                // Attempt to reconnect if not intentionally closed
                if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
                    setTimeout(() => {
                        this.reconnectAttempts++;
                        console.log(`Reconnect attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
                        this.connect();
                    }, this.reconnectDelay * this.reconnectAttempts);
                }
            };

            this.socket.onerror = (error) => {
                console.error('WebSocket error:', error);
            };
            
        } catch (error) {
            console.error('Failed to connect to server:', error);
            // Fall back to local single-player mode
            this.startLocalGame();
        }
    }

    // Send message to server
    sendMessage(type, data = {}) {
        if (this.connected && this.socket.readyState === WebSocket.OPEN) {
            const message = {
                type,
                data,
                playerId: this.playerId,
                gameRoom: this.gameRoom,
                timestamp: Date.now()
            };
            
            this.socket.send(JSON.stringify(message));
            console.log('Sent message:', type, data);
        } else {
            console.warn('Cannot send message - not connected to server');
        }
    }

    // Handle incoming messages from server
    handleMessage(message) {
        console.log('Received message:', message.type, message.data);

        switch (message.type) {
            case 'playerAssigned':
                this.playerId = message.data.playerId;
                this.gameRoom = message.data.gameRoom;
                console.log(`🎮 ASSIGNED as player ${this.playerId} in room ${this.gameRoom}`);
                break;

            case 'gameStart':
                this.handleGameStart(message.data);
                break;

            case 'gameStateUpdate':
                this.handleGameStateUpdate(message.data);
                break;

            case 'actionSuccess':
                this.handleActionSuccess(message.data);
                break;

            case 'gameStateSync':
                this.syncGameState(message.data);
                break;

            case 'playerAction':
                this.handlePlayerAction(message.data);
                break;

            case 'opponentConnected':
                console.log('Opponent connected - game can begin!');
                this.showConnectionStatus('Connected to opponent');
                break;

            case 'opponentDisconnected':
                console.log('Opponent disconnected');
                this.showConnectionStatus('Opponent disconnected');
                break;

            case 'gameEnd':
                this.handleGameEnd(message.data);
                break;

            case 'error':
                console.error('Server error:', message.data.message);
                this.showConnectionStatus(`Error: ${message.data.message}`);
                break;

            case 'roomCode':
                this.displayRoomCode(message.data.code);
                break;

            default:
                console.warn('Unknown message type:', message.type);
        }
    }

    // Request to join a game room
    requestGameRoom() {
        this.sendMessage('joinRoom', {
            roomCode: this.getUrlRoomCode() // Check if room code provided in URL
        });
    }

    // Get room code from URL parameters
    getUrlRoomCode() {
        const params = new URLSearchParams(window.location.search);
        return params.get('room');
    }

    // Handle game start
    handleGameStart(data) {
        console.log('🎮 Game starting with data:', data);
        
        // Initialize game with server data
        if (typeof game !== 'undefined') {
            // Map server player IDs to local player/opponent
            const serverGameState = data.gameState;
            const localGameState = this.mapServerGameState(serverGameState);
            if (localGameState) {
                game.gameState = localGameState;
                game.gameState.gamePhase = 'playing';
                game.updateUI();
            }
        }
        
        this.showConnectionStatus('Game started!');
    }

    // Handle game state updates from server
    handleGameStateUpdate(data) {
        console.log('Received game state update:', data);
        
        if (typeof game !== 'undefined') {
            const localGameState = this.mapServerGameState(data.gameState);
            if (localGameState) {
                game.gameState = localGameState;
                game.updateUI();
                
                // Show action feedback
                if (data.action && data.action.playerId !== this.playerId) {
                    console.log(`Opponent performed action: ${data.action.type}`);
                }
                
                // Show discard notification
                if (data.discardedCard) {
                    this.showDiscardNotification(data.discardedCard);
                }
            }
        }
    }

    // Handle action success confirmation
    handleActionSuccess(data) {
        console.log('Action successful:', data);
        
        // Trigger audio for successful actions
        if (window.simpleAudio) {
            switch (data.type) {
                case 'playCard':
                    console.log('🎵 WEBSOCKET: Triggering card play sound (action success)');
                    simpleAudio.playCardPlay();
                    break;
                case 'attack':
                    console.log('🎵 WEBSOCKET: Triggering card hit sound (action success)');
                    simpleAudio.playCardHit();
                    break;
            }
        } else {
            console.log('❌ WEBSOCKET: simpleAudio not available for action success');
        }
        
        // Game state will be updated via gameStateUpdate message
    }

    // Map server game state to local client format
    mapServerGameState(serverGameState) {
        const players = Object.keys(serverGameState.players);
        const myPlayerId = this.playerId;
        const opponentId = players.find(id => id !== myPlayerId);
        
        if (!serverGameState.players[myPlayerId]) {
            console.error('Cannot find my player data in server game state!');
            console.log('My ID:', myPlayerId, 'Available players:', players);
            return null;
        }
        
        const mappedState = {
            player: {
                ...serverGameState.players[myPlayerId],
                role: 'player'
            },
            opponent: serverGameState.players[opponentId] ? {
                ...serverGameState.players[opponentId],
                role: 'opponent'
            } : {
                hand: [],
                field: [null, null, null, null],
                deck: [],
                meridian: { current: 3, max: 3 },
                deckCount: 20,
                role: 'opponent'
            },
            turn: serverGameState.turn,
            currentPlayer: serverGameState.currentPlayer === myPlayerId ? 'player' : 'opponent',
            gamePhase: serverGameState.gamePhase,
            winner: serverGameState.winner === myPlayerId ? 'player' : 
                   serverGameState.winner === opponentId ? 'opponent' : 
                   serverGameState.winner
        };
        
        console.log(`🎮 Turn ${mappedState.turn}: ${mappedState.currentPlayer === 'player' ? 'YOUR TURN' : 'OPPONENT\'S TURN'}`);
        return mappedState;
    }

    // Sync game state with server
    syncGameState(serverGameState) {
        if (typeof game !== 'undefined') {
            // Use server state as authoritative source
            const mappedState = this.mapServerStateToLocal(serverGameState, this.playerId);
            game.gameState = mappedState;
            game.updateUI();
        }
    }

    // Handle opponent player actions
    handlePlayerAction(actionData) {
        console.log('Processing opponent action:', actionData);
        
        if (typeof game === 'undefined') return;

        switch (actionData.type) {
            case 'playCard':
                // Opponent played a card
                if (window.simpleAudio) {
                    console.log('🎵 WEBSOCKET: Triggering card play sound');
                    simpleAudio.playCardPlay();
                } else {
                    console.log('❌ WEBSOCKET: simpleAudio not available for card play');
                }
                game.gameState.opponent.field[actionData.fieldSlot] = actionData.card;
                game.gameState.opponent.hand.splice(actionData.handIndex, 1);
                game.updateUI();
                break;

            case 'attack':
                // Opponent attacked
                if (actionData.targetSlot !== null) {
                    game.cardCombat(
                        actionData.attacker,
                        actionData.target,
                        'opponent',
                        'player',
                        actionData.attackerSlot,
                        actionData.targetSlot
                    );
                }
                game.updateUI();
                break;

            case 'endTurn':
                // Opponent ended turn
                game.endTurn();
                break;

            default:
                console.log('Unknown action type:', actionData.type);
        }
    }

    // Handle game end
    handleGameEnd(data) {
        console.log('Game ended:', data);
        
        if (typeof game !== 'undefined') {
            game.gameState.gamePhase = 'ended';
            game.gameState.winner = data.winner;
            game.updateUI();
        }
    }

    // Send player action to server
    sendPlayerAction(type, actionData) {
        this.sendMessage('playerAction', {
            type,
            ...actionData
        });
    }

    // Show connection status to user
    showConnectionStatus(message) {
        // Create or update status indicator
        let statusEl = document.getElementById('connection-status');
        if (!statusEl) {
            statusEl = document.createElement('div');
            statusEl.id = 'connection-status';
            statusEl.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: linear-gradient(135deg, rgba(51, 51, 51, 0.9) 0%, rgba(32, 32, 32, 0.9) 100%);
                border: 2px solid #d4af37;
                border-radius: 8px;
                padding: 10px 15px;
                color: #d4af37;
                font-family: 'Abaddon', cursive;
                font-size: 12px;
                z-index: 1500;
                transition: all 0.3s ease;
            `;
            document.body.appendChild(statusEl);
        }

        statusEl.textContent = message;
        statusEl.style.opacity = '1';

        // Auto-hide after 3 seconds
        setTimeout(() => {
            if (statusEl) {
                statusEl.style.opacity = '0.3';
            }
        }, 3000);
    }

    showDiscardNotification(discardInfo) {
        // Only show notification for your own discards (psychological warfare!)
        if (discardInfo.playerId === this.playerId) {
            const notification = document.createElement('div');
            notification.style.cssText = `
                position: fixed;
                bottom: 280px;
                left: 50%;
                transform: translateX(-50%);
                background: linear-gradient(135deg, rgba(51, 51, 51, 0.95) 0%, rgba(32, 32, 32, 0.95) 100%);
                border: 2px solid #d4af37;
                border-radius: 8px;
                padding: 8px 12px;
                color: #d4af37;
                font-family: 'Abaddon', cursive;
                font-size: 11px;
                font-weight: bold;
                z-index: 2000;
                animation: discardPop 3s ease-out forwards;
                box-shadow: 0 0 15px rgba(212, 175, 55, 0.3);
            `;
            
            notification.textContent = `💀 Hand Full! Discarded: ${discardInfo.cardName}`;
            document.body.appendChild(notification);

            // Remove after animation
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 3000);
        }
    }

    // Display room code for sharing
    displayRoomCode(code) {
        const roomCodeEl = document.createElement('div');
        roomCodeEl.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: linear-gradient(135deg, #2d2d2d 0%, #1a1a1a 100%);
            border: 3px solid #808080;
            border-radius: 15px;
            padding: 30px;
            text-align: center;
            color: #c0c0c0;
            font-family: 'Abaddon', cursive;
            z-index: 2000;
            box-shadow: 0 0 50px rgba(128, 128, 128, 0.8);
        `;

        roomCodeEl.innerHTML = `
            <h3 style="margin-top: 0;">Waiting for Opponent...</h3>
            <p style="font-size: 24px; letter-spacing: 4px; margin: 20px 0; color: #c0c0c0;">
                ${code}
            </p>
            <p style="font-size: 14px; opacity: 0.8;">
                Share this code with your opponent<br>
                or send them this link:
            </p>
            <div style="display: flex; align-items: center; gap: 10px; margin: 10px 0;">
                <p id="room-link" style="font-size: 12px; background: rgba(0,0,0,0.3); padding: 5px; border-radius: 4px; margin: 0; flex: 1;">
                    ${window.location.origin}${window.location.pathname}?room=${code}
                </p>
                <button id="copy-room-link" style="
                    padding: 5px 10px; 
                    background: #d4af37; 
                    color: #000; 
                    border: none; 
                    border-radius: 4px; 
                    cursor: pointer; 
                    font-family: 'Abaddon', cursive; 
                    font-size: 10px;
                    font-weight: bold;
                ">📋 Copy</button>
            </div>
            
            <div style="
                background: rgba(128, 128, 128, 0.1); 
                border: 1px solid rgba(128, 128, 128, 0.3); 
                border-radius: 8px; 
                padding: 12px; 
                margin: 15px 0;
                text-align: left;
            ">
                <h4 style="margin: 0 0 8px 0; color: #c0c0c0; font-size: 14px;">🎮 How to Play (Super Easy!):</h4>
                <ul style="margin: 0; padding-left: 18px; font-size: 12px; line-height: 1.4;">
                    <li><strong>Goal:</strong> Empty your opponent's deck to win!</li>
                    <li><strong>Turn:</strong> Drag cards from your hand to play them</li>
                    <li><strong>Attack:</strong> Click your cards, then click enemy cards</li>
                    <li><strong>Mana:</strong> Gold bar = energy to play cards (gets bigger each turn)</li>
                    <li><strong>Cards:</strong> Blue circle = cost, Red = attack, Green = health</li>
                </ul>
                <p style="margin: 8px 0 0 0; font-size: 11px; opacity: 0.8; font-style: italic;">
                    💡 Tip: Start with cheap cards, save strong ones for later!
                </p>
            </div>
            
            <button onclick="this.parentElement.remove()" style="
                margin-top: 15px;
                padding: 8px 16px;
                background: transparent;
                border: 1px solid #808080;
                border-radius: 4px;
                color: #c0c0c0;
                cursor: pointer;
            ">Close</button>
        `;

        document.body.appendChild(roomCodeEl);
        
        // Add copy button functionality
        const copyBtn = document.getElementById('copy-room-link');
        if (copyBtn) {
            copyBtn.addEventListener('click', () => {
                const roomLink = `${window.location.origin}${window.location.pathname}?room=${code}`;
                navigator.clipboard.writeText(roomLink).then(() => {
                    copyBtn.innerHTML = '✅ Copied!';
                    copyBtn.style.background = '#4CAF50';
                    setTimeout(() => {
                        copyBtn.innerHTML = '📋 Copy';
                        copyBtn.style.background = '#d4af37';
                    }, 2000);
                }).catch(err => {
                    console.error('Failed to copy:', err);
                    // Fallback for older browsers
                    const textArea = document.createElement('textarea');
                    textArea.value = roomLink;
                    document.body.appendChild(textArea);
                    textArea.select();
                    document.execCommand('copy');
                    document.body.removeChild(textArea);
                    copyBtn.innerHTML = '✅ Copied!';
                    copyBtn.style.background = '#4CAF50';
                    setTimeout(() => {
                        copyBtn.innerHTML = '📋 Copy';
                        copyBtn.style.background = '#d4af37';
                    }, 2000);
                });
            });
        }
    }

    // Start local single-player game if networking fails
    startLocalGame() {
        console.log('Starting in local single-player mode');
        this.showConnectionStatus('Local mode - No multiplayer');
        
        // Initialize local game
        if (typeof eldritchUI !== 'undefined') {
            eldritchUI.startGame();
        }
    }

    // Clean disconnect
    disconnect() {
        if (this.socket) {
            this.socket.close(1000, 'User disconnected');
        }
    }
}

// Global networking instance
let eldritchNet = new EldritchNetworking();
let websocket = eldritchNet; // Alias for game.js compatibility

// Expose networking functions globally for game.js to use
function sendPlayerAction(type, data) {
    if (eldritchNet) {
        eldritchNet.sendPlayerAction(type, data);
    }
}

// Clean up on page unload
window.addEventListener('beforeunload', () => {
    if (eldritchNet) {
        eldritchNet.disconnect();
    }
});