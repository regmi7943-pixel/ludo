"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupSocket = setupSocket;
const gameManager_1 = require("./gameManager");
const rules_1 = require("./rules");
function setupSocket(io) {
    io.on('connection', (socket) => {
        console.log('User connected:', socket.id);
        socket.on('createGame', ({ name }) => {
            const game = gameManager_1.gameManager.createGame(name, socket.id);
            socket.join(game.code);
            socket.emit('gameCreated', game);
            console.log(`Game created: ${game.code} by ${name}`);
        });
        socket.on('joinGame', ({ code, name }) => {
            const result = gameManager_1.gameManager.joinGame(code, name, socket.id);
            if (result.success && result.game) {
                socket.join(code);
                io.to(code).emit('gameState', result.game);
                socket.emit('joinedGame', result.game); // Ack to sender
            }
            else {
                socket.emit('error', { message: result.message });
            }
        });
        socket.on('startGame', ({ code }) => {
            const game = gameManager_1.gameManager.getGame(code);
            if (game && game.players[0].id === socket.id) {
                game.status = 'in_progress';
                game.waitingForMove = false; // First player needs to roll
                io.to(code).emit('gameState', game);
            }
        });
        socket.on('rollDice', ({ code }) => {
            const game = gameManager_1.gameManager.getGame(code);
            if (!game)
                return;
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
            const roll = (0, rules_1.rollDice)();
            game.diceValue = roll;
            game.lastRollBy = socket.id;
            game.waitingForMove = true;
            // Check if any move is possible
            const canMove = (0, rules_1.canPlayerMove)(game, socket.id, roll);
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
                    }
                    else {
                        console.log('Rolled 6 but cannot move? Staying on same player (corner case if all pieces blocked?)');
                        // Actually if rolled 6 and canMove is false, it means all pieces are strictly blocked (e.g. 6 away from finish is occupied?) 
                        // Or all pieces are finished.
                        // Standard ludo: 6 gives another turn. If you can't move, you usually forfeit the move but might get the roll again? 
                        // Simplified: if you can't move, next player.
                        // But let's stick to "6 gives another turn" rule? 
                        // If I roll 6 and have no moves, do I roll again? 
                        // If I have no valid moves with 6, I probably shouldn't hold the turn indefinitely.
                        // Let's pass turn to be safe and avoid infinite loops for now.
                        game.currentPlayerIndex = (game.currentPlayerIndex + 1) % game.players.length;
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
        socket.on('makeMove', ({ code, tokenIndex }) => {
            const game = gameManager_1.gameManager.getGame(code);
            if (!game)
                return;
            if (game.diceValue === null)
                return;
            const currentPlayer = game.players[game.currentPlayerIndex];
            if (currentPlayer.id !== socket.id)
                return;
            if ((0, rules_1.isValidMove)(game, currentPlayer.id, tokenIndex, game.diceValue)) {
                const newState = (0, rules_1.applyMove)(game, currentPlayer.id, tokenIndex, game.diceValue);
                io.to(code).emit('gameState', newState);
            }
            else {
                socket.emit('error', { message: "Invalid move" });
            }
        });
        socket.on('disconnect', () => {
            console.log('User disconnected:', socket.id);
            // Handle player leaving logic if needed
        });
    });
}
