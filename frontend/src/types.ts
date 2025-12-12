export type PlayerColor = 'red' | 'green' | 'blue' | 'yellow';

export interface Player {
    id: string;
    name: string;
    color: PlayerColor;
    ready: boolean;
}

export interface Token {
    id: number;
    position: number;
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
    lastRollBy: string | null;
    waitingForMove: boolean;
}
