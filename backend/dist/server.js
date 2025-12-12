"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const socket_io_1 = require("socket.io");
const cors_1 = __importDefault(require("cors"));
const socket_1 = require("./socket");
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
const server = http_1.default.createServer(app);
const io = new socket_io_1.Server(server, {
    cors: {
        origin: "*", // Allow all for now, lock down later
        methods: ["GET", "POST"]
    }
});
// Setup Socket.IO handlers
(0, socket_1.setupSocket)(io);
const PORT = 3000;
app.get('/health', (req, res) => {
    res.send('Ludo Server is running');
});
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
