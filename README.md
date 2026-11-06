# Tectonic Shift — Spiritual Commitment & Accountability React PWA

A multi-page Progressive Web App (PWA) built with **React 18**, **React Router v6**, **Vite**, and **Firebase (Authentication + Cloud Firestore)** for the **Tectonic Shift** spiritual program.

## Multi-Page Route Structure

| Route | Page Component | Description |
| :--- | :--- | :--- |
| `/` | `src/pages/HomePage.jsx` | **Home Page (Community Progress & Watchtower)**: Everyone sees everyone's progress, daily check-in strips, and the **Accountability Watchlist** showing who has been skipping their commitments or hasn't submitted for the week. |
| `/dashboard` | `src/pages/DashboardPage.jsx` | **Weekly Commitment Form**: Displays the user's name and current week, interactive **Example Guide** toggle + **Auto-Fill Sample**, Fasting / Prayer (minutes, primary & alternative times) / Meditation fields, Mon–Sun daily check-in tracker, and **Save Commitment** button. |
| `/history` | `src/pages/HistoryPage.jsx` | **History Page**: Displays the signed-in participant's saved commitments from previous weeks with one-click loading/editing. |
| `/auth` | `src/pages/AuthPage.jsx` | **Authentication & Account Page**: Email/Password Sign-In & Sign-Up, Google Sign-In, profile name editor, and runtime Firebase configuration panel. |

## Directory Structure

```text
Tectonic Shift/
├── index.html                      # Vite HTML entry with PWA meta tags & manifest link
├── package.json                    # React, React Router, Firebase, and Vite dependencies
├── vite.config.js                  # Vite bundler configuration
├── firestore.rules                 # Firestore Security Rules enforcing owner writes & schema validation
├── firebase.json                   # Firebase Hosting (SPA rewrites) & Firestore configuration
├── public/
│   ├── manifest.json               # Web App Manifest for mobile installation
│   ├── sw.js                       # Service Worker for offline caching & SPA route fallback
│   └── icons/
│       ├── icon-192.svg            # 192x192 maskable PWA icon
│       └── icon-512.svg            # 512x512 maskable PWA icon
└── src/
    ├── main.jsx                    # React root, BrowserRouter, and Service Worker registration
    ├── App.jsx                     # Multi-page route definitions (/, /dashboard, /history, /auth)
    ├── style.css                   # Responsive mobile-first CSS3 stylesheet
    ├── components/
    │   └── Navbar.jsx              # Top app header, NavLink router bar, and PWA Install button
    ├── context/
    │   └── TectonicContext.jsx     # Firebase Auth, Firestore real-time onSnapshot, & Demo fallback
    ├── pages/
    │   ├── HomePage.jsx            # / — Public Community Progress & Accountability Board
    │   ├── DashboardPage.jsx       # /dashboard — Weekly Commitment Form & Example Guide
    │   ├── HistoryPage.jsx         # /history — Previous Weeks' Saved Commitments
    │   └── AuthPage.jsx            # /auth — Sign-In / Sign-Up & Firebase Config
    ├── services/
    │   └── firebase.js             # Firebase SDK initialization & runtime config loader
    └── utils/
        └── weeks.js                # ISO week helpers, adherence metrics, & seed cohort data
```

## Getting Started

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Start the development server**:
   ```bash
   npm run dev
   ```

3. **Build for production**:
   ```bash
   npm run build
   ```
