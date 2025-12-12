console.log("Starting Server...");
import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { setupSocket } from './socket';

process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
});

const app = express();
console.log("Express initialized");
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: [
            "http://localhost:5173",
            "http://localhost:3000",
            /^https:\/\/.*\.vercel\.app$/
        ],
        methods: ["GET", "POST"],
        credentials: true
    }
});

// Setup Socket.IO handlers
setupSocket(io);

const PORT = Number(process.env.PORT) || 3000;

app.get('/health', (req, res) => {
    res.send('Ludo Server is running');
});

server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
