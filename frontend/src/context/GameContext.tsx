import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import type { GameState } from '../types';

interface GameContextType {
    socket: Socket | null;
    gameState: GameState | null;
    isConnected: boolean;
    createGame: (name: string) => void;
    joinGame: (code: string, name: string) => void;
    startGame: (code: string) => void;
    rollDice: (code: string) => void;
    makeMove: (code: string, tokenIndex: number) => void;
    userId: string | null;
    error: string | null;
}

const GameContext = createContext<GameContextType>({} as GameContextType);

// Change this if your backend runs on a different port/host
const SOCKET_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [gameState, setGameState] = useState<GameState | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [error, setError] = useState<string | null>(null);
    // const [userId, setUserId] = useState<string | null>(null);

    useEffect(() => {
        const newSocket = io(SOCKET_URL);
        setSocket(newSocket);

        newSocket.on('connect', () => {
            console.log('Connected to socket server');
            setIsConnected(true);
            // setUserId(newSocket.id || null);
        });

        newSocket.on('disconnect', () => {
            console.log('Disconnected');
            setIsConnected(false);
        });

        newSocket.on('gameState', (state: GameState) => {
            setGameState(state);
            setError(null);
        });

        newSocket.on('gameCreated', (state: GameState) => {
            setGameState(state);
        });

        newSocket.on('diceRolled', (data: { value: number, playerId: string }) => {
            // Can handle dice animation trigger here if needed
            console.log("Dice rolled:", data);
        });

        newSocket.on('error', (err: { message: string }) => {
            setError(err.message);
            setTimeout(() => setError(null), 3000);
        });

        return () => {
            newSocket.disconnect();
        };
    }, []);

    const createGame = (name: string) => {
        socket?.emit('createGame', { name });
    };

    const joinGame = (code: string, name: string) => {
        socket?.emit('joinGame', { code, name });
    };

    const startGame = (code: string) => {
        socket?.emit('startGame', { code });
    }

    const rollDice = (code: string) => {
        socket?.emit('rollDice', { code });
    }

    const makeMove = (code: string, tokenIndex: number) => {
        socket?.emit('makeMove', { code, tokenIndex });
    }

    return (
        <GameContext.Provider value={{
            socket,
            gameState,
            isConnected,
            createGame,
            joinGame,
            startGame,
            rollDice,
            makeMove,
            userId: socket?.id || null,
            error
        }}>
            {children}
        </GameContext.Provider>
    );
};

export const useGame = () => useContext(GameContext);
