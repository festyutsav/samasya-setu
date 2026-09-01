# Contributing to SamasyaSetu

Thank you for contributing to **SamasyaSetu**! 

SamasyaSetu is a collaborative platform for reporting, managing, and
solving local community problems through citizens, administrators, and
partner organizations.

We welcome contributions including new features, bug fixes, UI
improvements, backend improvements, AI improvements, and documentation.

------------------------------------------------------------------------

## Before You Start

Please make sure you:

- Have Git installed
- Have Node.js installed
- Have cloned the repository
- Have installed the required dependencies
- Have created your local environment variables

Never commit passwords, API keys, database credentials, Cloudinary
credentials, or other secrets.

------------------------------------------------------------------------

## Getting Started

Clone the repository:

```bash
git clone git@github.com:festyutsav/samasya-setu.git
cd samasya-setu
```

### Install Frontend Dependencies

```bash
cd client
npm install
```

### Install Backend Dependencies

Open another terminal:

```bash
cd server
npm install
```

------------------------------------------------------------------------

## Environment Variables

The actual `.env` files are not stored in GitHub.

Use the provided example:

```text
server/.env.example
```

Create your local environment file:

```bash
cd server
cp .env.example .env
```

Then add your own credentials.

**Never commit `.env`.**

------------------------------------------------------------------------

## Branching Strategy

The `main` branch is protected.

**Do not push directly to `main`.**

Create a branch for a feature, bug fix, or specific task.

Example:

```bash
git switch main
git pull origin main
git switch -c feature/notifications
```

Examples:

```text
feature/ai-improvements
feature/admin-dashboard
feature/problem-search
fix/login-error
fix/image-upload
ui/problem-details
```

### Important

You do **not** need to create a new branch for every commit or push.

One branch should generally represent one feature or task.

You can make multiple commits and pushes to the same branch.

------------------------------------------------------------------------

## Making Changes

Work normally on your feature branch:

```bash
git add .
git commit -m "Add notification UI"
git push
```

Continue using the same branch for further changes:

```bash
git add .
git commit -m "Connect notification API"
git push
```

When the feature is complete, create a Pull Request to `main`.

------------------------------------------------------------------------

## Keeping Your Branch Updated

Before starting new work:

```bash
git switch main
git pull origin main
```

Then create your feature branch:

```bash
git switch -c feature/your-feature-name
```

If you are already working on a branch and `main` has changed, update
your branch before creating the Pull Request.

------------------------------------------------------------------------

## Pull Requests

When your feature is ready:

1. Push your branch to GitHub.
2. Open a Pull Request.
3. Set the base branch to `main`.
4. Explain what you changed.
5. Review the changed files.
6. Make sure the project works correctly.
7. Merge the Pull Request when it is ready.

Example:

```text
feature/problem-search
        ↓
   Pull Request
        ↓
       main
```

Please do not push directly to `main`.

------------------------------------------------------------------------

## Before Creating a Pull Request

Make sure:

- The application runs correctly.
- The frontend builds successfully.
- The backend starts successfully.
- Your feature works as expected.
- You have not committed `.env` files.
- You have not committed API keys or passwords.
- You have not included `node_modules`.
- Your changes do not unnecessarily break existing features.

------------------------------------------------------------------------

## Commit Messages

Keep commit messages short and meaningful.

### Good examples

```text
Add problem search
Fix image upload error
Add admin problem filters
Improve AI category prediction
Update problem details UI
Fix partner assignment
Add environment configuration
```

### Avoid

```text
changes
update
done
final
new code
asdf
```

------------------------------------------------------------------------

## Working With Other Contributors

Multiple contributors can work on different features at the same time.

```text
                    main
                     │
          ┌──────────┴──────────┐
          ↓                     ↓
feature/notifications    feature/admin-filters
          │                     │
          ↓                     ↓
         PR                    PR
          │                     │
          └──────────┬──────────┘
                     ↓
                    main
```

If two contributors modify the same lines of the same file, Git may
report a merge conflict.

Do not overwrite another contributor's work without checking the changes
first.

------------------------------------------------------------------------

## Important Rules

### Do not push directly to main

```text
❌ git push origin main
```

Use a feature branch and Pull Request instead.

### Do not commit secrets

Never commit:

```text
.env
API keys
database passwords
JWT secrets
Cloudinary credentials
private credentials
```

### Do not commit dependencies

Do not commit:

```text
node_modules/
```

These should already be ignored by `.gitignore`.

------------------------------------------------------------------------

## Project Structure

```text
samasya-setu/
│
├── client/
│   ├── src/
│   │   ├── components/
│   │   ├── layouts/
│   │   ├── pages/
│   │   ├── services/
│   │   └── assets/
│   │
│   └── package.json
│
├── server/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── services/
│   └── package.json
│
├── README.md
├── CONTRIBUTING.md
└── .gitignore
```

------------------------------------------------------------------------

## Suggesting New Features

If you have an idea for improving SamasyaSetu:

1. Discuss the idea with the project team.
2. Explain the problem it solves.
3. Discuss the proposed solution.
4. Create a feature branch after the idea is accepted.
5. Implement the feature.
6. Test your changes.
7. Open a Pull Request.

------------------------------------------------------------------------

## Reporting Bugs

When reporting a bug, include:

- What happened
- What you expected to happen
- Steps to reproduce the issue
- Relevant error messages
- Screenshots when useful
- Browser or environment information when relevant

------------------------------------------------------------------------

## Thank You

Every contribution helps improve SamasyaSetu.

Thank you for helping build a platform that can make community problem
reporting and resolution more effective.