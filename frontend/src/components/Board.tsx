import React, { useMemo, useEffect, useRef } from 'react';
import { useGame } from '../context/GameContext';
import { motion, AnimatePresence } from 'framer-motion';
import type { PlayerColor, Token } from '../types';
import { clsx } from 'clsx';
import { useSounds } from '../hooks/useSounds';

// --- COORDINATE CONSTANTS ---
// 15x15 Grid. 1-based indexing for CSS Grid.
// Standard Ludo Path: 52 steps global loop.
const GLOBAL_PATH = [
    [7, 2], [7, 3], [7, 4], [7, 5], [7, 6], [6, 7], // 0-5
    [5, 7], [4, 7], [3, 7], [2, 7], [1, 7], [1, 8], // 6-11 (Corner Top Left to Top Middle)
    [1, 9], [2, 9], [3, 9], [4, 9], [5, 9], [6, 9], // 12-17 (Top Middle to Corner Top Right)
    [7, 10], [7, 11], [7, 12], [7, 13], [7, 14], [7, 15], // 18-23
    [8, 15], // 24 (Right Middle)
    [9, 15], [9, 14], [9, 13], [9, 12], [9, 11], [9, 10], // 25-30
    [10, 9], [11, 9], [12, 9], [13, 9], [14, 9], [15, 9], // 31-36
    [15, 8], // 37 (Bottom Middle)
    [15, 7], [14, 7], [13, 7], [12, 7], [11, 7], [10, 7], // 38-43
    [9, 6], [9, 5], [9, 4], [9, 3], [9, 2], [9, 1], // 44-49
    [8, 1], // 50 (Left Middle)
    [7, 1] // 51 (Just before Red Start)
];

const HOME_PATHS: Record<PlayerColor, number[][]> = {
    red: [[8, 2], [8, 3], [8, 4], [8, 5], [8, 6], [8, 7]],
    green: [[2, 8], [3, 8], [4, 8], [5, 8], [6, 8], [7, 8]],
    yellow: [[8, 14], [8, 13], [8, 12], [8, 11], [8, 10], [8, 9]],
    blue: [[14, 8], [13, 8], [12, 8], [11, 8], [10, 8], [9, 8]]
};

const START_OFFSETS: Record<PlayerColor, number> = {
    red: 0,
    green: 13,
    yellow: 26,
    blue: 39
};

const BASE_POSITIONS: Record<PlayerColor, number[][]> = {
    red: [[2, 2], [2, 5], [5, 2], [5, 5]],
    green: [[2, 11], [2, 14], [5, 11], [5, 14]],
    yellow: [[11, 14], [11, 11], [14, 14], [14, 11]],
    blue: [[11, 2], [11, 5], [14, 2], [14, 5]]
};

const SAFE_SPOTS = [
    [7, 2], [2, 9], [9, 14], [14, 7], // Starts
    [7, 14], [2, 7], [9, 2], [14, 9] // Assuming Star spots? Standard often has 8 safe spots? 
    // Usually only the start squares are universally safe + standard star spots. 
    // Let's stick to start squares + maybe others. For MVP visual, we'll mark starts.
];

// Memoized static grid to prevent re-renders
const StaticGrid = React.memo(() => (
    <>
        {[...Array(225)].map((_, i) => (
            <div key={`cell-${i}`} className="border border-slate-300 w-full h-full" />
        ))}
    </>
));
StaticGrid.displayName = 'StaticGrid';

