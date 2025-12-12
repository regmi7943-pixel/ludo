import React, { useState } from 'react';
import { useGame } from '../context/GameContext';

export const Lobby: React.FC = () => {
    const { createGame, joinGame, isConnected, error } = useGame();
    const [name, setName] = useState('');
    const [joinCode, setJoinCode] = useState('');
    const [mode, setMode] = useState<'menu' | 'join' | 'create'>('menu');

    if (!isConnected) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-ludo-board">
                <div className="text-xl font-bold animate-pulse text-ludo-blue">Connecting to server...</div>
            </div>
        );
    }

    const handleCreate = () => {
        if (!name) return alert("Please enter your name");
        createGame(name);
    };

    const handleJoin = () => {
        if (!name) return alert("Please enter your name");
        if (!joinCode) return alert("Please enter game code");
        joinGame(joinCode.toUpperCase(), name);
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-slate-100 p-4">
            <h1 className="text-6xl font-black mb-12 text-slate-800 tracking-tighter">
                LUDO <span className="text-red-500">M</span><span className="text-green-500">U</span><span className="text-yellow-500">L</span><span className="text-blue-500">T</span><span className="text-red-500">I</span>
            </h1>

            <div className="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-md border border-slate-200">
                {error && (
                    <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm font-medium">
                        {error}
                    </div>
                )}

                {mode === 'menu' && (
                    <div className="space-y-4">
                        <input
                            type="text"
                            placeholder="Enter your name"
                            className="w-full px-4 py-3 text-lg border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-0 outline-none transition-all"
                            value={name}
                            onChange={e => setName(e.target.value)}
                        />
                        <button
                            onClick={() => setMode('create')}
                            disabled={!name}
                            style={{ backgroundColor: '#3b82f6' }}
                            className="w-full py-4 text-xl font-bold text-white bg-blue-500 rounded-xl hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-200"
                        >
                            Create Game
                        </button>
                        <button
                            onClick={() => setMode('join')}
                            disabled={!name}
                            className="w-full py-4 text-xl font-bold text-slate-700 bg-slate-200 rounded-xl hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                            Join Game
                        </button>
                    </div>
                )}

                {mode === 'join' && (
                    <div className="space-y-4">
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-slate-500 mb-1">Enter Invite Code</label>
                            <input
                                type="text"
                                placeholder="e.g. AB12CD"
                                className="w-full px-4 py-3 text-2xl font-mono text-center border-2 border-slate-200 rounded-xl focus:border-green-500 focus:ring-0 outline-none uppercase tracking-widest"
                                value={joinCode}
                                onChange={e => setJoinCode(e.target.value)}
                                maxLength={6}
                            />
                        </div>
                        <button
                            onClick={handleJoin}
                            style={{ backgroundColor: '#22c55e' }}
                            className="w-full py-4 text-xl font-bold text-white bg-green-500 rounded-xl hover:bg-green-600 transition-all shadow-lg shadow-green-200"
                        >
                            Join Lobby
                        </button>
                        <button
                            onClick={() => setMode('menu')}
                            className="w-full py-2 text-sm font-bold text-slate-400 hover:text-slate-600"
                        >
                            Back
                        </button>
                    </div>
                )}

                {mode === 'create' && (
                    <div className="space-y-4 text-center">
                        <div className="text-lg text-slate-600 mb-4">
                            Hi <span className="font-bold text-slate-900">{name}</span>, creating a game for you...
                        </div>
                        <button
                            onClick={handleCreate}
                            style={{ backgroundColor: '#ef4444' }}
                            className="w-full py-4 text-xl font-bold text-white bg-red-500 rounded-xl hover:bg-red-600 transition-all shadow-lg shadow-red-200"
                        >
                            Start Hosting
                        </button>
                        <button
                            onClick={() => setMode('menu')}
                            className="w-full py-2 text-sm font-bold text-slate-400 hover:text-slate-600"
                        >
                            Back
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
