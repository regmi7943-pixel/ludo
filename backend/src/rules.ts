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

// Safe spots where tokens cannot be captured (relative positions)
// Includes: Start squares (position 0 for each color) and star squares
const SAFE_SPOTS = [0, 8, 13, 21, 26, 34, 39, 47];

// Start offsets for each color (where they enter the main path in absolute terms)
const START_OFFSETS: Record<PlayerColor, number> = {
    red: 0,
    green: 13,
    yellow: 26,
    blue: 39
};

// Convert player's relative position to absolute board position (0-51)
function toAbsolutePosition(color: PlayerColor, relativePos: number): number {
    if (relativePos < 0 || relativePos >= 52) return -1; // Home or home stretch
    return (relativePos + START_OFFSETS[color]) % 52;
}

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
 * Rules:
 * - Must roll 6 to exit home.
 * - Cannot overshoot finish (exact roll required for position 57).
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

    const newPosition = token.position + steps;

    // Rule: Cannot overshoot finish (must land exactly on 57)
    if (newPosition > 57) return false;

    return true;
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

    // Check if player won (all 4 tokens finished)
    if (tokens.every(t => t.status === 'finished')) {
        gameState.winner = player.color;
        gameState.status = 'finished';
        gameState.waitingForMove = false;
        gameState.diceValue = null;
        return gameState;
    }

    // CAPTURE LOGIC: Check if landing on opponent's token
    // Only applies when on main path (position 0-51), not in home stretch (52-56) or finish (57)
    if (token.position >= 0 && token.position < 52) {
        const absolutePos = toAbsolutePosition(player.color, token.position);
        const isSafeSpot = SAFE_SPOTS.includes(token.position);

        if (!isSafeSpot) {
            // Check all other players' tokens
            const colors: PlayerColor[] = ['red', 'green', 'blue', 'yellow'];
            for (const otherColor of colors) {
                if (otherColor === player.color) continue;

                const otherTokens = gameState.tokens[otherColor];
                for (const otherToken of otherTokens) {
                    // Only check tokens on main path
                    if (otherToken.position >= 0 && otherToken.position < 52) {
                        const otherAbsolutePos = toAbsolutePosition(otherColor, otherToken.position);
                        if (otherAbsolutePos === absolutePos) {
                            // CAPTURE! Send opponent token back to home
                            console.log(`CAPTURE! ${player.color} captured ${otherColor}'s token at position ${absolutePos}`);
                            otherToken.position = -1;
                            otherToken.status = 'home';
                        }
                    }
                }
            }
        }
    }

    // Check turn change
    // Rule: rolling 6 gives another turn.
    if (steps !== 6) {
        gameState.currentPlayerIndex = (gameState.currentPlayerIndex + 1) % gameState.players.length;
    }

    gameState.waitingForMove = false;
    gameState.diceValue = null;

    return gameState;
}

