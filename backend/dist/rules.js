"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PATH_LENGTH = void 0;
exports.initializeBoard = initializeBoard;
exports.rollDice = rollDice;
exports.isValidMove = isValidMove;
exports.canPlayerMove = canPlayerMove;
exports.applyMove = applyMove;
exports.PATH_LENGTH = 52;
function initializeBoard() {
    const colors = ['red', 'green', 'blue', 'yellow'];
    const tokens = {};
    colors.forEach(c => {
        tokens[c] = [
            { id: 0, position: -1, status: 'home' },
            { id: 1, position: -1, status: 'home' },
            { id: 2, position: -1, status: 'home' },
            { id: 3, position: -1, status: 'home' }
        ];
    });
    return tokens;
}
function rollDice() {
    // Weighted Roll: 20% chance to force a 6
    if (Math.random() < 0.2) {
        return 6;
    }
    return Math.floor(Math.random() * 6) + 1;
}
/**
 * Check if a move is valid.
 * This is a simplified Ludo logic:
 * - Must roll 6 to exit home.
 * - Cannot move beyond finish.
 * - Capturing logic will be in applyMove.
 */
function isValidMove(gameState, playerId, tokenIndex, steps) {
    const player = gameState.players.find(p => p.id === playerId);
    if (!player)
        return false;
    if (gameState.players[gameState.currentPlayerIndex].id !== playerId)
        return false;
    const tokens = gameState.tokens[player.color];
    const token = tokens[tokenIndex];
    if (token.status === 'finished')
        return false;
    // Rule: Need 6 to leave home
    if (token.position === -1) {
        return steps === 6;
    }
    // Rule: Cannot overshoot destination (57 is calculated finish index relative to start)
    // Actual path logic is complex due to relative offsets.
    // We'll simplify: 
    // Main path: 0-51 (52 squares)
    // Home stretch: 52-57 (6 squares)
    // Total distance from start = 57.
    // Current implementation assumes 'position' is relative to player's start.
    // 0 is the start square for that color.
    return (token.position + steps) <= 57;
}
function canPlayerMove(gameState, playerId, diceValue) {
    const player = gameState.players.find(p => p.id === playerId);
    if (!player)
        return false;
    const tokens = gameState.tokens[player.color];
    return tokens.some((_, index) => isValidMove(gameState, playerId, index, diceValue));
}
function applyMove(gameState, playerId, tokenIndex, steps) {
    // Clone state to avoid mutation (or mutate if carefully managed, but cloning is safer for sync)
    // For MVP we mutate for speed, assuming single-threaded Node.js event loop logic.
    const player = gameState.players.find(p => p.id === playerId);
    if (!player)
        return gameState;
    const tokens = gameState.tokens[player.color];
    const token = tokens[tokenIndex];
    // Move out of home
    if (token.position === -1 && steps === 6) {
        token.position = 0;
        token.status = 'active';
    }
    else if (token.position !== -1) {
        token.position += steps;
    }
    // Check completion
    if (token.position === 57) {
        token.status = 'finished';
    }
    // TODO: Implement Captures (Collision with other players)
    // This requires converting relative position to absolute board position.
    // Check turn change
    // Rule: rolling 6 gives another turn.
    if (steps !== 6) {
        gameState.currentPlayerIndex = (gameState.currentPlayerIndex + 1) % gameState.players.length;
    }
    gameState.waitingForMove = false;
    gameState.diceValue = null;
    return gameState;
}
