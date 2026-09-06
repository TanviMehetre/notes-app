/**
 * Tanvi & Saie • Project Notes & Progress Workspace
 * Logic, State Management, Author Attribution, Comments & Checklists
 * Integrated with Google Cloud Firestore for Real-Time Cross-Device Sync
 */

import { initializeApp, getApps, deleteApp } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-app.js";
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  getDocs,
  writeBatch
} from "https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js";

// Constants & LocalStorage Keys (Local Cache & Offline Backup)
const STORAGE_KEY_NOTES = 'tanvi_saie_notes_v2';
const STORAGE_KEY_ACTIVITY = 'tanvi_saie_activity_v2';
const STORAGE_KEY_PROJECT = 'tanvi_saie_project_info_v2';
const STORAGE_KEY_ACTIVE_USER = 'tanvi_saie_active_user';
const STORAGE_KEY_FIREBASE_CONFIG = 'tanvi_saie_custom_firebase_config';

// Collaborator Profiles
const COLLABORATORS = {
  Tanvi: {
    name: 'Tanvi',
    initials: 'TM',
    role: 'Collaborator 🌿',
    theme: 'tanvi',
    badgeClass: 'badge-tanvi',
    avatarClass: 'avatar-tanvi'
  },
  Saie: {
    name: 'Saie',
    initials: 'SN',
    role: 'Collaborator ✨',
    theme: 'saie',
    badgeClass: 'badge-saie',
    avatarClass: 'avatar-saie'
  }
};

// Cloud Firestore State
let app = null;
let db = null;
let isFirestoreLive = false;
let activeFirebaseConfig = null;
let firestoreUnsubscribers = [];
let firestoreConnectionTimeout = null;

// Broadcast Channel for live cross-tab sync as secondary backup
let syncChannel = null;
if ('BroadcastChannel' in window) {
  try {
    syncChannel = new BroadcastChannel('tanvi_saie_sync_channel');
    syncChannel.onmessage = (event) => {
      if (event.data && event.data.type === 'STATE_UPDATED') {
        if (!isFirestoreLive) {
          loadStateFromLocalStorage();
          renderApp();
        }
      }
    };
  } catch (e) {
    console.warn('BroadcastChannel not supported or restricted', e);
  }
}

// Application State
let activeUser = localStorage.getItem(STORAGE_KEY_ACTIVE_USER) || 'Tanvi';
let projectInfo = {
  title: "Tanvi & Saie's Project Workspace",
  description: 'Track shared research, milestones, action checklists, and notes between Tanvi and Saie.'
};
let notes = [];
let activities = [];
let currentBuilderTasks = [];
let notePendingDeleteId = null;

// Filter & Search State
let searchQuery = '';
let filterAuthor = 'all';
let filterStatus = 'all';
let sortBy = 'recent';

// DOM Elements
const userTanviBtn = document.getElementById('userTanviBtn');
const userSaieBtn = document.getElementById('userSaieBtn');
const projectNameHeading = document.getElementById('projectNameHeading');
const editProjectNameBtn = document.getElementById('editProjectNameBtn');
const projectDesc = document.getElementById('projectDesc');

const tanviContribStats = document.getElementById('tanviContribStats');
const saieContribStats = document.getElementById('saieContribStats');
const progressPercentageText = document.getElementById('progressPercentageText');
const projectProgressBarFill = document.getElementById('projectProgressBarFill');
const projectProgressBarTrack = document.getElementById('projectProgressBarTrack');
const taskStatsCounter = document.getElementById('taskStatsCounter');

const totalNotesMetric = document.getElementById('totalNotesMetric');
const completedTasksMetric = document.getElementById('completedTasksMetric');
const totalCommentsMetric = document.getElementById('totalCommentsMetric');
const reviewNeededMetric = document.getElementById('reviewNeededMetric');

const searchInput = document.getElementById('searchInput');
const clearSearchBtn = document.getElementById('clearSearchBtn');
const authorFilter = document.getElementById('authorFilter');
const statusFilter = document.getElementById('statusFilter');
const sortBySelect = document.getElementById('sortBy');

const notesGrid = document.getElementById('notesGrid');
const notesCountPill = document.getElementById('notesCountPill');
const emptyState = document.getElementById('emptyState');
const emptyStateNewNoteBtn = document.getElementById('emptyStateNewNoteBtn');

// Modal Elements
const noteModal = document.getElementById('noteModal');
const openNewNoteModalBtn = document.getElementById('openNewNoteModalBtn');
const closeNoteModalBtn = document.getElementById('closeNoteModalBtn');
const cancelNoteModalBtn = document.getElementById('cancelNoteModalBtn');
const noteForm = document.getElementById('noteForm');
const noteEditId = document.getElementById('noteEditId');
const modalTitle = document.getElementById('modalTitle');
const modalAuthorIndicator = document.getElementById('modalAuthorIndicator');
const noteTitleInput = document.getElementById('noteTitleInput');
const noteStatusSelect = document.getElementById('noteStatusSelect');
const notePrioritySelect = document.getElementById('notePrioritySelect');
const noteTagsInput = document.getElementById('noteTagsInput');
const noteContentInput = document.getElementById('noteContentInput');
const notePinCheckbox = document.getElementById('notePinCheckbox');
const saveNoteBtnText = document.getElementById('saveNoteBtnText');

// Checklist builder in modal
const checklistBuilder = document.getElementById('checklistBuilder');
const newSubtaskInput = document.getElementById('newSubtaskInput');
const addSubtaskBtn = document.getElementById('addSubtaskBtn');

// Activity Drawer
const activityDrawer = document.getElementById('activityDrawer');
const openActivityBtn = document.getElementById('openActivityBtn');
const closeActivityDrawerBtn = document.getElementById('closeActivityDrawerBtn');
const doneActivityDrawerBtn = document.getElementById('doneActivityDrawerBtn');
const clearActivityHistoryBtn = document.getElementById('clearActivityHistoryBtn');
const activityTimeline = document.getElementById('activityTimeline');
const activityBadgeCount = document.getElementById('activityBadgeCount');

// Delete Modal
const deleteConfirmModal = document.getElementById('deleteConfirmModal');
const deleteNoteTitlePreview = document.getElementById('deleteNoteTitlePreview');
const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
const abortDeleteBtn = document.getElementById('abortDeleteBtn');
const confirmDeleteSubmitBtn = document.getElementById('confirmDeleteSubmitBtn');

// Utility Buttons
const exportDataBtn = document.getElementById('exportDataBtn');
const clearWorkspaceBtn = document.getElementById('clearWorkspaceBtn');
const toastContainer = document.getElementById('toastContainer');
const syncStatusDot = document.getElementById('syncStatusDot');
const syncStatusText = document.getElementById('syncStatusText');

