import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { setupSocket } from './socket';

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*", // Allow all for now, lock down later
        methods: ["GET", "POST"]
    }
});

// Setup Socket.IO handlers
setupSocket(io);

const PORT = 3000;

app.get('/health', (req, res) => {
    res.send('Ludo Server is running');
});

server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
