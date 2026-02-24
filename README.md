# Smart Pantry Manager
## Capstone Project at National University

A full-stack web application designed to track household inventory, manage expiration dates, and reduce food waste.

---

## Onboarding Instructions
Follow these steps to get the development environment running on your local machine.

### 1. Prereqs
- Node.js (v18 or higher)
- Git
- Public IP Whitelisted on Server: Please send your IP address to Sean for database access during development.  (Use [icanhazip.com](https://icanhazip.com))

### 2. Installation 
```bash 
# clone the repo
   git clone https://github.com/Sruth827/smart-pantry.git
   cd smart-pantry

# install dependencies 
npm install

# local environment config
 - create .env in your root directory
 - copy .env.example as a template
 - update DATABASE_URL with password and IP provided in group chat

# initialize prisma
npx prisma generate

# Verify database connection
npx prisma db pull

# run it on http://localhost:3000
npm run dev
```

## 🛠 Tech Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Framework** | [Next.js 15+](https://nextjs.org/) | React framework for frontend and server-side rendering. |
| **Language** | [TypeScript](https://www.typescriptlang.org/) | Type-safe JavaScript to prevent runtime errors. |
| **Database** | [PostgreSQL](https://www.postgresql.org/) | Relational database for structured pantry data. |
| **ORM** | [Prisma 7](https://www.prisma.io/) | Object-Relational Mapper to sync code with the database. |
| **Hosting** | [AWS Lightsail](https://aws.amazon.com/lightsail/) | VPS (Ubuntu) for hosting the app and database containers. |
| **Process Manager** | [PM2](https://pm2.keymetrics.io/) | Keeps the Node.js application running 24/7 on the server. |
| **Web Server** | [Caddy](https://caddyserver.com/) | Reverse proxy with automatic SSL (HTTPS) encryption. |
| **CI/CD** | [GitHub Actions](https://github.com/features/actions) | Automated deployment pipeline on every push to `main`. |

## Contribution Guidelines

To maintain code quality and ensure the live site remains stable, all team members must follow this workflow:

### 1. The Branching Strategy
Never work directly on the `main` branch. Always create a descriptive feature branch:
* `git checkout -b feature/login-page`
* `git checkout -b bugfix/fix-pantry-icon`

### 2. Commit Standards
Write clear, concise commit messages that describe **what** was changed:
* Good: `feat: added quantity increment buttons to pantry list`
* Bad: `updated stuff`

### 3. Pull Requests (PRs)
1. Push your branch to GitHub: `git push origin feature/your-feature-name`.
2. Open a **Pull Request** targeting the `main` branch.
3. Describe your changes and link any relevant GitHub Issues.
4. **Required:** At least one peer review/approval is required before merging.

### 4. Database Changes
If you need to change the database structure (the schema):
1. Discuss the change with the Lead Developer (Sean).
2. Update the `prisma/schema.prisma` file.
3. Use `npx prisma db push` to test locally.

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### 🖥️ Useful Commands
- `npx prisma studio`: Opens a local browser window to view/edit the database data visually.
- `npm run build`: Tests the production build locally (do this before pushing!).

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.