// Cloud Firestore Config Modal Elements
const firebaseConfigModal = document.getElementById('firebaseConfigModal');
const openCloudConfigBtn = document.getElementById('openCloudConfigBtn');
const liveSyncStatus = document.getElementById('liveSyncStatus');
const closeCloudModalBtn = document.getElementById('closeCloudModalBtn');
const cancelCloudModalBtn = document.getElementById('cancelCloudModalBtn');
const resetCloudConfigBtn = document.getElementById('resetCloudConfigBtn');
const firebaseConfigForm = document.getElementById('firebaseConfigForm');
const firebaseConfigInput = document.getElementById('firebaseConfigInput');

// ==========================================================================
// Sync Status Helper
// ==========================================================================
function setSyncStatus(state, message) {
  if (!syncStatusDot || !syncStatusText) return;
  syncStatusDot.className = 'sync-dot';
  if (state === 'active') {
    syncStatusDot.classList.add('sync-active');
  } else if (state === 'warning') {
    syncStatusDot.classList.add('sync-warning');
  } else {
    syncStatusDot.classList.add('sync-offline');
  }
  syncStatusText.textContent = message;
}

// ==========================================================================
// Local Storage Cache Management
// ==========================================================================
function loadStateFromLocalStorage() {
  try {
    // Purge legacy demo keys
    localStorage.removeItem('tanvi_saie_notes_v1');
    localStorage.removeItem('tanvi_saie_activity_v1');
    localStorage.removeItem('tanvi_saie_project_info_v1');

    const storedNotes = localStorage.getItem(STORAGE_KEY_NOTES);
    if (storedNotes !== null) {
      notes = JSON.parse(storedNotes);
    } else {
      notes = [];
    }

    const storedActivity = localStorage.getItem(STORAGE_KEY_ACTIVITY);
    if (storedActivity !== null) {
      activities = JSON.parse(storedActivity);
    } else {
      activities = [];
    }

    const storedProject = localStorage.getItem(STORAGE_KEY_PROJECT);
    if (storedProject !== null) {
      projectInfo = JSON.parse(storedProject);
    }

    const storedActiveUser = localStorage.getItem(STORAGE_KEY_ACTIVE_USER);
    if (storedActiveUser && COLLABORATORS[storedActiveUser]) {
      activeUser = storedActiveUser;
    }
  } catch (e) {
    console.error('Error loading local state:', e);
    notes = [];
    activities = [];
  }
}

function saveNotesToLocalStorage() {
  try {
    localStorage.setItem(STORAGE_KEY_NOTES, JSON.stringify(notes));
    if (syncChannel) {
      syncChannel.postMessage({ type: 'STATE_UPDATED', timestamp: Date.now() });
    }
  } catch (e) {
    console.error('Failed to save notes locally:', e);
  }
}

function saveActivitiesToLocalStorage() {
  try {
    localStorage.setItem(STORAGE_KEY_ACTIVITY, JSON.stringify(activities));
  } catch (e) {
    console.error('Failed to save activities locally:', e);
  }
}

function saveProjectInfoToLocalStorage() {
  try {
    localStorage.setItem(STORAGE_KEY_PROJECT, JSON.stringify(projectInfo));
  } catch (e) {
    console.error('Failed to save project info locally:', e);
  }
}

// ==========================================================================
// Cloud Firestore Configuration Parser & Manager
// ==========================================================================

/**
 * Safely parses a Firebase config snippet from either:
 * - JSON string
 * - JS object literal / variable declaration (copied directly from Firebase console)
 */
function parseFirebaseConfig(rawInput) {
  if (!rawInput || typeof rawInput !== 'string') return null;
  const trimmed = rawInput.trim();

  // 1. Try standard JSON.parse
  try {
    const parsed = JSON.parse(trimmed);
    if (parsed && typeof parsed === 'object' && parsed.apiKey && parsed.projectId) {
      return parsed;
    }
  } catch (e) {
    // Continue to regex parser
  }

  // 2. Extract standard Firebase config keys using regex
  const keys = ['apiKey', 'authDomain', 'projectId', 'storageBucket', 'messagingSenderId', 'appId', 'measurementId'];
  const extracted = {};

  for (const key of keys) {
    const regex = new RegExp(`["']?${key}["']?\\s*:\\s*["'\`]([^"'\`\\r\\n]+)["'\`]`, 'i');
    const match = trimmed.match(regex);
    if (match && match[1]) {
      extracted[key] = match[1].trim();
    }
  }

  if (extracted.apiKey && extracted.projectId && extracted.projectId !== 'YOUR_PROJECT_ID') {
    return extracted;
  }

  return null;
}

/**
 * Resolves Firebase config:
 * 1. Checks localStorage for user-saved credentials (Option 2)
 * 2. Attempts dynamic import of local firebase-config.js (for local development)
 */
async function resolveFirebaseConfig() {
  // 1. Check user-configured credentials in localStorage
  const saved = localStorage.getItem(STORAGE_KEY_FIREBASE_CONFIG);
  if (saved) {
    const parsed = parseFirebaseConfig(saved);
    if (parsed) {
      return { config: parsed, source: 'localStorage' };
    }
  }

  // 2. Try dynamic import from local firebase-config.js (if file exists locally)
  try {
    const localModule = await import('./firebase-config.js');
    if (localModule && localModule.firebaseConfig && localModule.firebaseConfig.apiKey && localModule.firebaseConfig.projectId !== 'YOUR_PROJECT_ID') {
      return { config: localModule.firebaseConfig, source: 'file' };
    }
  } catch (e) {
    // Expected on GitHub Pages where firebase-config.js is excluded from Git
    console.info("No local firebase-config.js file found (expected on GitHub Pages).");
  }

  return { config: null, source: 'none' };
}

function clearFirestoreListeners() {
  if (firestoreConnectionTimeout) {
    clearTimeout(firestoreConnectionTimeout);
    firestoreConnectionTimeout = null;
  }
  while (firestoreUnsubscribers.length > 0) {
    const unsub = firestoreUnsubscribers.pop();
    if (typeof unsub === 'function') {
      try {
        unsub();
      } catch (e) {
        console.warn('Error unsubscribing Firestore listener:', e);
      }
    }
  }
  isFirestoreLive = false;
}

async function connectFirebase(config) {
  clearFirestoreListeners();

  if (!config || !config.apiKey || !config.projectId) {
    setSyncStatus('offline', 'Offline Mode • Click Cloud Sync');
    return false;
  }

  try {
    setSyncStatus('warning', 'Connecting to Cloud Firestore...');

    // Clean up existing apps to avoid duplicate app errors
    const existingApps = getApps();
    if (existingApps.length > 0) {
      await Promise.all(existingApps.map(a => deleteApp(a)));
    }

    app = initializeApp(config);
    db = getFirestore(app);
    activeFirebaseConfig = config;

    setupFirestoreListeners();
    return true;
  } catch (err) {
    console.error('Firebase initialization failed:', err);
    setSyncStatus('offline', 'Connection Error • Click Cloud Sync');
    showToast('Failed to connect to Firebase: ' + (err.message || err), 'warning', 6000);
    return false;
  }
}

