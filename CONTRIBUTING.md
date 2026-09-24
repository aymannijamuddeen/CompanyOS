# Contributing to CompanyOS

Thank you for your interest in contributing to **CompanyOS**! We welcome contributions from the community to help build the open operating system for AI-augmented enterprise operations.

## Code of Conduct

Please be respectful, collaborative, and considerate of others when interacting with this repository and its community.

## Getting Started

1. **Fork the Repository**: Create your own fork of the repository on GitHub.
2. **Clone your Fork**:
   ```bash
   git clone https://github.com/YOUR-USERNAME/CompanyOS.git
   cd CompanyOS
   ```
3. **Set Up Upstream Remote**:
   ```bash
   git remote add upstream https://github.com/aymannijamuddeen/CompanyOS.git
   ```
4. **Install Dependencies**:
   ```bash
   npm install
   ```
5. **Configure Environment Variables**:
   ```bash
   cp .env.example .env
   # Or configure backend/.env
   ```
6. **Set Up Database**:
   ```bash
   cd backend
   npx prisma migrate dev
   npx prisma db seed
   cd ..
   ```

## Development Workflow

1. Create a feature branch with a descriptive name:
   ```bash
   git checkout -b feature/my-new-feature
   # or
   git checkout -b fix/issue-description
   ```
2. Start the development environment:
   ```bash
   npm run dev
   ```
3. Run tests and linting before submitting code:
   ```bash
   # Linting
   npm run lint

   # Type checking & Build
   npm run build

   # Backend unit & integration tests
   npm test
   ```

## Submitting Pull Requests

- Keep PRs focused on a single feature or bugfix.
- Follow existing code patterns and conventions (TypeScript strict typing, Prisma schema conventions, React functional components).
- Ensure all CI checks (linting, building, and tests) pass locally.
- Include a descriptive title and summary in your PR using our PR template.
- Link any related issue in the pull request description (e.g., `Fixes #12`).

## Reporting Bugs and Feature Requests

- Use the GitHub Issue Tracker.
- Search existing issues before creating a new one to avoid duplicates.
- Provide clear reproduction steps, environment details, and expected behavior.
