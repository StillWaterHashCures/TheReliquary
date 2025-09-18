// Eldritch TCG - Server Application
// Node.js WebSocket server for real-time multiplayer TCG

const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');
const { GameRoomManager } = require('./rooms');
const { EldritchGameLogic } = require('./gameLogic');
const cardsData = require('./cards.json');

class EldritchServer {
    constructor() {
        this.app = express();
        this.server = http.createServer(this.app);
        this.wss = new WebSocket.Server({ 
            server: this.server
        });
        
        this.roomManager = new GameRoomManager();
        this.gameLogic = new EldritchGameLogic(cardsData);
        this.connections = new Map(); // playerId -> WebSocket
        
        this.setupExpress();
        this.setupWebSocket();
    }

    setupExpress() {
        // Serve static files from client directory
        this.app.use(express.static(path.join(__dirname, '../client')));
        this.app.use(express.json());

        // API routes
        this.app.get('/api/cards', (req, res) => {
            res.json(cardsData);
        });

        this.app.get('/api/health', (req, res) => {
            res.json({ 
                status: 'ok', 
                timestamp: new Date().toISOString(),
                activeRooms: this.roomManager.getActiveRoomCount(),
                connectedPlayers: this.connections.size
            });
        });

        // Serve main game page
        this.app.get('/', (req, res) => {
            res.sendFile(path.join(__dirname, '../client/index.html'));
        });
    }

    setupWebSocket() {
        console.log('WebSocket server starting...');

        this.wss.on('connection', (ws, request) => {
            const clientId = this.generateClientId();
            console.log(`New client connected: ${clientId}`);

            // Store connection
            ws.clientId = clientId;
            ws.playerId = null;
            ws.gameRoom = null;
            
            // Setup message handling
            ws.on('message', (message) => {
                try {
                    const data = JSON.parse(message);
                    this.handleMessage(ws, data);
                } catch (error) {
                    console.error('Error parsing message:', error);
                    this.sendError(ws, 'Invalid message format');
                }
            });

            // Handle disconnection
            ws.on('close', () => {
                console.log(`Client disconnected: ${clientId}`);
                this.handleDisconnection(ws);
            });

            // Handle WebSocket errors
            ws.on('error', (error) => {
                console.error(`WebSocket error for client ${clientId}:`, error);
            });

            // Send initial connection acknowledgment
            this.sendMessage(ws, 'connected', { clientId });
        });

        console.log('WebSocket server ready');
    }

    handleMessage(ws, message) {
        console.log(`Message from ${ws.clientId}:`, message.type, message.data);

        switch (message.type) {
            case 'joinRoom':
                this.handleJoinRoom(ws, message.data);
                break;

            case 'playerAction':
                this.handlePlayerAction(ws, message.data);
                break;

            case 'ping':
                this.sendMessage(ws, 'pong', { timestamp: Date.now() });
                break;

            default:
                console.warn(`Unknown message type: ${message.type}`);
                this.sendError(ws, `Unknown message type: ${message.type}`);
        }
    }

    handleJoinRoom(ws, data) {
        try {
            let room;
            
            if (data.roomCode) {
                // Try to join existing room
                room = this.roomManager.joinRoom(data.roomCode);
                if (!room) {
                    this.sendError(ws, `Room ${data.roomCode} not found or full`);
                    return;
                }
            } else {
                // Create new room
                room = this.roomManager.createRoom();
            }

            // Assign player to room
            const playerRole = room.addPlayer(ws.clientId);
            ws.playerId = ws.clientId; // Use client ID as player ID
            ws.gameRoom = room.code;
            
            // Store connection reference
            this.connections.set(ws.clientId, ws);

            console.log(`Player ${ws.clientId} (${playerRole}) joined room ${room.code}`);

            // Send player assignment
            this.sendMessage(ws, 'playerAssigned', {
                playerId: ws.clientId,
                gameRoom: room.code
            });

            // Send room code to first player
            if (room.playerCount === 1) {
                this.sendMessage(ws, 'roomCode', { code: room.code });
            }

            // If room is full, start the game
            if (room.isFull()) {
                console.log(`Room ${room.code} is full. Starting game...`);
                this.startGame(room);
            } else {
                // Notify about waiting for opponent
                this.broadcastToRoom(room.code, 'waitingForOpponent', {
                    playersConnected: room.playerCount,
                    playersNeeded: room.maxPlayers
                });
            }

        } catch (error) {
            console.error('Error handling join room:', error);
            this.sendError(ws, 'Failed to join room');
        }
    }

