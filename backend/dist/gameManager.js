"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.gameManager = exports.GameManager = void 0;
const rules_1 = require("./rules");
class GameManager {
    constructor() {
        this.games = new Map();
    }
    createGame(hostName, hostId) {
        const code = this.generateCode();
        const info = {
            code,
            players: [{
                    id: hostId,
                    name: hostName,
                    color: 'red', // Host is always red for simplicity
                    ready: false
                }],
            tokens: (0, rules_1.initializeBoard)(),
            currentPlayerIndex: 0,
            diceValue: null,
            status: 'lobby',
            winner: null,
            lastRollBy: null,
            waitingForMove: false
        };
        this.games.set(code, info);
        return info;
    }
    getGame(code) {
        return this.games.get(code);
    }
    joinGame(code, playerName, playerId) {
        const game = this.games.get(code);
        if (!game)
            return { success: false, message: "Game not found" };
        if (game.status !== 'lobby')
            return { success: false, message: "Game already started" };
        if (game.players.length >= 4)
            return { success: false, message: "Game full" };
        const colors = ['red', 'green', 'blue', 'yellow'];
        const nextColor = colors[game.players.length];
        const newPlayer = {
            id: playerId,
            name: playerName,
            color: nextColor,
            ready: false
        };
        game.players.push(newPlayer);
        return { success: true, game };
    }
    removePlayer(code, playerId) {
        const game = this.games.get(code);
        if (!game)
            return;
        // If lobby, just remove
        if (game.status === 'lobby') {
            game.players = game.players.filter(p => p.id !== playerId);
            if (game.players.length === 0) {
                this.games.delete(code);
                return undefined;
            }
        }
        else {
            // If in game, keeping state is tricky. For MVP, maybe mark as disconnected?
            // User asked to handle disconnects by allowing rejoin.
            // We won't remove from array, just connection logic handles it.
            // This method might be for "leaving" explicitly.
        }
        return game;
    }
    generateCode() {
        // Generate 6-char alphanumeric code
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // No I, 1, O, 0 to avoid confusion
        let result = '';
        for (let i = 0; i < 6; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        // Ensure uniqueness
        if (this.games.has(result))
            return this.generateCode();
        return result;
    }
}
exports.GameManager = GameManager;
exports.gameManager = new GameManager();