// ==========================================================================
// Cloud Firestore Real-Time Subscriptions
// ==========================================================================
function setupFirestoreListeners() {
  if (!db) {
    setSyncStatus('offline', 'Offline Mode • Click Cloud Sync');
    return;
  }

  setSyncStatus('warning', 'Connecting to Firestore...');

  firestoreConnectionTimeout = setTimeout(() => {
    if (!isFirestoreLive) {
      setSyncStatus('warning', 'Awaiting Firestore in Console (Test Mode)');
    }
  }, 3500);

  // 1. Real-time Notes Collection Listener
  try {
    const notesColRef = collection(db, "notes");
    const unsubNotes = onSnapshot(notesColRef, (snapshot) => {
      if (firestoreConnectionTimeout) {
        clearTimeout(firestoreConnectionTimeout);
        firestoreConnectionTimeout = null;
      }
      const remoteNotes = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        remoteNotes.push({
          id: docSnap.id,
          title: data.title || '',
          content: data.content || '',
          author: data.author || 'Tanvi',
          status: data.status || 'in-progress',
          priority: data.priority || 'medium',
          pinned: !!data.pinned,
          tags: Array.isArray(data.tags) ? data.tags : [],
          tasks: Array.isArray(data.tasks) ? data.tasks : [],
          comments: Array.isArray(data.comments) ? data.comments : [],
          reactions: (data.reactions && typeof data.reactions === 'object') ? data.reactions : {},
          createdAt: data.createdAt || new Date().toISOString(),
          updatedAt: data.updatedAt || data.createdAt || new Date().toISOString()
        });
      });

      notes = remoteNotes;
      saveNotesToLocalStorage();
      isFirestoreLive = true;
      setSyncStatus('active', 'Cloud Firestore Live');
      renderApp();
    }, (error) => {
      console.warn("Firestore notes sync notification:", error);
      if (error.code === 'permission-denied') {
        setSyncStatus('warning', 'Firestore Rules: Enable Test Mode');
        showToast('Firestore permissions needed: Please enable Test Mode in Firebase Console', 'warning', 6500);
      } else {
        setSyncStatus('offline', 'Local Storage (Offline)');
      }
    });
    firestoreUnsubscribers.push(unsubNotes);

    // 2. Real-time Activities Collection Listener
    const activitiesColRef = collection(db, "activities");
    const activitiesQuery = query(activitiesColRef, orderBy("time", "desc"));
    const unsubActivities = onSnapshot(activitiesQuery, (snapshot) => {
      const remoteActs = [];
      snapshot.forEach((docSnap) => {
        remoteActs.push({
          id: docSnap.id,
          ...docSnap.data()
        });
      });
      activities = remoteActs.slice(0, 50);
      saveActivitiesToLocalStorage();
      renderActivities();
      activityBadgeCount.textContent = activities.length;
    }, (error) => {
      console.warn("Firestore activities sync notification:", error);
    });
    firestoreUnsubscribers.push(unsubActivities);

    // 3. Real-time Project Info Document Listener
    const projectDocRef = doc(db, "projects", "main");
    const unsubProject = onSnapshot(projectDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        projectInfo = {
          title: data.title || projectInfo.title,
          description: data.description || projectInfo.description
        };
        projectNameHeading.textContent = projectInfo.title;
        projectDesc.textContent = projectInfo.description;
        saveProjectInfoToLocalStorage();
      }
    }, (error) => {
      console.warn("Firestore project sync notification:", error);
    });
    firestoreUnsubscribers.push(unsubProject);
  } catch (err) {
    console.error("Failed to establish Firestore listeners:", err);
    setSyncStatus('offline', 'Local Storage Mode');
  }
}

// Activity Logger
async function logActivity(user, text) {
  const newAct = {
    user: user,
    text: text,
    time: new Date().toISOString()
  };

  // Optimistic local update
  activities.unshift(newAct);
  if (activities.length > 50) activities.pop();
  saveActivitiesToLocalStorage();
  renderActivities();

  // Cloud Firestore sync
  if (db && isFirestoreLive) {
    try {
      await addDoc(collection(db, "activities"), newAct);
    } catch (e) {
      console.warn("Activity cloud sync deferred:", e);
    }
  }
}

// ==========================================================================
// Active User Switcher
// ==========================================================================
function setActiveUser(user) {
  if (!COLLABORATORS[user]) return;
  activeUser = user;
  localStorage.setItem(STORAGE_KEY_ACTIVE_USER, user);

  if (user === 'Tanvi') {
    userTanviBtn.classList.add('active-tanvi');
    userTanviBtn.setAttribute('aria-checked', 'true');
    userSaieBtn.classList.remove('active-saie');
    userSaieBtn.setAttribute('aria-checked', 'false');
    showToast('Switched to Tanvi (Collaborator 🌿)', 'tanvi');
  } else {
    userSaieBtn.classList.add('active-saie');
    userSaieBtn.setAttribute('aria-checked', 'true');
    userTanviBtn.classList.remove('active-tanvi');
    userTanviBtn.setAttribute('aria-checked', 'false');
    showToast('Switched to Saie (Collaborator ✨)', 'saie');
  }

  updateModalAuthorBadge();
  renderNotes();
}

function updateModalAuthorBadge() {
  const profile = COLLABORATORS[activeUser];
  modalAuthorIndicator.innerHTML = `
    <span class="author-pill ${profile.theme === 'tanvi' ? 'author-tanvi' : 'author-saie'}">
      <span class="avatar-xs ${profile.avatarClass}">${profile.initials}</span>
      <span>Creating as <strong>${profile.name}</strong></span>
    </span>
  `;
}

// ==========================================================================
// Toast Notification System
// ==========================================================================
function showToast(message, type = 'info', duration = 3400) {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;

  let icon = '🌿';
  if (type === 'saie') icon = '✨';
  if (type === 'tanvi') icon = '🌿';
  if (type === 'warning') icon = '⚠️';
  if (type === 'error') icon = '❌';

  toast.innerHTML = `<span>${icon}</span> <span>${escapeHtml(message)}</span>`;
  toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px) scale(0.96)';
    setTimeout(() => {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 250);
  }, duration);
}