    handlePlayerAction(ws, actionData) {
        const room = this.roomManager.getRoom(ws.gameRoom);
        if (!room || !ws.playerId) {
            this.sendError(ws, 'Not in a valid game room');
            return;
        }

        try {
            // Validate and process the action through game logic
            const result = this.gameLogic.processAction(room, ws.playerId, actionData);
            
            if (result.success) {
                // Update room game state first
                room.updateGameState(result.gameState);

                // Broadcast the complete updated game state to both players
                this.broadcastToRoom(room.code, 'gameStateUpdate', {
                    gameState: result.gameState,
                    action: {
                        type: actionData.type,
                        playerId: ws.playerId,
                        ...actionData
                    },
                    discardedCard: result.discardedCard
                });

                // Send success confirmation to acting player
                this.sendMessage(ws, 'actionSuccess', {
                    type: actionData.type,
                    gameState: result.gameState
                });

                // Check for game end
                if (result.gameEnded) {
                    this.endGame(room, result.winner);
                }

            } else {
                this.sendError(ws, result.error || 'Invalid action');
            }

        } catch (error) {
            console.error('Error processing player action:', error);
            this.sendError(ws, 'Failed to process action');
        }
    }

    startGame(room) {
        console.log(`Starting game in room ${room.code}`);

        // Initialize game state
        const initialGameState = this.gameLogic.initializeGame(room.players);
        room.gameState = initialGameState;
        room.status = 'playing';

        // Notify both players
        this.broadcastToRoom(room.code, 'gameStart', {
            gameState: initialGameState
        });

        this.broadcastToRoom(room.code, 'opponentConnected');
    }

    endGame(room, winner) {
        console.log(`Game ended in room ${room.code}. Winner: ${winner}`);
        
        room.status = 'ended';
        
        this.broadcastToRoom(room.code, 'gameEnd', {
            winner,
            finalGameState: room.gameState
        });

        // Clean up room after delay
        setTimeout(() => {
            this.roomManager.removeRoom(room.code);
        }, 30000); // 30 seconds
    }

    handleDisconnection(ws) {
        if (ws.playerId) {
            this.connections.delete(ws.playerId);
        }

        if (ws.gameRoom) {
            const room = this.roomManager.getRoom(ws.gameRoom);
            if (room) {
                // Notify opponent of disconnection
                const opponentId = room.getOpponentId(ws.playerId);
                const opponentWs = this.connections.get(opponentId);
                
                if (opponentWs) {
                    this.sendMessage(opponentWs, 'opponentDisconnected');
                }

                // Remove room if game hasn't started or handle reconnection logic
                if (room.status === 'waiting') {
                    this.roomManager.removeRoom(room.code);
                }
            }
        }
    }

    // Utility methods
    sendMessage(ws, type, data = {}) {
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({
                type,
                data,
                timestamp: Date.now()
            }));
        }
    }

    sendError(ws, message) {
        this.sendMessage(ws, 'error', { message });
    }

    broadcastToRoom(roomCode, type, data = {}) {
        const room = this.roomManager.getRoom(roomCode);
        if (!room) return;

        room.players.forEach(playerId => {
            const ws = this.connections.get(playerId);
            if (ws) {
                this.sendMessage(ws, type, data);
            }
        });
    }

    generateClientId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    start(port = 3000) {
        this.server.listen(port, () => {
            console.log(`Eldritch TCG Server running on port ${port}`);
            console.log(`Game client available at http://localhost:${port}`);
            console.log(`WebSocket server running on same port`);
        });
    }
}

// Start the server
if (require.main === module) {
    const server = new EldritchServer();
    const port = process.env.PORT || 3000;
    server.start(port);
}

module.exports = { EldritchServer };