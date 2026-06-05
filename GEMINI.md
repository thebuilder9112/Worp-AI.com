# Worp AI - Project Instructions

This project is a sophisticated AI-powered application built with React, TypeScript, and Firebase, featuring advanced terminal effects and Gemini integration.

## ?? Tech Stack
- **Framework:** React 19 (Vite)
- **Styling:** Tailwind CSS v4
- **Language:** TypeScript
- **Backend/DB:** Firebase (Auth, Firestore)
- **AI Integration:** Google Generative AI (Gemini)
- **Components:** Shadcn UI + Framer Motion (Motion)

## ?? Architecture & Patterns
- **Directory Structure:**
  - src/components: UI components, organized by feature or ui/ for base components.
  - src/lib: Core utility libraries, context providers, and service initializers (Firebase, Gemini).
  - src/hooks: Custom React hooks for shared logic.
  - public/: Static assets.
- **State Management:** Prioritize React Context for global state (e.g., Theme, Auth) and local state for component-specific logic.
- **Styling Conventions:** 
  - Use Tailwind CSS v4 utility classes.
  - Adhere to the defined color palette and dark mode flicker stabilization protocols.
  - Use clsx and 	ailwind-merge for conditional class application.

## ?? Development Workflow
- **Linting:** Use 
pm run lint (runs 	sc --noEmit).
- **Builds:** 
pm run build targets the dist/ directory.
- **Git:** All changes must be committed with descriptive messages. Use the main branch for production-ready code.

## ?? Security & Env
- Never commit .env files.
- Use the .env.example as a template for local environment variables.
- Required variables: VITE_GEMINI_API_KEY, VITE_FIREBASE_CONFIG.

## ?? Testing & Validation
- Ensure type safety by running TypeScript checks before committing.
- Manually verify UI components across light/dark modes to prevent flickering.
