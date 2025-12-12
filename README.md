# Multiplayer Ludo (React + Node.js)

A real-time multiplayer Ludo game with server-authoritative logic.

## Features
-   **Create & Join**: Generate invite codes and waiting rooms.
-   **Real-time Gameplay**: Socket.IO syncs dice rolls, moves, and board state.
-   **Game Logic**: Server validates all moves (entering home, finishing, turn order).
-   **UI**: Modern, responsive design with Tailwind CSS.

## Quick Start

### Prerequisites
-   Node.js (v16+)
-   npm

### Local Development

1.  **Clone the repository**
    ```bash
    git clone <repo-url>
    cd ludo-app
    ```

2.  **Setup Backend**
    ```bash
    cd backend
    npm install
    # Start the server (runs on port 3000)
    npx nodemon src/server.ts
    ```

3.  **Setup Frontend**
    ```bash
    cd frontend
    npm install
    # Start the development server
    npm run dev
    ```

4.  **Play**
    -   Open browser at `http://localhost:5173` (or port shown).
    -   Click "Create Game".
    -   Copy the code (e.g., `AB12CD`).
    -   Open a new incognito window or browser.
    -   Join with the code.
    -   Start game!

## Docker Build

To run the entire app containerized:

```bash
docker build -t ludo-app .
docker run -p 3000:3000 ludo-app
```
(Note: You may need to adjust `server.ts` to serve static files from `dist/public` for production mode).

## Deployment

### Vercel (Frontend)
1.  Push `frontend` folder to specialized repo or root.
2.  Set Build Command: `npm run build`.
3.  Set Output Directory: `dist`.
4.  Update `SOCKET_URL` in `GameContext.tsx` to your backend URL.

### Render/Heroku (Backend)
1.  Push `backend` folder.
2.  Build Command: `npm install && npx tsc`.
3.  Start Command: `node dist/server.js`.
