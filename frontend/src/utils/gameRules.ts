import { GameState, PlayerColor, Token } from '../types';

// --- COORDINATE CONSTANTS (Matches Backend) ---
// Note: Frontend uses these only for logic now. 
// Visual Board constants are in Board.tsx (can be refactored later if needed)

export const PATH_LENGTH = 52;

// Start offsets for each color
const START_OFFSETS: Record<PlayerColor, number> = {
    red: 0,
    green: 13,
    yellow: 26,
    blue: 39
};

// Start Squares and Star Squares (Safe Spots)
// 0, 8, 13, 21, 26, 34, 39, 47 (Relative to 0-51 loop? No, these are usually absolute or relative-to-board?)
// Backend DEFINITION:
// const SAFE_SPOTS = [0, 8, 13, 21, 26, 34, 39, 47]; // These look like relative steps on a 52-path?
// No, standard Ludo safe spots are usually fixed board positions.
// Let's copy exactly what backend uses.
// Backend rules.ts:
// const SAFE_SPOTS = [0, 8, 13, 21, 26, 34, 39, 47];
// function toAbsolutePosition...

function toAbsolutePosition(color: PlayerColor, relativePos: number): number {
    if (relativePos < 0 || relativePos >= 52) return -1;
    return (relativePos + START_OFFSETS[color]) % 52;
}

export function isValidMove(
    gameState: GameState,
    playerId: string,
    tokenIndex: number,
    steps: number
): boolean {
    const player = gameState.players.find(p => p.id === playerId);
    if (!player) return false;

    // Check if it's player's turn (redundant for auto-move check but good safety)
    if (gameState.players[gameState.currentPlayerIndex].id !== playerId) return false;

    const tokens = gameState.tokens[player.color];
    const token = tokens[tokenIndex];

    if (token.status === 'finished') return false;

    // Rule: Need 6 to leave home
    if (token.position === -1) {
        return steps === 6;
    }

    const newPosition = token.position + steps;

    // Rule: Cannot overshoot finish (must land exactly on 57)
    if (newPosition > 57) return false;

    return true;
}

/**
 * Helper to find all valid moves for the current player
 */
export function getValidMoves(gameState: GameState, playerId: string, steps: number): number[] {
    const validTokenIndices: number[] = [];
    const player = gameState.players.find(p => p.id === playerId);
    if (!player) return [];

    // Ensure we are checking the right player's tokens
    const tokens = gameState.tokens[player.color];

    tokens.forEach((_, index) => {
        if (isValidMove(gameState, playerId, index, steps)) {
            validTokenIndices.push(index);
        }
    });

    return validTokenIndices;
}
