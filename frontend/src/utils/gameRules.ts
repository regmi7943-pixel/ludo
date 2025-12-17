import type { GameState } from '../types';

export const PATH_LENGTH = 52;

export function isValidMove(
    gameState: GameState,
    playerId: string,
    tokenIndex: number,
    steps: number
): boolean {
    const player = gameState.players.find(p => p.id === playerId);
    if (!player) return false;

    // Check if it's player's turn
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

export function getValidMoves(gameState: GameState, playerId: string, steps: number): number[] {
    const validTokenIndices: number[] = [];
    const player = gameState.players.find(p => p.id === playerId);
    if (!player) return [];

    const tokens = gameState.tokens[player.color];

    tokens.forEach((_, index) => {
        if (isValidMove(gameState, playerId, index, steps)) {
            validTokenIndices.push(index);
        }
    });

    return validTokenIndices;
}
