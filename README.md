# Starlink Dashboard

A monitoring dashboard for Starlink Gen 3 (Rev4 Panda), visualizing metrics from the local gRPC API.

## Project Structure

- `backend/`: Node.js backend to query Starlink gRPC and expose data via WebSocket/API.
- `frontend/`: React/Next.js frontend for visualization.

## Setup

1.  **Backend**:
    ```bash
    cd backend
    npm install
    # Configure .env based on env.example
    npm start
    ```

2.  **Frontend**:
    ```bash
    cd frontend
    npm install
    npm run dev
    ```