// Helpers
function formatRelativeTime(isoString) {
  if (!isoString) return '';
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// ==========================================================================
// Progress and Metrics Calculation
// ==========================================================================
function updateProgressAndMetrics() {
  let totalTasks = 0;
  let completedTasks = 0;
  let totalComments = 0;
  let reviewNeededCount = 0;

  let tanviNotes = 0;
  let saieNotes = 0;
  let tanviTasksDone = 0;
  let saieTasksDone = 0;

  notes.forEach(note => {
    if (note.author === 'Tanvi') tanviNotes++;
    if (note.author === 'Saie') saieNotes++;

    if (note.status === 'review') reviewNeededCount++;

    if (Array.isArray(note.comments)) {
      totalComments += note.comments.length;
    }

    if (Array.isArray(note.tasks)) {
      note.tasks.forEach(t => {
        totalTasks++;
        if (t.completed) {
          completedTasks++;
          if (t.completedBy === 'Tanvi') tanviTasksDone++;
          if (t.completedBy === 'Saie') saieTasksDone++;
        }
      });
    }
  });

  const percentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  progressPercentageText.textContent = `${percentage}% Complete`;
  projectProgressBarFill.style.width = `${percentage}%`;
  projectProgressBarTrack.setAttribute('aria-valuenow', percentage);
  taskStatsCounter.textContent = `${completedTasks} of ${totalTasks} tasks completed across all notes`;

  tanviContribStats.textContent = `${tanviNotes} notes • ${tanviTasksDone} tasks done`;
  saieContribStats.textContent = `${saieNotes} notes • ${saieTasksDone} tasks done`;

  totalNotesMetric.textContent = notes.length;
  completedTasksMetric.textContent = completedTasks;
  totalCommentsMetric.textContent = totalComments;
  reviewNeededMetric.textContent = reviewNeededCount;
  activityBadgeCount.textContent = activities.length;
}

// ==========================================================================
// Notes Filtering & Sorting
// ==========================================================================
function getFilteredAndSortedNotes() {
  let list = [...notes];

  if (filterAuthor !== 'all') {
    list = list.filter(n => n.author === filterAuthor);
  }

  if (filterStatus !== 'all') {
    list = list.filter(n => n.status === filterStatus);
  }

  if (searchQuery.trim() !== '') {
    const q = searchQuery.toLowerCase().trim();
    list = list.filter(n => {
      const inTitle = n.title && n.title.toLowerCase().includes(q);
      const inContent = n.content && n.content.toLowerCase().includes(q);
      const inTags = n.tags && n.tags.some(t => t.toLowerCase().includes(q));
      const inTasks = n.tasks && n.tasks.some(t => t.text.toLowerCase().includes(q));
      const inComments = n.comments && n.comments.some(c => c.text.toLowerCase().includes(q) || c.author.toLowerCase().includes(q));
      return inTitle || inContent || inTags || inTasks || inComments;
    });
  }

  list.sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;

    if (sortBy === 'recent') {
      return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    } else if (sortBy === 'oldest') {
      return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
    } else if (sortBy === 'priority') {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      const pA = priorityOrder[a.priority] || 2;
      const pB = priorityOrder[b.priority] || 2;
      if (pB !== pA) return pB - pA;
      return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    } else if (sortBy === 'comments') {
      const cA = a.comments ? a.comments.length : 0;
      const cB = b.comments ? b.comments.length : 0;
      return cB - cA;
    }
    return 0;
  });

  return list;
}

// ==========================================================================
// Render Notes Grid
// ==========================================================================
function renderNotes() {
  const filteredNotes = getFilteredAndSortedNotes();
  notesCountPill.textContent = `Showing ${filteredNotes.length} of ${notes.length} notes`;

  if (filteredNotes.length === 0) {
    notesGrid.innerHTML = '';
    emptyState.style.display = 'block';
    const emptyTitle = emptyState.querySelector('.empty-state-title');
    const emptyText = emptyState.querySelector('.empty-state-text');
    if (notes.length === 0) {
      if (emptyTitle) emptyTitle.textContent = 'Welcome to your shared workspace!';
      if (emptyText) emptyText.textContent = 'Your workspace is clean and ready. Click "+ New Note" above to start adding project milestones, research findings, and tasks for Tanvi and Saie.';
    } else {
      if (emptyTitle) emptyTitle.textContent = 'No notes match your filter';
      if (emptyText) emptyText.textContent = 'No notes match your current search or author filter. Clear the search or reset filters to view notes.';
    }
    return;
  }

  emptyState.style.display = 'none';
  notesGrid.innerHTML = '';

  filteredNotes.forEach(note => {
    const card = createNoteCardElement(note);
    notesGrid.appendChild(card);
  });
}

