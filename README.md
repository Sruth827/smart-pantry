<h1>Smart Pantry Manager</h1>

Capstone Project | National University

A full-stack web application designed to track household inventory, manage expiration dates, and significantly reduce food waste.

🚀 Onboarding Instructions

Follow these steps to get the development environment running on your local machine in under 5 minutes.

1. Prerequisites

Node.js: v20 or higher (Matches our VPS and CI/CD environment)

Docker: For running the local database (Recommended)

Git: For version control

2. Quick Start (Local Environment)
```
1. Clone the repo
git clone [https://github.com/Sruth827/smart-pantry.git](https://github.com/Sruth827/smart-pantry.git)
cd smart-pantry

# 2. Install dependencies (Locked to Prisma 5.22.0)
npm install

# 3. Start the local database. Note: ensure Docker Desktop is installed on your PC.
docker-compose up -d

# 4. Setup your Environment Variables
# Create a .env file and copy the contents of .env.example as a template
cp .env.example .env

# 5. Initialize the database and seed team accounts
npx prisma db push
npx prisma db seed

# 6. Run the development server
npm run dev

# 7 Run Prisma studio
(Recommend opening a seperate terminal tab for this command so you can keep studio up during development)
npx prisma studio



Your app is now running at http://localhost:3000.
Your studio is running at http://localhost:5555.
```

🛠 Tech Stack

## 🛠 Tech Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Framework** | Next.js 16.1.6 | React framework for frontend and server-side rendering. |
| **Language** | TypeScript | Type-safe JavaScript to prevent runtime errors. |
| **Database** | PostgreSQL 15 | Relational database (Running in Docker locally). |
| **ORM** | Prisma 5.22.0 | Locked version for stability and VPS compatibility. |
| **Hosting** | AWS Lightsail | Ubuntu VPS hosting the production app. |
| **Process Manager** | PM2 | Manages the production Node.js process. |
| **Reverse Proxy** | Caddy | Automatic SSL/HTTPS management via Reverse Proxy. |
| **CI/CD** | GitHub Actions | Automated Safety Checks: Every push is tested before deployment. |

🤝 Contribution Guidelines

1. The "Green Build" Rule

We use a Unified CI/CD Pipeline. When you push to main:

GitHub spins up a fresh database and attempts to build your code.

If it fails: The deployment is blocked. You must fix the errors locally.

If it passes: Your changes are automatically deployed to pantry.s-ruth.dev.

2. Branching & PRs

Work on feature branches: git checkout -b feature/your-feature

Never push broken code. Run npm run build locally before pushing to ensure the GitHub Action will pass.

🖥️ Useful Commands

| Command | Description |
| :--- | :--- |
| ```npx prisma studio``` | View/edit your local database data in a GUI. |
| ```npx prisma db seed``` | Reset your local login if you get locked out. |
| ```docker-compose logs -f db``` | Watch the database logs if you have connection issues. |


