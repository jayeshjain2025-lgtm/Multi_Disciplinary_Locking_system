# Multi Disciplinary Locking System

A React + Vite web application for managing a multi-phase locking/security control center.

## Tech Stack

- React 19
- TypeScript
- Vite
- Gemini API (`@google/genai`)

## Prerequisites

Make sure you have the following installed:

- **Git**
- **Node.js 20+**
- **npm** (comes with Node.js)
- A valid **Gemini API key**

Quick checks:

```bash
git --version
node -v
npm -v
```

## Run Locally

1. **Clone the repository**

   ```bash
   git clone <your-repository-url>
   cd Multi_Disciplinary_Locking_system
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Create environment file**

   In the project root, create `.env.local`:

   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

4. **Start the development server**

   ```bash
   npm run dev
   ```

5. **Open the app**

   Open the local URL shown in your terminal (typically `http://localhost:5173`).

## Build and Preview (Optional)

Build production assets:

```bash
npm run build
```

Preview production build locally:

```bash
npm run preview
```

## Git Workflow: Branch, Commit, Push

1. **Create and switch to a new branch**

   ```bash
   git checkout -b feature/<short-description>
   ```

2. **Make your changes and stage them**

   ```bash
   git add .
   ```

3. **Commit**

   ```bash
   git commit -m "docs: short description of your change"
   ```

4. **Push branch to remote**

   ```bash
   git push -u origin feature/<short-description>
   ```

## Create a Pull Request

After pushing your branch:

1. Open the repository on GitHub.
2. Click **Compare & pull request** for your branch.
3. Confirm:
   - **Base branch** = `main` (or your team default)
   - **Compare branch** = your feature branch
4. Add a clear PR title and description including:
   - What changed
   - Why it changed
   - How it was tested

### Recommended PR Description Template

```md
## Summary
- Added/updated ...

## Why
- ...

## Testing
- [ ] npm run build
- [ ] Manual validation
```