function createNoteCardElement(note) {
  const card = document.createElement('article');
  const isTanvi = note.author === 'Tanvi';
  const authorClass = isTanvi ? 'authored-tanvi' : 'authored-saie';
  const authorBadgeClass = isTanvi ? 'author-tanvi' : 'author-saie';
  const authorAvatarClass = isTanvi ? 'avatar-tanvi' : 'avatar-saie';
  const authorInitials = isTanvi ? 'TM' : 'SN';
  const authorEmoji = isTanvi ? '🌿' : '✨';

  card.className = `note-card ${authorClass} ${note.pinned ? 'is-pinned' : ''}`;
  card.setAttribute('data-note-id', note.id);

  let statusLabel = 'In Progress';
  let statusClass = 'status-in-progress';
  if (note.status === 'review') {
    statusLabel = 'Needs Review';
    statusClass = 'status-review';
  } else if (note.status === 'completed') {
    statusLabel = 'Completed';
    statusClass = 'status-completed';
  } else if (note.status === 'idea') {
    statusLabel = 'Idea';
    statusClass = 'status-idea';
  }

  const tasks = note.tasks || [];
  const completedTasksCount = tasks.filter(t => t.completed).length;
  const taskPercent = tasks.length > 0 ? Math.round((completedTasksCount / tasks.length) * 100) : 0;

  const pinBadgeHtml = note.pinned
    ? `<div class="pin-indicator-badge">📌 Pinned</div>`
    : '';

  const tagsHtml = note.tags && note.tags.length > 0
    ? `<div class="note-tags-list">
        ${note.tags.map(tag => `<span class="tag-badge">#${escapeHtml(tag.trim())}</span>`).join('')}
      </div>`
    : '';

  let checklistHtml = '';
  if (tasks.length > 0) {
    checklistHtml = `
      <div class="note-checklist-section">
        <div class="checklist-progress-bar-wrap">
          <div class="checklist-mini-track">
            <div class="checklist-mini-fill" style="width: ${taskPercent}%;"></div>
          </div>
          <span class="checklist-fraction-text">${completedTasksCount}/${tasks.length} done (${taskPercent}%)</span>
        </div>
        <div class="checklist-items-list">
          ${tasks.map(task => `
            <label class="checklist-item-row ${task.completed ? 'completed' : ''}" data-task-id="${task.id}">
              <input type="checkbox" ${task.completed ? 'checked' : ''} data-note-id="${note.id}" data-task-id="${task.id}">
              <span class="task-text">${escapeHtml(task.text)}</span>
              ${task.completed && task.completedBy ? `
                <span class="task-completed-by-badge ${task.completedBy === 'Tanvi' ? 'task-by-tanvi' : 'task-by-saie'}">
                  ✓ ${task.completedBy}
                </span>
              ` : ''}
            </label>
          `).join('')}
        </div>
      </div>
    `;
  }

  const comments = note.comments || [];
  const commentsHtml = `
    <div class="note-comments-section">
      <div class="comments-header-toggle">
        <span class="comments-count-title">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
          Comments (${comments.length})
        </span>
        <span class="checklist-hint">Add thoughts as <strong>${activeUser}</strong></span>
      </div>

      <div class="comments-list">
        ${comments.map(comment => {
          const isCommentTanvi = comment.author === 'Tanvi';
          const commentCardClass = isCommentTanvi ? 'comment-tanvi' : 'comment-saie';
          const commentBadgeClass = isCommentTanvi ? 'badge-tanvi' : 'badge-saie';
          const commentAvatarClass = isCommentTanvi ? 'avatar-tanvi' : 'avatar-saie';
          const commentInitials = isCommentTanvi ? 'TM' : 'SN';

          return `
            <div class="comment-item ${commentCardClass}" data-comment-id="${comment.id}">
              <div class="comment-meta">
                <span class="comment-author-badge ${commentBadgeClass}">
                  <span class="avatar-xs ${commentAvatarClass}">${commentInitials}</span>
                  <span>${comment.author} ${isCommentTanvi ? '🌿' : '✨'}</span>
                </span>
                <span class="comment-time">${formatRelativeTime(comment.createdAt)}</span>
              </div>
              <div class="comment-text">${escapeHtml(comment.text)}</div>
              <div class="comment-actions-row">
                <span></span>
                <button type="button" class="btn-delete-comment" data-note-id="${note.id}" data-comment-id="${comment.id}" title="Delete comment">
                  Delete
                </button>
              </div>
            </div>
          `;
        }).join('')}
      </div>

      <form class="add-comment-form" data-note-id="${note.id}">
        <input type="text" class="add-comment-input" placeholder="Comment as ${activeUser}..." required maxlength="300">
        <button type="submit" class="btn-send-comment">Post</button>
      </form>
    </div>
  `;

  const reactionEmojis = ['👍', '❤️', '🌿', '✨', '💡', '🚀'];
  const reactions = note.reactions || {};
  const reactionsHtml = `
    <div class="emoji-reactions-bar">
      ${reactionEmojis.map(emoji => {
        const userList = reactions[emoji] || [];
        const count = userList.length;
        const hasReacted = userList.includes(activeUser);
        const tooltip = userList.length > 0 ? `Reacted by: ${userList.join(', ')}` : `Add ${emoji}`;
        return `
          <button type="button" class="emoji-reaction-pill ${hasReacted ? 'user-reacted' : ''}" 
                  data-note-id="${note.id}" data-emoji="${emoji}" title="${tooltip}">
            <span>${emoji}</span>
            ${count > 0 ? `<span>${count}</span>` : ''}
          </button>
        `;
      }).join('')}
    </div>
  `;

  card.innerHTML = `
    ${pinBadgeHtml}
    <div class="note-top-row">
      <div class="author-pill ${authorBadgeClass}">
        <span class="avatar-xs ${authorAvatarClass}">${authorInitials}</span>
        <span>${note.author} ${authorEmoji}</span>
      </div>
      <span class="note-status-badge ${statusClass}">${statusLabel}</span>
    </div>

    <h4 class="note-title">${escapeHtml(note.title)}</h4>
    <p class="note-body-text">${escapeHtml(note.content)}</p>

    ${tagsHtml}
    ${checklistHtml}
    ${reactionsHtml}
    ${commentsHtml}

    <div class="note-footer-row">
      <span class="note-meta-info">Updated ${formatRelativeTime(note.updatedAt || note.createdAt)}</span>
      <div class="note-actions-btns">
        <button type="button" class="btn-card-action ${note.pinned ? 'btn-pin-active' : ''}" data-action="pin" data-note-id="${note.id}" title="${note.pinned ? 'Unpin' : 'Pin to top'}">
          📌 ${note.pinned ? 'Unpin' : 'Pin'}
        </button>
        <button type="button" class="btn-card-action" data-action="edit" data-note-id="${note.id}" title="Edit note">
          ✏️ Edit
        </button>
        <button type="button" class="btn-card-action" data-action="delete" data-note-id="${note.id}" title="Delete note">
          🗑️ Delete
        </button>
      </div>
    </div>
  `;

  return card;
}

// ==========================================================================
// Activity Feed Drawer Render
// ==========================================================================
function renderActivities() {
  activityBadgeCount.textContent = activities.length;
  if (activities.length === 0) {
    activityTimeline.innerHTML = '<p class="drawer-subtitle" style="text-align:center; padding: 2rem 0;">No recorded activity yet.</p>';
    return;
  }

  activityTimeline.innerHTML = activities.map(act => {
    const isTanvi = act.user === 'Tanvi';
    const avatarClass = isTanvi ? 'avatar-tanvi' : 'avatar-saie';
    const initials = isTanvi ? 'TM' : 'SN';
    const emoji = isTanvi ? '🌿' : '✨';

    return `
      <div class="activity-item">
        <div class="activity-avatar ${avatarClass}">${initials}</div>
        <div class="activity-content">
          <div><strong>${act.user} ${emoji}</strong> ${escapeHtml(act.text)}</div>
          <div class="activity-time">${formatRelativeTime(act.time)}</div>
        </div>
      </div>
    `;
  }).join('');
}

// ==========================================================================
// Checklist Builder inside Modal
// ==========================================================================
function renderChecklistBuilder() {
  checklistBuilder.innerHTML = '';
  currentBuilderTasks.forEach((task, index) => {
    const row = document.createElement('div');
    row.className = 'builder-item-row';
    row.innerHTML = `
      <span class="builder-item-text">▫️ ${escapeHtml(task.text)}</span>
      <button type="button" class="btn-remove-builder-item" data-index="${index}" title="Remove task">&times;</button>
    `;
    checklistBuilder.appendChild(row);
  });
}

function addSubtaskToBuilder() {
  const text = newSubtaskInput.value.trim();
  if (!text) return;
  currentBuilderTasks.push({
    id: 't_' + Date.now() + '_' + Math.random().toString(36).substring(2, 5),
    text: text,
    completed: false
  });
  newSubtaskInput.value = '';
  renderChecklistBuilder();
}

// ==========================================================================
// Create / Edit Note Modal Management
// ==========================================================================
function openNoteModal(editId = null) {
  updateModalAuthorBadge();
  currentBuilderTasks = [];

  if (editId) {
    const note = notes.find(n => n.id === editId);
    if (!note) return;

    modalTitle.textContent = 'Edit Note';
    saveNoteBtnText.textContent = 'Update Note';
    noteEditId.value = note.id;
    noteTitleInput.value = note.title;
    noteStatusSelect.value = note.status;
    notePrioritySelect.value = note.priority || 'medium';
    noteTagsInput.value = (note.tags || []).join(', ');
    noteContentInput.value = note.content;
    notePinCheckbox.checked = !!note.pinned;

    currentBuilderTasks = (note.tasks || []).map(t => ({ ...t }));
  } else {
    modalTitle.textContent = 'Create New Note';
    saveNoteBtnText.textContent = 'Save Note';
    noteForm.reset();
    noteEditId.value = '';
    noteStatusSelect.value = 'in-progress';
    notePrioritySelect.value = 'medium';
    notePinCheckbox.checked = false;
    currentBuilderTasks = [];
  }

  renderChecklistBuilder();
  noteModal.showModal();
  noteTitleInput.focus();
}

function closeNoteModal() {
  noteModal.close();
  noteForm.reset();
  currentBuilderTasks = [];
}

async function handleSaveNoteSubmit(e) {
  e.preventDefault();
  const title = noteTitleInput.value.trim();
  const content = noteContentInput.value.trim();
  const status = noteStatusSelect.value;
  const priority = notePrioritySelect.value;
  const pinned = notePinCheckbox.checked;
  const tags = noteTagsInput.value
    .split(',')
    .map(t => t.trim())
    .filter(t => t.length > 0);

  if (!title || !content) {
    showToast('Please provide both a title and content', 'error');
    return;
  }

  const editId = noteEditId.value;
  const now = new Date().toISOString();

  if (editId) {
    // Edit existing note
    const updatedData = {
      title: title,
      content: content,
      status: status,
      priority: priority,
      pinned: pinned,
      tags: tags,
      tasks: currentBuilderTasks,
      updatedAt: now
    };

    // Optimistic local update
    const idx = notes.findIndex(n => n.id === editId);
    if (idx !== -1) {
      notes[idx] = { ...notes[idx], ...updatedData };
      saveNotesToLocalStorage();
    }

    if (db && isFirestoreLive) {
      try {
        await updateDoc(doc(db, "notes", editId), updatedData);
      } catch (err) {
        console.warn("Firestore update error:", err);
      }
    }

    logActivity(activeUser, `Updated note "${title}"`);
    showToast(`Updated "${title}"`, activeUser.toLowerCase());
  } else {
    // Create new note
    const newNoteData = {
      title: title,
      content: content,
      author: activeUser,
      status: status,
      priority: priority,
      pinned: pinned,
      tags: tags,
      tasks: currentBuilderTasks,
      comments: [],
      reactions: {},
      createdAt: now,
      updatedAt: now
    };

    if (db && isFirestoreLive) {
      try {
        await addDoc(collection(db, "notes"), newNoteData);
      } catch (err) {
        console.warn("Firestore addDoc notice:", err);
        newNoteData.id = 'note_' + Date.now();
        notes.unshift(newNoteData);
        saveNotesToLocalStorage();
      }
    } else {
      newNoteData.id = 'note_' + Date.now();
      notes.unshift(newNoteData);
      saveNotesToLocalStorage();
    }

    logActivity(activeUser, `Created new note "${title}"`);
    showToast(`Created note "${title}"`, activeUser.toLowerCase());
  }

  closeNoteModal();
  renderApp();
}

// ==========================================================================
// Note Actions: Delete, Pin, Checklist Toggle, Comments, Reactions
// ==========================================================================
function confirmDeleteNote(noteId) {
  const note = notes.find(n => n.id === noteId);
  if (!note) return;
  notePendingDeleteId = noteId;
  deleteNoteTitlePreview.textContent = `"${note.title}"`;
  deleteConfirmModal.showModal();
}

async function executeDeleteNote() {
  if (!notePendingDeleteId) return;
  const note = notes.find(n => n.id === notePendingDeleteId);
  const title = note ? note.title : 'note';

  // Optimistic local deletion
  notes = notes.filter(n => n.id !== notePendingDeleteId);
  saveNotesToLocalStorage();

  if (db && isFirestoreLive) {
    try {
      await deleteDoc(doc(db, "notes", notePendingDeleteId));
    } catch (err) {
      console.warn("Firestore deleteDoc error:", err);
    }
  }

  logActivity(activeUser, `Deleted note "${title}"`);
  showToast(`Deleted note "${title}"`, 'info');
  notePendingDeleteId = null;
  deleteConfirmModal.close();
  renderApp();
}

async function togglePinNote(noteId) {
  const note = notes.find(n => n.id === noteId);
  if (!note) return;
  note.pinned = !note.pinned;
  note.updatedAt = new Date().toISOString();

  saveNotesToLocalStorage();
  if (db && isFirestoreLive) {
    try {
      await updateDoc(doc(db, "notes", noteId), {
        pinned: note.pinned,
        updatedAt: note.updatedAt
      });
    } catch (err) {
      console.warn("Firestore pin update error:", err);
    }
  }

  logActivity(activeUser, `${note.pinned ? 'Pinned' : 'Unpinned'} note "${note.title}"`);
  showToast(`${note.pinned ? 'Pinned' : 'Unpinned'} note`, activeUser.toLowerCase());
  renderApp();
}

async function handleTaskCheckboxToggle(noteId, taskId, isChecked) {
  const note = notes.find(n => n.id === noteId);
  if (!note || !note.tasks) return;
  const task = note.tasks.find(t => t.id === taskId);
  if (!task) return;

  task.completed = isChecked;
  if (isChecked) {
    task.completedBy = activeUser;
    task.completedAt = new Date().toISOString();
    logActivity(activeUser, `Completed task "${task.text}" in "${note.title}"`);
    showToast(`Completed task: ${task.text}`, activeUser.toLowerCase());
  } else {
    task.completedBy = null;
    task.completedAt = null;
    logActivity(activeUser, `Unchecked task "${task.text}" in "${note.title}"`);
  }

  const allDone = note.tasks.length > 0 && note.tasks.every(t => t.completed);
  if (allDone && note.status !== 'completed') {
    note.status = 'completed';
    showToast(`All tasks finished! Marked "${note.title}" as completed`, 'info');
  }

  note.updatedAt = new Date().toISOString();
  saveNotesToLocalStorage();

  if (db && isFirestoreLive) {
    try {
      await updateDoc(doc(db, "notes", noteId), {
        tasks: note.tasks,
        status: note.status,
        updatedAt: note.updatedAt
      });
    } catch (err) {
      console.warn("Firestore task check error:", err);
    }
  }

  renderApp();
}

async function handleAddComment(noteId, text) {
  if (!text.trim()) return;
  const note = notes.find(n => n.id === noteId);
  if (!note) return;

  if (!note.comments) note.comments = [];

  const newComment = {
    id: 'c_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
    author: activeUser,
    text: text.trim(),
    createdAt: new Date().toISOString()
  };

  note.comments.push(newComment);
  note.updatedAt = new Date().toISOString();
  saveNotesToLocalStorage();

  if (db && isFirestoreLive) {
    try {
      await updateDoc(doc(db, "notes", noteId), {
        comments: note.comments,
        updatedAt: note.updatedAt
      });
    } catch (err) {
      console.warn("Firestore comment post error:", err);
    }
  }

  logActivity(activeUser, `Added comment on "${note.title}"`);
  showToast(`Comment added by ${activeUser}`, activeUser.toLowerCase());
  renderApp();
}

async function handleDeleteComment(noteId, commentId) {
  const note = notes.find(n => n.id === noteId);
  if (!note || !note.comments) return;

  note.comments = note.comments.filter(c => c.id !== commentId);
  note.updatedAt = new Date().toISOString();
  saveNotesToLocalStorage();

  if (db && isFirestoreLive) {
    try {
      await updateDoc(doc(db, "notes", noteId), {
        comments: note.comments,
        updatedAt: note.updatedAt
      });
    } catch (err) {
      console.warn("Firestore comment delete error:", err);
    }
  }

  logActivity(activeUser, `Removed a comment on "${note.title}"`);
  showToast('Comment removed', 'info');
  renderApp();
}

async function handleEmojiReaction(noteId, emoji) {
  const note = notes.find(n => n.id === noteId);
  if (!note) return;

  if (!note.reactions) note.reactions = {};
  if (!note.reactions[emoji]) note.reactions[emoji] = [];

  const userList = note.reactions[emoji];
  const userIndex = userList.indexOf(activeUser);

  if (userIndex !== -1) {
    userList.splice(userIndex, 1);
    if (userList.length === 0) delete note.reactions[emoji];
  } else {
    userList.push(activeUser);
    logActivity(activeUser, `Reacted with ${emoji} on "${note.title}"`);
  }

  saveNotesToLocalStorage();

  if (db && isFirestoreLive) {
    try {
      await updateDoc(doc(db, "notes", noteId), { reactions: note.reactions });
    } catch (err) {
      console.warn("Firestore reaction error:", err);
    }
  }

  renderApp();
}

// ==========================================================================
// Project Info Customization
// ==========================================================================
async function handleEditProjectName() {
  const newName = prompt('Enter project workspace name:', projectInfo.title);
  if (newName && newName.trim() && newName.trim() !== projectInfo.title) {
    projectInfo.title = newName.trim();
    projectNameHeading.textContent = projectInfo.title;
    saveProjectInfoToLocalStorage();

    if (db && isFirestoreLive) {
      try {
        await setDoc(doc(db, "projects", "main"), projectInfo);
      } catch (err) {
        console.warn("Firestore project rename error:", err);
      }
    }

    logActivity(activeUser, `Renamed project to "${projectInfo.title}"`);
    showToast('Project title updated', 'info');
  }
}

// ==========================================================================
// Export & Clear Data
// ==========================================================================
function exportWorkspaceData() {
  const exportBundle = {
    projectInfo: projectInfo,
    notes: notes,
    activities: activities,
    exportedAt: new Date().toISOString(),
    collaborators: ['Tanvi', 'Saie']
  };

  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(exportBundle, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute('href', dataStr);
  downloadAnchor.setAttribute('download', `tanvi_saie_workspace_${new Date().toISOString().slice(0, 10)}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();

  showToast('Workspace exported successfully!', 'info');
}

