// Eldritch TCG - Room Management System
// Handles game room creation, joining, and management

class GameRoom {
    constructor(code) {
        this.code = code;
        this.players = []; // Array of player IDs
        this.maxPlayers = 2;
        this.gameState = null;
        this.status = 'waiting'; // waiting, playing, ended
        this.createdAt = Date.now();
        this.lastActivity = Date.now();
    }

    addPlayer(playerId) {
        if (this.players.length >= this.maxPlayers) {
            throw new Error('Room is full');
        }

        if (this.players.includes(playerId)) {
            throw new Error('Player already in room');
        }

        this.players.push(playerId);
        this.lastActivity = Date.now();
        
        // Return player role (player1 = 'player', player2 = 'opponent' from first player's perspective)
        return this.players.length === 1 ? 'player' : 'opponent';
    }

    removePlayer(playerId) {
        const index = this.players.indexOf(playerId);
        if (index !== -1) {
            this.players.splice(index, 1);
            this.lastActivity = Date.now();
        }
    }

    isFull() {
        return this.players.length >= this.maxPlayers;
    }

    isEmpty() {
        return this.players.length === 0;
    }

    get playerCount() {
        return this.players.length;
    }

    getOpponentId(playerId) {
        return this.players.find(id => id !== playerId);
    }

    updateGameState(newState) {
        this.gameState = { ...this.gameState, ...newState };
        this.lastActivity = Date.now();
    }

    isExpired(maxIdleTime = 1800000) { // 30 minutes
        return Date.now() - this.lastActivity > maxIdleTime;
    }
}

class GameRoomManager {
    constructor() {
        this.rooms = new Map();
        this.playerRooms = new Map(); // playerId -> roomCode
        
        // Clean up expired rooms every 5 minutes
        setInterval(() => {
            this.cleanupExpiredRooms();
        }, 300000);

        console.log('GameRoomManager initialized');
    }

    // Generate a 4-digit room code
    generateRoomCode() {
        let code;
        let attempts = 0;
        const maxAttempts = 1000;

        do {
            code = Math.floor(1000 + Math.random() * 9000).toString();
            attempts++;
            
            if (attempts >= maxAttempts) {
                throw new Error('Unable to generate unique room code');
            }
        } while (this.rooms.has(code));

        return code;
    }

    // Create a new game room
    createRoom() {
        const roomCode = this.generateRoomCode();
        const room = new GameRoom(roomCode);
        
        this.rooms.set(roomCode, room);
        console.log(`Created room: ${roomCode}`);
        
        return room;
    }

    // Join an existing room or create new one
    joinRoom(roomCode = null) {
        if (roomCode) {
            const room = this.rooms.get(roomCode);
            if (!room) {
                return null; // Room doesn't exist
            }
            
            if (room.isFull()) {
                return null; // Room is full
            }
            
            return room;
        } else {
            // Create new room if no code provided
            return this.createRoom();
        }
    }

    // Get room by code
    getRoom(roomCode) {
        return this.rooms.get(roomCode) || null;
    }

    // Remove a room
    removeRoom(roomCode) {
        const room = this.rooms.get(roomCode);
        if (room) {
            // Remove player mappings
            room.players.forEach(playerId => {
                this.playerRooms.delete(playerId);
            });
            
            this.rooms.delete(roomCode);
            console.log(`Removed room: ${roomCode}`);
            return true;
        }
        return false;
    }

    // Get room by player ID
    getPlayerRoom(playerId) {
        const roomCode = this.playerRooms.get(playerId);
        return roomCode ? this.getRoom(roomCode) : null;
    }

    // Associate player with room
    setPlayerRoom(playerId, roomCode) {
        this.playerRooms.set(playerId, roomCode);
    }

    // Remove player from their room
    removePlayerFromRoom(playerId) {
        const roomCode = this.playerRooms.get(playerId);
        if (roomCode) {
            const room = this.getRoom(roomCode);
            if (room) {
                room.removePlayer(playerId);
                
                // Remove room if empty
                if (room.isEmpty()) {
                    this.removeRoom(roomCode);
                }
            }
            this.playerRooms.delete(playerId);
        }
    }

    // Clean up expired rooms
    cleanupExpiredRooms() {
        let removedCount = 0;
        
        for (const [roomCode, room] of this.rooms) {
            if (room.isExpired()) {
                this.removeRoom(roomCode);
                removedCount++;
            }
        }
        
        if (removedCount > 0) {
            console.log(`Cleaned up ${removedCount} expired rooms`);
        }
    }

    // Get statistics
    getStats() {
        const totalRooms = this.rooms.size;
        const activeRooms = Array.from(this.rooms.values()).filter(
            room => room.status === 'playing'
        ).length;
        const waitingRooms = Array.from(this.rooms.values()).filter(
            room => room.status === 'waiting'
        ).length;

        return {
            totalRooms,
            activeRooms,
            waitingRooms,
            totalPlayers: this.playerRooms.size
        };
    }

    // Get active room count
    getActiveRoomCount() {
        return Array.from(this.rooms.values()).filter(
            room => room.status === 'playing'
        ).length;
    }

    // List all rooms (for debugging)
    listRooms() {
        const roomList = [];
        for (const [code, room] of this.rooms) {
            roomList.push({
                code,
                playerCount: room.playerCount,
                status: room.status,
                createdAt: new Date(room.createdAt).toISOString(),
                lastActivity: new Date(room.lastActivity).toISOString()
            });
        }
        return roomList;
    }
}

module.exports = { GameRoom, GameRoomManager };