export const Board: React.FC = () => {
    const { gameState, rollDice, makeMove, userId, startGame } = useGame();
    const sounds = useSounds();

    // Track previous token state for capture detection
    const prevTokensRef = useRef<Record<PlayerColor, Token[]> | null>(null);

    // Memoize player lookup
    const myPlayer = useMemo(() =>
        gameState?.players.find(p => p.id === userId),
        [gameState, userId]
    );

    // Detect captures and play sound
    useEffect(() => {
        if (!gameState || !prevTokensRef.current) {
            prevTokensRef.current = gameState?.tokens || null;
            return;
        }

        const prevTokens = prevTokensRef.current;
        const colors: PlayerColor[] = ['red', 'green', 'blue', 'yellow'];

        // Check if any token went from active (position >= 0) to home (position = -1)
        for (const color of colors) {
            const prev = prevTokens[color];
            const curr = gameState.tokens[color];

            for (let i = 0; i < 4; i++) {
                if (prev[i].position >= 0 && curr[i].position === -1) {
                    // Token was captured!
                    sounds.playCapture();
                    break;
                }
                // Check for token finishing
                if (prev[i].position !== 57 && curr[i].position === 57) {
                    sounds.playWin();
                }
            }
        }

        prevTokensRef.current = gameState.tokens;
    }, [gameState, sounds]);

    // Copy Logic
    const [copied, setCopied] = React.useState(false);
    const handleCopy = () => {
        if (!gameState) return;
        navigator.clipboard.writeText(gameState.code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const isMyTurn = useMemo(() => {
        if (!gameState) return false;
        return gameState.players[gameState.currentPlayerIndex]?.id === userId;
    }, [gameState, userId]);

    // Sound-wrapped actions
    const handleRollDice = () => {
        sounds.playDiceRoll();
        rollDice(gameState!.code);
    };

    const handleMakeMove = (tokenIndex: number) => {
        sounds.playMove();
        makeMove(gameState!.code, tokenIndex);
    };

    if (!gameState) return null;

    // Helper: Map state position to grid coordinates
    const getTokenStyle = (color: PlayerColor, position: number, tokenId: number) => {
        let r, c;
        if (position === -1) {
            // Home Base
            [r, c] = BASE_POSITIONS[color][tokenId];
        } else if (position >= 52) {
            // Home Stretch
            const idx = position - 52;
            if (idx < 6) {
                [r, c] = HOME_PATHS[color][idx];
            } else {
                [r, c] = [8, 8]; // Winner Center
            }
        } else {
            // Main Path
            // Calculate Global Index
            const globalIdx = (position + START_OFFSETS[color]) % 52;
            [r, c] = GLOBAL_PATH[globalIdx];
        }

        // Add small offset for overlapping tokens?
        // For MVP, we'll just stack them.
        return {
            gridRow: r,
            gridColumn: c,
        };
    };

    const isHost = gameState.players[0].id === userId;

    return (
        <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 relative">
            {/* LOBBY OVERLAY */}
            {gameState.status === 'lobby' && (
                <div className="absolute inset-0 bg-slate-900/90 z-50 flex items-center justify-center backdrop-blur-sm">
                    <div className="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-lg text-center animate-in fade-in zoom-in duration-300">
                        <h2 className="text-3xl font-black mb-2 text-slate-800">GAME LOBBY</h2>
                        <p className="text-slate-500 mb-6">Share this code to invite friends</p>

                        <div className="flex items-center justify-center gap-4 mb-8">
                            <div className="text-5xl font-mono font-black tracking-widest bg-slate-100 px-6 py-4 rounded-xl border-2 border-slate-200 select-all text-slate-800">
                                {gameState.code}
                            </div>
                            <button
                                onClick={handleCopy}
                                className="p-4 bg-slate-100 hover:bg-slate-200 rounded-xl border-2 border-slate-200 transition-colors relative group"
                                title="Copy Code"
                            >
                                {copied ? (
                                    <span className="text-green-600 font-bold text-xl">✓</span>
                                ) : (
                                    <span className="text-2xl">📋</span>
                                )}
                                {copied && (
                                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs py-1 px-2 rounded shadow-lg whitespace-nowrap">
                                        Copied!
                                    </div>
                                )}
                            </button>
                        </div>

                        <div className="space-y-3 mb-8">
                            {gameState.players.map((p) => (
                                <div key={p.id} className={clsx(
                                    "p-4 rounded-xl border-2 flex items-center justify-between transition-all",
                                    p.color === 'red' && "bg-red-50 border-red-200 text-red-700",
                                    p.color === 'green' && "bg-green-50 border-green-200 text-green-700",
                                    p.color === 'yellow' && "bg-yellow-50 border-yellow-200 text-yellow-700",
                                    p.color === 'blue' && "bg-blue-50 border-blue-200 text-blue-700"
                                )}>
                                    <div className="flex items-center gap-3">
                                        <div className={clsx(
                                            "w-3 h-3 rounded-full",
                                            p.color === 'red' && "bg-red-500",
                                            p.color === 'green' && "bg-green-500",
                                            p.color === 'yellow' && "bg-yellow-500",
                                            p.color === 'blue' && "bg-blue-500"
                                        )} />
                                        <span className="font-bold text-lg">{p.name}</span>
                                    </div>
                                    {p.id === gameState.players[0].id && <span className="text-xs bg-slate-900 text-white px-2 py-1 rounded font-bold">HOST</span>}
                                </div>
                            ))}
                            {/* Empty Slots */}
                            {[...Array(4 - gameState.players.length)].map((_, i) => (
                                <div key={`empty-${i}`} className="p-4 rounded-xl border-2 border-dashed border-slate-200 flex items-center justify-center text-slate-400 font-medium">
                                    Waiting for player...
                                </div>
                            ))}
                        </div>

                        {isHost ? (
                            <button
                                onClick={() => startGame(gameState.code)}
                                style={{ backgroundColor: '#3b82f6' }}
                                className="w-full py-4 text-xl font-bold text-white rounded-xl hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-200"
                                disabled={gameState.players.length < 2}
                            >
                                START GAME {gameState.players.length < 2 && "(Need 2+)"}
                            </button>
                        ) : (
                            <div className="text-slate-400 font-bold animate-pulse">Waiting for host to start...</div>
                        )}
                    </div>
                </div>
            )}

            {/* Header / HUD */}
            <div className="w-full max-w-2xl mb-6 flex justify-between items-center bg-slate-800 p-4 rounded-2xl border border-slate-700 shadow-xl">
                <div className="flex -space-x-3">
                    {gameState.players.map(p => (
                        <div key={p.id} className={clsx(
                            "w-10 h-10 rounded-full border-2 flex items-center justify-center text-xs font-bold text-white shadow-lg",
                            p.color === 'red' && "bg-red-500 border-red-300",
                            p.color === 'green' && "bg-green-500 border-green-300",
                            p.color === 'yellow' && "bg-yellow-500 border-yellow-300",
                            p.color === 'blue' && "bg-blue-500 border-blue-300",
                            gameState.players[gameState.currentPlayerIndex].id === p.id && "ring-4 ring-white z-10 scale-110"
                        )}>
                            {p.name[0]}
                        </div>
                    ))}
                </div>

                <div className="text-white font-mono font-bold text-lg">
                    {gameState.players[gameState.currentPlayerIndex].name}'s Turn
                </div>

                {gameState.diceValue && (
                    <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center text-2xl font-black shadow-inner">
                        {gameState.diceValue}
                    </div>
                )}
            </div>

            {/* THE BOARD */}
            <div className="bg-white p-1 rounded-lg shadow-2xl relative">
                <div className="grid w-[min(90vw,600px)] aspect-square bg-slate-100 border-4 border-slate-800 relative" style={{ gridTemplateColumns: 'repeat(15, 1fr)', gridTemplateRows: 'repeat(15, 1fr)' }}>

                    {/* BACKGROUND GRID CELLS (Memoized) */}
                    <StaticGrid />

                    {/* BASES */}
                    <div className="col-start-1 col-end-7 row-start-1 row-end-7 bg-red-100 border-2 border-slate-800 p-4 relative">
                        <div className="w-full h-full bg-red-500 rounded-2xl shadow-inner flex items-center justify-center border-4 border-red-200">
                            <span className="opacity-25 text-6xl">🏠</span>
                        </div>
                    </div>
                    <div className="col-start-10 col-end-16 row-start-1 row-end-7 bg-green-100 border-2 border-slate-800 p-4 relative">
                        <div className="w-full h-full bg-green-500 rounded-2xl shadow-inner flex items-center justify-center border-4 border-green-200">
                            <span className="opacity-25 text-6xl">🏠</span>
                        </div>
                    </div>
                    <div className="col-start-1 col-end-7 row-start-10 row-end-16 bg-blue-100 border-2 border-slate-800 p-4 relative">
                        <div className="w-full h-full bg-blue-500 rounded-2xl shadow-inner flex items-center justify-center border-4 border-blue-200">
                            <span className="opacity-25 text-6xl">🏠</span>
                        </div>
                    </div>
                    <div className="col-start-10 col-end-16 row-start-10 row-end-16 bg-yellow-100 border-2 border-slate-800 p-4 relative">
                        <div className="w-full h-full bg-yellow-500 rounded-2xl shadow-inner flex items-center justify-center border-4 border-yellow-200">
                            <span className="opacity-25 text-6xl">🏠</span>
                        </div>
                    </div>

                    {/* CENTER TRIANGLE */}
                    <div className="col-start-7 col-end-10 row-start-7 row-end-10 bg-slate-800 relative overflow-hidden">
                        <div className="absolute inset-0 bg-red-500" style={{ clipPath: 'polygon(0 0, 0 100%, 50% 50%)' }} />
                        <div className="absolute inset-0 bg-green-500" style={{ clipPath: 'polygon(0 0, 100% 0, 50% 50%)' }} />
                        <div className="absolute inset-0 bg-yellow-500" style={{ clipPath: 'polygon(100% 0, 100% 100%, 50% 50%)' }} />
                        <div className="absolute inset-0 bg-blue-500" style={{ clipPath: 'polygon(0 100%, 100% 100%, 50% 50%)' }} />
                    </div>

                    {/* PATH CELLS - Drawn as borders */}
                    {/* We can programmatically render cells for visual debugging or just trust the absolute tokens */}
                    {/* Let's render the grid lines transparently or using borders */}
                    {/* For visual "Tracks", we need colored cells */}

                    {/* Red Home Path */}
                    {[2, 3, 4, 5, 6, 7].map(c => <div key={`rh-${c}`} style={{ gridRow: 8, gridColumn: c }} className="bg-red-200 border border-slate-300/50" />)}
                    {/* Green Home Path */}
                    {[2, 3, 4, 5, 6, 7].map(r => <div key={`gh-${r}`} style={{ gridRow: r, gridColumn: 8 }} className="bg-green-200 border border-slate-300/50" />)}
                    {/* Yellow Home Path */}
                    {[9, 10, 11, 12, 13, 14].map(c => <div key={`yh-${c}`} style={{ gridRow: 8, gridColumn: c }} className="bg-yellow-200 border border-slate-300/50" />)}
                    {/* Blue Home Path */}
                    {[9, 10, 11, 12, 13, 14].map(r => <div key={`bh-${r}`} style={{ gridRow: r, gridColumn: 8 }} className="bg-blue-200 border border-slate-300/50" />)}

                    {/* Start Spots */}
                    <div style={{ gridRow: 7, gridColumn: 2 }} className="bg-red-400 border border-slate-800" />
                    <div style={{ gridRow: 2, gridColumn: 9 }} className="bg-green-400 border border-slate-800" />
                    <div style={{ gridRow: 9, gridColumn: 14 }} className="bg-yellow-400 border border-slate-800" />
                    <div style={{ gridRow: 14, gridColumn: 7 }} className="bg-blue-400 border border-slate-800" />

                    {/* Safe Spots */}
                    {SAFE_SPOTS.map((s, i) => (
                        <div key={`safe-${i}`} style={{ gridRow: s[0], gridColumn: s[1] }} className="flex items-center justify-center opacity-50 z-10 pointer-events-none">
                            ⭐
                        </div>
                    ))}

                    {/* TOKENS - Absolute/Grid positioned */}
                    <AnimatePresence>
                        {Object.entries(gameState.tokens).map(([color, tokens]) => (
                            tokens.map((t) => {
                                const style = getTokenStyle(color as PlayerColor, t.position, t.id);
                                const isClickable = isMyTurn && myPlayer?.color === color && gameState.waitingForMove && gameState.diceValue !== null;

                                return (
                                    <motion.button
                                        key={`${color}-${t.id}`}
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        exit={{ scale: 0 }}
                                        transition={{ type: "spring", stiffness: 300, damping: 25 }}
                                        style={style}
                                        className={clsx(
                                            "w-[80%] h-[80%] m-auto rounded-full shadow-md border-2 border-white z-20 relative",
                                            color === 'red' && "bg-red-600",
                                            color === 'green' && "bg-green-600",
                                            color === 'yellow' && "bg-yellow-600",
                                            color === 'blue' && "bg-blue-600",
                                            isClickable ? "cursor-pointer hover:scale-125 ring-2 ring-white animate-bounce" : "cursor-default"
                                        )}
                                        onClick={() => isClickable && handleMakeMove(t.id)}
                                    >
                                        <div className="absolute inset-0 rounded-full bg-white opacity-20 transform scale-50 -translate-y-1/4" />
                                    </motion.button>
                                )
                            })
                        ))}
                    </AnimatePresence>
                </div>
            </div>

            {/* CONTROLS */}
            <div className="mt-8">
                {gameState.status === 'in_progress' && (
                    <>
                        {isMyTurn && !gameState.waitingForMove && (
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={handleRollDice}
                                className="px-8 py-4 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-xl text-white font-black text-xl shadow-lg border-b-4 border-blue-800 active:border-b-0 active:translate-y-1"
                            >
                                ROLL DICE 🎲
                            </motion.button>
                        )}
                        {!isMyTurn && (
                            <div className="text-slate-500 font-medium animate-pulse">
                                Waiting for opponent...
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};
