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

7. **Zero-Setup Local Persistence & Cross-Tab Sync**:
   - All state is preserved locally in `localStorage`.
   - Built-in `BroadcastChannel` synchronization updates any other open browser tabs in real-time.
   - **Export Data**: Download your entire project state as a JSON backup anytime.
   - **Reset Demo**: Instantly reload rich sample project data.

---

## 💻 Getting Started / Running Locally

Since this app is built with pure **HTML5**, **Vanilla CSS**, and modern **JavaScript**, no complex build toolchains or dependencies are required.

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
Or simply double-click and open `index.html` directly in any modern browser (Chrome, Safari, Firefox, Edge).

---

## 📁 File Structure

```
notes-app/
├── index.html        # Semantic HTML5 layout, accessible dialog modals, and dashboard
├── styles.css        # Pastel green, ochre, and dark green design system & micro-animations
├── app.js            # Dual-profile state logic, checklists, comments, and sync
└── README.md         # Documentation, design palette breakdown, and usage instructions
```