async function clearWorkspaceData() {
  if (confirm('Are you sure you want to erase all notes and activity history? This will empty your workspace and cloud database.')) {
    if (db && isFirestoreLive) {
      try {
        const notesSnaps = await getDocs(collection(db, "notes"));
        const batch = writeBatch(db);
        notesSnaps.forEach(d => batch.delete(d.ref));
        const actSnaps = await getDocs(collection(db, "activities"));
        actSnaps.forEach(d => batch.delete(d.ref));
        await batch.commit();
      } catch (err) {
        console.warn("Firestore batch clear notice:", err);
      }
    }

    notes = [];
    activities = [];
    saveNotesToLocalStorage();
    saveActivitiesToLocalStorage();
    showToast('Workspace cleared. Ready for your notes!', 'info');
    renderApp();
  }
}

// ==========================================================================
// Event Listeners Setup
// ==========================================================================
function setupEventListeners() {
  userTanviBtn.addEventListener('click', () => setActiveUser('Tanvi'));
  userSaieBtn.addEventListener('click', () => setActiveUser('Saie'));

  editProjectNameBtn.addEventListener('click', handleEditProjectName);

  openNewNoteModalBtn.addEventListener('click', () => openNoteModal(null));
  emptyStateNewNoteBtn.addEventListener('click', () => openNoteModal(null));
  closeNoteModalBtn.addEventListener('click', closeNoteModal);
  cancelNoteModalBtn.addEventListener('click', closeNoteModal);
  noteForm.addEventListener('submit', handleSaveNoteSubmit);

  addSubtaskBtn.addEventListener('click', addSubtaskToBuilder);
  newSubtaskInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addSubtaskToBuilder();
    }
  });

  checklistBuilder.addEventListener('click', (e) => {
    const removeBtn = e.target.closest('.btn-remove-builder-item');
    if (removeBtn) {
      const index = parseInt(removeBtn.getAttribute('data-index'), 10);
      if (!isNaN(index)) {
        currentBuilderTasks.splice(index, 1);
        renderChecklistBuilder();
      }
    }
  });

  openActivityBtn.addEventListener('click', () => {
    renderActivities();
    activityDrawer.showModal();
  });
  closeActivityDrawerBtn.addEventListener('click', () => activityDrawer.close());
  doneActivityDrawerBtn.addEventListener('click', () => activityDrawer.close());
  clearActivityHistoryBtn.addEventListener('click', async () => {
    if (confirm('Clear activity log history?')) {
      activities = [];
      saveActivitiesToLocalStorage();
      if (db && isFirestoreLive) {
        try {
          const actSnaps = await getDocs(collection(db, "activities"));
          const batch = writeBatch(db);
          actSnaps.forEach(d => batch.delete(d.ref));
          await batch.commit();
        } catch (e) {
          console.warn("Activity clear error:", e);
        }
      }
      renderActivities();
      showToast('Activity log cleared', 'info');
    }
  });

  cancelDeleteBtn.addEventListener('click', () => deleteConfirmModal.close());
  abortDeleteBtn.addEventListener('click', () => deleteConfirmModal.close());
  confirmDeleteSubmitBtn.addEventListener('click', executeDeleteNote);

  searchInput.addEventListener('input', (e) => {
    searchQuery = e.target.value;
    clearSearchBtn.style.display = searchQuery ? 'block' : 'none';
    renderNotes();
  });

  clearSearchBtn.addEventListener('click', () => {
    searchInput.value = '';
    searchQuery = '';
    clearSearchBtn.style.display = 'none';
    renderNotes();
    searchInput.focus();
  });

  authorFilter.addEventListener('change', (e) => {
    filterAuthor = e.target.value;
    renderNotes();
  });

  statusFilter.addEventListener('change', (e) => {
    filterStatus = e.target.value;
    renderNotes();
  });

  sortBySelect.addEventListener('change', (e) => {
    sortBy = e.target.value;
    renderNotes();
  });

  exportDataBtn.addEventListener('click', exportWorkspaceData);
  if (clearWorkspaceBtn) clearWorkspaceBtn.addEventListener('click', clearWorkspaceData);

  notesGrid.addEventListener('click', (e) => {
    const checkbox = e.target.closest('input[type="checkbox"]');
    if (checkbox && checkbox.hasAttribute('data-note-id')) {
      const noteId = checkbox.getAttribute('data-note-id');
      const taskId = checkbox.getAttribute('data-task-id');
      handleTaskCheckboxToggle(noteId, taskId, checkbox.checked);
      return;
    }

    const actionBtn = e.target.closest('.btn-card-action');
    if (actionBtn) {
      const action = actionBtn.getAttribute('data-action');
      const noteId = actionBtn.getAttribute('data-note-id');
      if (action === 'pin') togglePinNote(noteId);
      if (action === 'edit') openNoteModal(noteId);
      if (action === 'delete') confirmDeleteNote(noteId);
      return;
    }

    const reactionBtn = e.target.closest('.emoji-reaction-pill');
    if (reactionBtn) {
      const noteId = reactionBtn.getAttribute('data-note-id');
      const emoji = reactionBtn.getAttribute('data-emoji');
      handleEmojiReaction(noteId, emoji);
      return;
    }

    const deleteCommentBtn = e.target.closest('.btn-delete-comment');
    if (deleteCommentBtn) {
      const noteId = deleteCommentBtn.getAttribute('data-note-id');
      const commentId = deleteCommentBtn.getAttribute('data-comment-id');
      handleDeleteComment(noteId, commentId);
      return;
    }
  });

  notesGrid.addEventListener('submit', (e) => {
    const form = e.target.closest('.add-comment-form');
    if (form) {
      e.preventDefault();
      const noteId = form.getAttribute('data-note-id');
      const input = form.querySelector('.add-comment-input');
      if (input && input.value.trim()) {
        handleAddComment(noteId, input.value.trim());
        input.value = '';
      }
    }
  });

  // Cloud Sync Modal Listeners
  function openCloudModal() {
    const saved = localStorage.getItem(STORAGE_KEY_FIREBASE_CONFIG);
    if (saved) {
      try {
        firebaseConfigInput.value = JSON.stringify(JSON.parse(saved), null, 2);
      } catch (e) {
        firebaseConfigInput.value = saved;
      }
    } else if (activeFirebaseConfig) {
      firebaseConfigInput.value = JSON.stringify(activeFirebaseConfig, null, 2);
    } else {
      firebaseConfigInput.value = '';
    }
    firebaseConfigModal.showModal();
    firebaseConfigInput.focus();
  }

  if (openCloudConfigBtn) {
    openCloudConfigBtn.addEventListener('click', openCloudModal);
  }
  if (liveSyncStatus) {
    liveSyncStatus.addEventListener('click', openCloudModal);
  }
  if (closeCloudModalBtn) {
    closeCloudModalBtn.addEventListener('click', () => firebaseConfigModal.close());
  }
  if (cancelCloudModalBtn) {
    cancelCloudModalBtn.addEventListener('click', () => firebaseConfigModal.close());
  }
  if (resetCloudConfigBtn) {
    resetCloudConfigBtn.addEventListener('click', async () => {
      localStorage.removeItem(STORAGE_KEY_FIREBASE_CONFIG);
      firebaseConfigInput.value = '';
      clearFirestoreListeners();
      if (app) {
        try {
          await deleteApp(app);
        } catch (e) {
          console.warn('Error deleting Firebase app instance:', e);
        }
      }
      app = null;
      db = null;
      activeFirebaseConfig = null;
      isFirestoreLive = false;
      setSyncStatus('offline', 'Offline Mode • Click Cloud Sync');
      firebaseConfigModal.close();
      showToast('Cloud configuration cleared. Local offline storage active.', 'info');
    });
  }

  if (firebaseConfigForm) {
    firebaseConfigForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const rawText = firebaseConfigInput.value;
      const parsed = parseFirebaseConfig(rawText);
      if (!parsed) {
        showToast('Please paste a valid Firebase config snippet containing apiKey and projectId.', 'warning', 5000);
        return;
      }
      try {
        localStorage.setItem(STORAGE_KEY_FIREBASE_CONFIG, JSON.stringify(parsed));
        setSyncStatus('warning', 'Connecting to Cloud Firestore...');
        const connected = await connectFirebase(parsed);
        if (connected) {
          firebaseConfigModal.close();
          showToast(`Connected to Cloud Firestore (${parsed.projectId})! Live sync active.`, 'success', 4000);
        }
      } catch (err) {
        showToast('Error saving configuration: ' + err.message, 'warning');
      }
    });
  }

  [noteModal, deleteConfirmModal, activityDrawer, firebaseConfigModal].filter(Boolean).forEach(dialog => {
    dialog.addEventListener('click', (e) => {
      const rect = dialog.getBoundingClientRect();
      const isInDialog = (rect.top <= e.clientY && e.clientY <= rect.top + rect.height &&
        rect.left <= e.clientX && e.clientX <= rect.left + rect.width);
      if (!isInDialog) {
        dialog.close();
      }
    });
  });
}

// Master Render
function renderApp() {
  projectNameHeading.textContent = projectInfo.title;
  projectDesc.textContent = projectInfo.description;

  if (activeUser === 'Tanvi') {
    userTanviBtn.classList.add('active-tanvi');
    userTanviBtn.setAttribute('aria-checked', 'true');
    userSaieBtn.classList.remove('active-saie');
    userSaieBtn.setAttribute('aria-checked', 'false');
  } else {
    userSaieBtn.classList.add('active-saie');
    userSaieBtn.setAttribute('aria-checked', 'true');
    userTanviBtn.classList.remove('active-tanvi');
    userTanviBtn.setAttribute('aria-checked', 'false');
  }

  updateModalAuthorBadge();
  updateProgressAndMetrics();
  renderNotes();
  renderActivities();
}

// Boot
async function init() {
  loadStateFromLocalStorage();
  setupEventListeners();
  renderApp();

  const { config, source } = await resolveFirebaseConfig();
  if (config) {
    console.log(`Initializing Firebase from ${source} (${config.projectId})...`);
    await connectFirebase(config);
  } else {
    setSyncStatus('offline', 'Offline Mode • Click Cloud Sync');
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
