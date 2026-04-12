# KindHeart - Crowdfunding Platform

KindHeart is a community-driven crowdfunding platform designed to empower us to raise funds for medical bills, education, and community projects.

## Project Structure

This project is separated into a **Client** (Frontend) and a **Server** (Backend) to ensure clean architecture and scalability.

```
kindheart/
├── client/              # Vanilla HTML/JS/CSS Frontend
│   ├── assets/          # Static assets
│   │   ├── css/         # Styling (prefix naming)
│   │   ├── js/          # Client-side logic
│   │   └── images/      # Project images
│   └── index.html       # Main Entry Point
│
├── server/              # Express + Prisma + Neon DB (ESM)
│   ├── src/
│   │   ├── app.js       # Express config (ESM)
│   │   └── controllers/ # Route handlers
│   ├── server.js        # Entry point (ESM)
│   ├── package.json     # Backend dependencies ("type": "module")
│   └── prisma/          # Database schema (Planned)
│
└── .env.example         # Environment variables template
```

## Getting Started

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (Latest LTS recommended)
- [VS Code Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) (for Frontend)

### 2. Backend Setup (Server)

> [!IMPORTANT]
> All `npm` commands (install, run dev, etc.) **must** be run from inside the `server/` folder.

1. Open a terminal and navigate to our server folder:
   ```bash
   cd server
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file based on `.env.example` and fill in our details.
4. Start the server (Development mode):
   ```bash
   npm run dev
   ```
   The backend will run on `http://localhost:3000`.

### 3. Frontend Setup (Client)
1. Open `client/index.html` in VS Code.
2. Right-click and select **"Open with Live Server"**.
   The frontend will typically run on `http://localhost:5500`.

## 🛠 Tech Stack
- **Frontend**: Vanilla HTML5, CSS3, JavaScript (ES Modules planned)
- **Backend**: Node.js, Express.js
- **Database**: Prisma ORM with Neon (PostgreSQL)
- **Validation**: Zod (Schema validation)
- **Security**: JWT, Helmet, bcryptjs, Express Rate Limit
- **Media**: Cloudinary
