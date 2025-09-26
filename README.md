# Wingman - React + TypeScript + Vite + Convex

A modern web application built with React, TypeScript, Vite, and Convex, deployable to GitHub Pages.

## Features

- **React 19** with TypeScript for type-safe UI development
- **Vite** for fast development and optimized builds
- **Convex** for real-time backend functionality
- **GitHub Pages** deployment with automated CI/CD
- **ESLint** for code quality

## Getting Started

### Prerequisites
- Node.js 20.19+ or 22.12+
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/wingman.git
cd wingman
```

2. Install dependencies:
```bash
npm install
```

3. Set up Convex:
```bash
npx convex dev
```

4. Start the development server:
```bash
npm run dev
```

## Deployment to GitHub Pages

### Automatic Deployment
The project includes a GitHub Actions workflow that automatically deploys to GitHub Pages on every push to the main branch.

#### Setup:
1. Go to your repository settings
2. Navigate to Pages → Source → GitHub Actions
3. Add your Convex URL as a repository secret:
   - Go to Settings → Secrets and variables → Actions
   - Add `VITE_CONVEX_URL` with your Convex deployment URL

### Manual Deployment
You can also deploy manually:
```bash
npm run deploy
```

## Project Structure

```
wingman/
├── src/                 # React application source
├── convex/              # Convex backend functions
├── public/              # Static assets
├── dist/                # Build output (generated)
├── .github/workflows/   # GitHub Actions
└── ...
```

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
