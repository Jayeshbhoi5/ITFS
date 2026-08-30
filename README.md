# Innovative Teaching Feedback System (ITFS)

A feedback platform for faculty and students at KBTCOE, Nashik.  
Built with React + Vite, Firebase (Hosting, Firestore, Auth), and deployed via GitHub Actions.

---

## Live URL

The production site is hosted on Firebase Hosting.  
The URL is managed by the Firebase project `innovative-teaching-feed-2d77a`.  
**Do not create a new Firebase project. Do not change the project ID.**

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite |
| Styling | Tailwind CSS |
| Database | Firebase Firestore |
| Auth | Firebase Auth (Google + Email/Password) |
| File uploads | Cloudinary |
| Hosting | Firebase Hosting |
| CI/CD | GitHub Actions |

---

## Local Development Setup

### Requirements
- Node.js 20 or higher (24 recommended)
- npm

### Steps

```bash
# 1. Clone the repository
git clone https://github.com/Jayeshbhoi5/ITFS.git
cd ITFS

# 2. Install dependencies
npm install

# 3. Start the dev server
npm run dev
```

The app will be available at `http://localhost:5173`

---

## Building for Production

```bash
npm run build
```

Output goes to the `dist/` folder. This is what Firebase Hosting serves.

---

## How Deployment Works

### Automatic Deployment (Recommended)

Every push to the `master` branch triggers GitHub Actions which:

1. Installs Node.js 24
2. Runs `npm ci` to install dependencies
3. Runs `npm run build` to build the app
4. Deploys the built app to Firebase Hosting (live URL)
5. Deploys `firestore.rules` to Firebase Firestore
6. Deploys `firestore.indexes.json` to Firebase Firestore

**If the build fails, nothing is deployed. The live site is never broken by a failed build.**

### What This Means for Future Students

You do NOT need:
- Access to Firebase Console
- The original developer's Google account
- Firebase CLI installed on your computer
- Any Firebase credentials

You only need:
- Access to this GitHub repository
- Permission to push to `master` (or submit a pull request)

Just modify the code, commit, and push. GitHub handles the rest.

---

## Project Structure

```
src/
  firebaseConfig.js          ← Firebase client config (safe to be in code)
  cloudinaryConfig.js        ← Cloudinary config (see security note below)
  pages/
    Homepage.jsx
    Signup.jsx
    LoginPage.jsx
    FacultyDashboard/        ← Faculty-facing pages
    StudentDashboard/        ← Student-facing pages
  components/                ← Shared components

firestore.rules              ← Firestore security rules (edit here, auto-deployed)
firestore.indexes.json       ← Firestore indexes (edit here, auto-deployed)
firebase.json                ← Firebase project config
.firebaserc                  ← Firebase project alias
.github/workflows/           ← GitHub Actions CI/CD
```

---

## Firebase Resources

| Resource | Managed via |
|---|---|
| Hosting | GitHub Actions (auto on push to master) |
| Firestore rules | `firestore.rules` → GitHub Actions |
| Firestore indexes | `firestore.indexes.json` → GitHub Actions |
| Firebase Functions | Manual deploy only (not in CI) |
| Realtime Database rules | Manual only (`database.rules.json`) |
| Auth providers | Firebase Console only |

---

## Modifying Firestore Rules

Edit `firestore.rules` in this repository.  
Commit and push to `master`.  
GitHub Actions will automatically deploy the updated rules to Firestore.  
**You do not need to open Firebase Console.**

---

## Modifying Firestore Indexes

Edit `firestore.indexes.json` in this repository.  
Commit and push to `master`.  
GitHub Actions will automatically deploy the updated indexes.

---

## GitHub Actions Secret Required

The deployment uses one GitHub Actions secret:

| Secret Name | What it is |
|---|---|
| `FIREBASE_SERVICE_ACCOUNT_INNOVATIVE_TEACHING_FEED_2D77A` | Firebase service account JSON key |

This secret is already configured in the repository.  
Future maintainers do NOT need to change it unless the Firebase project changes.

If the secret needs to be renewed:
1. Go to Firebase Console → Project Settings → Service Accounts
2. Generate a new private key (download JSON)
3. Go to GitHub repo → Settings → Secrets and variables → Actions
4. Update the secret value with the new JSON content

---

## What Requires Firebase Console Access

Some things cannot be done through GitHub and require authorized Firebase/Google Cloud access:

| Task | Where |
|---|---|
| Enable/disable Auth providers (Google, Email) | Firebase Console → Authentication |
| Change authorized domains for Auth | Firebase Console → Authentication → Settings |
| View/edit Firestore data directly | Firebase Console → Firestore |
| Manage Firebase Functions | Firebase Console or CLI |
| Renew the service account key | Firebase Console → Project Settings |
| Change Hosting custom domain | Firebase Console → Hosting |
| Firebase billing | Google Cloud Console |

These tasks require the Google account that owns the Firebase project.  
Document the owner's contact for future reference.

---

## Security — What Must NEVER Be Committed

| What | Why |
|---|---|
| Firebase service account JSON | Gives full admin access to the Firebase project |
| Google account password | Personal credential |
| GitHub Personal Access Token | Gives repo access |
| Any `*_SECRET_*` or `*_PRIVATE_KEY*` values | Sensitive credentials |

The following are **safe to be in the code** (they are public identifiers):

| What | Why it's safe |
|---|---|
| `src/firebaseConfig.js` values (apiKey, projectId, etc.) | Firebase web config is designed to be public. Security is enforced by Firestore rules and Auth, not by hiding these values. |

### ⚠ Cloudinary API Secret

`src/cloudinaryConfig.js` currently contains a Cloudinary `apiSecret`.  
This is a **sensitive value** and should ideally be moved to a backend/serverless function.  
For now, note that whoever has access to this repository can see it.  
Future maintainers should move image upload logic to a Firebase Function if security is a concern.

---

## Making Changes — Contributor Workflow

```bash
# 1. Make your code changes

# 2. Test locally
npm run dev

# 3. Build to verify no errors
npm run build

# 4. Commit and push
git add .
git commit -m "describe your change"
git push origin master
```

Go to the GitHub Actions tab to watch the deployment.  
The live site updates within 1–2 minutes of a successful run.

---

## Changing Authentication or Application Workflow

Future students are free to modify:
- Login/signup pages (`src/pages/LoginPage.jsx`, `src/pages/Signup.jsx`)
- Google Sign-In flow (`src/FirebaseAuth.js`)
- Student dashboard (`src/pages/StudentDashboard/`)
- Faculty dashboard (`src/pages/FacultyDashboard/`)
- Routing (`src/App.jsx`)
- Firestore read/write logic (any page)
- Firestore security rules (`firestore.rules`)
- UI, styling, components

**If you change Firestore rules, test them carefully before pushing to master.**  
A broken rules file can lock everyone out of the database.

---

## Firebase Functions

The `functions/` folder contains a stub (`helloWorld`).  
Functions are NOT automatically deployed by GitHub Actions.  
To deploy functions, you need Firebase CLI and authorized Google credentials.  
This is intentional — function deployment has higher risk and requires careful review.
