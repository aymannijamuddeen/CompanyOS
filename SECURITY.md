# Security Policy

CompanyOS takes security seriously. We build enterprise software designed to handle organizational workflows and internal operational data, making security a core engineering priority.

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |

## Reporting a Vulnerability

If you discover a security vulnerability in CompanyOS, please follow responsible disclosure guidelines:

1. **Do not open a public GitHub issue.**
2. Send an email to [ayman.nijamuddeen@gmail.com](mailto:ayman.nijamuddeen@gmail.com) with:
   - A detailed description of the vulnerability
   - Reproduction steps or proof of concept
   - Potential impact of the issue
3. We will acknowledge receipt of your report within 48 hours and work with you to diagnose and remediate the issue promptly.

## Security Architecture Highlights

- **Authentication**: Argon2id & bcrypt password hashing with cryptographically secure salts.
- **Session Management**: JWT access tokens coupled with refresh token rotation.
- **Protection**: Helmet HTTP security headers, CORS origin verification, and rate limiting with sliding windows.
- **Input Validation**: Strict schema enforcement using Zod and Express Validator.
- **Database Safety**: Parameterized queries and migrations via Prisma ORM.
