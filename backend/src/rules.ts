export type PlayerColor = 'red' | 'green' | 'blue' | 'yellow';

export interface Player {
    id: string; // Socket ID
    name: string;
    color: PlayerColor;
    ready: boolean;
}

export interface Token {
    id: number; // 0-3
    position: number; // -1 = home, 0-51 = path, 52-57 = home stretch, 99 = finished
    status: 'home' | 'active' | 'safe' | 'finished';
}

export interface GameState {
    code: string;
    players: Player[];
    tokens: Record<PlayerColor, Token[]>;
    currentPlayerIndex: number;
    diceValue: number | null;
    status: 'lobby' | 'in_progress' | 'finished';
    winner: PlayerColor | null;
    lastRollBy: string | null; // Player ID
    waitingForMove: boolean;
}

export const PATH_LENGTH = 52;

export function initializeBoard(): Record<PlayerColor, Token[]> {
    const colors: PlayerColor[] = ['red', 'green', 'blue', 'yellow'];
    const tokens: any = {};
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

export function rollDice(): number {
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
export function isValidMove(
    gameState: GameState,
    playerId: string,
    tokenIndex: number,
    steps: number
): boolean {
    const player = gameState.players.find(p => p.id === playerId);
    if (!player) return false;
    if (gameState.players[gameState.currentPlayerIndex].id !== playerId) return false;

    const tokens = gameState.tokens[player.color];
    const token = tokens[tokenIndex];

    if (token.status === 'finished') return false;

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

export function canPlayerMove(gameState: GameState, playerId: string, diceValue: number): boolean {
    const player = gameState.players.find(p => p.id === playerId);
    if (!player) return false;
    const tokens = gameState.tokens[player.color];
    return tokens.some((_, index) => isValidMove(gameState, playerId, index, diceValue));
}

export function applyMove(
    gameState: GameState,
    playerId: string,
    tokenIndex: number,
    steps: number
): GameState {
    // Clone state to avoid mutation (or mutate if carefully managed, but cloning is safer for sync)
    // For MVP we mutate for speed, assuming single-threaded Node.js event loop logic.
    const player = gameState.players.find(p => p.id === playerId);
    if (!player) return gameState;

    const tokens = gameState.tokens[player.color];
    const token = tokens[tokenIndex];

    // Move out of home
    if (token.position === -1 && steps === 6) {
        token.position = 0;
        token.status = 'active';
    } else if (token.position !== -1) {
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
