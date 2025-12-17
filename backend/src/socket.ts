import { Server, Socket } from 'socket.io';
import { gameManager } from './gameManager';
import { rollDice, isValidMove, applyMove, canPlayerMove } from './rules';

export function setupSocket(io: Server) {
    io.on('connection', (socket: Socket) => {
        console.log('User connected:', socket.id);

        socket.on('createGame', ({ name }: { name: string }) => {
            const game = gameManager.createGame(name, socket.id);
            socket.join(game.code);
            socket.emit('gameCreated', game);
            console.log(`Game created: ${game.code} by ${name}`);
        });

        socket.on('joinGame', ({ code, name }: { code: string, name: string }) => {
            const result = gameManager.joinGame(code, name, socket.id);
            if (result.success && result.game) {
                socket.join(code);
                io.to(code).emit('gameState', result.game);
                socket.emit('joinedGame', result.game); // Ack to sender
            } else {
                socket.emit('error', { message: result.message });
            }
        });

        socket.on('startGame', ({ code }: { code: string }) => {
            const game = gameManager.getGame(code);
            if (game && game.players[0].id === socket.id) {
                game.status = 'in_progress';
                game.waitingForMove = false; // First player needs to roll
                io.to(code).emit('gameState', game);
            }
        });

        socket.on('rollDice', ({ code }: { code: string }) => {
            const game = gameManager.getGame(code);
            if (!game) return;

            // Verify it's this player's turn
            const currentPlayer = game.players[game.currentPlayerIndex];
            if (currentPlayer.id !== socket.id) {
                socket.emit('error', { message: "Not your turn" });
                return;
            }

            if (game.diceValue !== null) {
                socket.emit('error', { message: "Already rolled" });
                return;
            }

            const roll = rollDice();
            game.diceValue = roll;
            game.lastRollBy = socket.id;
            game.waitingForMove = true;

            // Check if any move is possible
            const canMove = canPlayerMove(game, socket.id, roll);
            console.log(`Player ${socket.id} rolled ${roll}. Can move? ${canMove}`);

            io.to(code).emit('diceRolled', { value: roll, playerId: socket.id });

            if (!canMove) {
                console.log('No moves possible. Auto-switching turn in 1s...');
                game.waitingForMove = false;
                // Auto-switch turn after delay
                setTimeout(() => {
                    // Logic to switch turn
                    if (roll !== 6) {
                        console.log('Switching turn...');
                        game.currentPlayerIndex = (game.currentPlayerIndex + 1) % game.players.length;
                    } else {
                        console.log('Rolled 6 but cannot move. Granting another roll (Standard Ludo Rule).');
                        // Do not switch turn. Player stays same.
                        // They will be able to roll again because diceValue is nullified below.
                    }
                    // Reset turn state
                    game.diceValue = null;
                    game.lastRollBy = null;

                    io.to(code).emit('gameState', game);
                }, 1000);
                // Return early? We need to emit state update NOW with dice value so client shows it.
                // But we don't want client to think it can move.
                // Game state WaitingForMove = true technically, but we know it's fake.
                // Actually if waitingForMove is true, client might enable buttons.
                // Let's set waitingForMove = false immediately if no move possible?
                // But we want to show the dice roll.
                // Let's keep waitingForMove=true but client checks invalid moves?
                // No, simpler: Server controls flow.
                // We emit diceRolled.
                // Then we emit gameState with updated diceValue.
                // Client sees dice.
                // 1s later, we emit gameState with new player.
            }

            io.to(code).emit('gameState', game);
        });

        socket.on('makeMove', ({ code, tokenIndex }: { code: string, tokenIndex: number }) => {
            const game = gameManager.getGame(code);
            if (!game) return;
            if (game.diceValue === null) return;

            const currentPlayer = game.players[game.currentPlayerIndex];
            if (currentPlayer.id !== socket.id) return;

            if (isValidMove(game, currentPlayer.id, tokenIndex, game.diceValue)) {
                const newState = applyMove(game, currentPlayer.id, tokenIndex, game.diceValue);
                io.to(code).emit('gameState', newState);
            } else {
                socket.emit('error', { message: "Invalid move" });
            }
        });

        socket.on('emote', ({ code, emoji }: { code: string, emoji: string }) => {
            // Broadcast emote to room
            io.to(code).emit('emote', { emoji, playerId: socket.id });
        });

        socket.on('disconnect', () => {
            console.log('User disconnected:', socket.id);
            // Handle player leaving logic if needed
        });
    });
}
