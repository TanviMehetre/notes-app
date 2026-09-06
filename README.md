# 🌿 Tanvi & Saie • Collaborative Notes & Project Progress Workspace

A beautiful, cohesive, and distraction-free project workspace specifically designed for **Tanvi** and **Saie** to track ideas, research milestones, action checklists, and discussions for their joint project.

Built with a soothing **botanical aesthetic** featuring pastel sage greens, warm golden ochre, and deep forest green typography and accents.

---

## 🎨 Aesthetic & Design Palette

The interface was curated to be calming, pleasing to the eye, and clear during intensive collaborative work sessions:

| Token / Role | Color Hex | Description & Usage |
| :--- | :--- | :--- |
| **Deep Forest Green** | `#0f261a` - `#1c4732` | Primary brand typography, high-contrast headers, and primary action buttons. |
| **Pastel Sage Green** | `#cce4d2` - `#e3efe6` | **Tanvi's signature profile badge 🌿**, note cards, and subtle active background tints. |
| **Warm Golden Ochre** | `#b07817` - `#c88d25` | **Saie's signature profile badge ✨**, milestone indicators, priority highlights, and amber accents. |
| **Pastel Ochre / Honey** | `#f6e3bd` - `#fdf9f0` | Soft warm cards, Saie's comment background tint, and badge backgrounds. |
| **Warm Linen Neutral** | `#f6f8f5` - `#ffffff` | Eye-friendly soft backgrounds avoiding harsh clinical white glare. |

---

## 👥 Dual-Collaborator Identity & Attribution

Designed specifically for two collaborators:
- **Tanvi (TM)**: Represented with a **Sage Green 🌿** theme. Notes, comments, task checkoffs, and activity entries created by Tanvi are clearly highlighted with sage badges and distinct emerald borders.
- **Saie (SN)**: Represented with a **Warm Ochre ✨** theme. Notes, comments, task checkoffs, and activity entries created by Saie are distinctly highlighted with warm ochre badges and amber borders.

### Real-Time Profile Switcher
In the top header, click between **Tanvi** and **Saie** with one click to switch who you are currently acting as:
- Any new note created will be attributed to the active collaborator.
- Any comment posted will have the author's signature card style (Sage for Tanvi, Ochre for Saie).
- Any checklist item completed records the collaborator's name (e.g., `✓ Tanvi` or `✓ Saie`).
- Live emoji reactions reflect the active collaborator.

---

## 🚀 Key Features

1. **Combined Project Progress Dashboard**:
   - **Progress Completion Meter**: Dynamically computes completion percentage across all actionable checklist items across every note.
   - **Metrics Overview**: Live counters for Total Notes, Completed Milestones, Comments Exchanged, and Notes Awaiting Review.
   - **Individual Contributions**: Tracks notes and tasks completed specifically by Tanvi vs. Saie.
   - **Editable Project Title**: Click the edit icon to customize your project workspace title.

2. **Interactive Notes & Cards**:
   - **Status Indicators**: `In Progress` ⏳, `Needs Review` 👀, `Completed` ✅, or `Idea / Discussion` 💡.
   - **Priority Levels**: High 🔥, Medium 🌱, Low.
   - **Categorical Tags**: Filter and group by `#research`, `#design`, `#thesis`, etc.
   - **Pin to Top**: Pin high-priority notes to the top of the workspace.

3. **Checklist & Subtask Tracking**:
   - Add granular deliverables to each note.
   - Checking off a task records who completed it and when.
   - Automatically marks a note as `Completed` when all subtasks are finished.

4. **Dedicated Comment Threads with Author Distinction**:
   - Every note features a discussion thread.
   - **Tanvi's comments**: Pastel sage background with green author tag and avatar.
   - **Saie's comments**: Pastel ochre background with golden amber author tag and avatar.
   - Timestamps and delete options for clean collaboration.

5. **Emoji Reactions**:
   - React with 👍, ❤️, 🌿, ✨, 💡, or 🚀. See which teammate reacted on hover.

6. **Team Activity Feed**:
   - An interactive chronological feed detailing all actions taken by Tanvi and Saie (notes created, tasks completed, comments posted, notes edited).

7. **Real-Time Cloud Firestore Sync & In-App Cloud Settings**:
   - Integrated with **Google Cloud Firestore** using the modern Modular Web SDK for instant cross-device updates.
   - Any note, comment, or checklist deliverable created by Tanvi or Saie updates live across the internet on both machines!
   - **In-App Cloud Sync Modal**: When hosted publicly on GitHub Pages, click **Cloud Sync** in the header to paste your Firebase config snippet once. It is saved in your browser's private `localStorage` and never committed or exposed on GitHub!
   - **Local Auto-Detection**: When developing locally, `app.js` automatically imports `firebase-config.js` if present.
   - Built-in offline caching with graceful local backup.
   - **Export Data**: Download your entire project state as a JSON backup anytime.
   - **Clear All**: Reset or empty workspace anytime with confirmation.

---

## 🌐 Live GitHub Pages & Firebase Setup

When viewing the live app on **GitHub Pages**:
1. Click the **Cloud Sync** button in the header (or the sync indicator next to the progress bar).
2. Paste your **Firebase Web Config** snippet:
   ```javascript
   {
     apiKey: "...",
     authDomain: "...",
     projectId: "notes-app-4bcd5",
     storageBucket: "...",
     messagingSenderId: "...",
     appId: "..."
   }
   ```
3. Click **Connect & Sync**. The status dot will turn green (`🟢 Cloud Firestore Live`) and automatically sync live notes between Tanvi and Saie!

---

## 💻 Getting Started / Running Locally

Since this app is built with pure **HTML5**, **Vanilla CSS**, and standard modern **ES Modules**, no complex build toolchains, Webpack, or bundlers are required.

### Quick Start with Python
```bash
# In the project directory:
python3 -m http.server 8080
```
Then open your browser to [http://localhost:8080](http://localhost:8080).

### Quick Start with Node / npx
```bash
npx -y serve . -p 8080
```

---

## 📁 File Structure

```
notes-app/
├── index.html                 # Semantic HTML5 layout, profile switcher, and dashboard
├── styles.css                 # Pastel green, ochre, and dark green design system & micro-animations
├── app.js                     # Real-time Firestore sync, in-app config modal, author attribution
├── firebase-config.example.js # Template configuration for new contributors
├── firestore.rules            # Cloud Firestore security rules with schema validation
├── .gitignore                 # Excludes sensitive firebase-config.js from repository
└── README.md                  # Documentation, design palette breakdown, and usage instructions
```