/**
 * Tanvi & Saie • Project Notes & Progress Workspace
 * Logic, State Management, Author Attribution, Comments & Checklists
 */

(function () {
  'use strict';

  // Constants & Storage Keys
  const STORAGE_KEY_NOTES = 'tanvi_saie_notes_v2';
  const STORAGE_KEY_ACTIVITY = 'tanvi_saie_activity_v2';
  const STORAGE_KEY_PROJECT = 'tanvi_saie_project_info_v2';
  const STORAGE_KEY_ACTIVE_USER = 'tanvi_saie_active_user';

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

  // Broadcast Channel for live cross-tab sync
  let syncChannel = null;
  if ('BroadcastChannel' in window) {
    try {
      syncChannel = new BroadcastChannel('tanvi_saie_sync_channel');
      syncChannel.onmessage = (event) => {
        if (event.data && event.data.type === 'STATE_UPDATED') {
          loadStateFromStorage();
          renderApp();
          showToast('Updated from another tab 🔄', 'info', 2000);
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

  // ==========================================================================
  // Storage & State Synchronization (Initialized as clean workspace)
  // ==========================================================================
  function loadStateFromStorage() {
    try {
      // Clear legacy sample data
      localStorage.removeItem('tanvi_saie_notes_v1');
      localStorage.removeItem('tanvi_saie_activity_v1');
      localStorage.removeItem('tanvi_saie_project_info_v1');

      const storedNotes = localStorage.getItem(STORAGE_KEY_NOTES);
      if (storedNotes !== null) {
        notes = JSON.parse(storedNotes);
      } else {
        notes = [];
        saveNotesToStorage(false);
      }

      const storedActivity = localStorage.getItem(STORAGE_KEY_ACTIVITY);
      if (storedActivity !== null) {
        activities = JSON.parse(storedActivity);
      } else {
        activities = [];
        saveActivitiesToStorage(false);
      }

      const storedProject = localStorage.getItem(STORAGE_KEY_PROJECT);
      if (storedProject !== null) {
        projectInfo = JSON.parse(storedProject);
      } else {
        saveProjectInfoToStorage();
      }

      const storedActiveUser = localStorage.getItem(STORAGE_KEY_ACTIVE_USER);
      if (storedActiveUser && COLLABORATORS[storedActiveUser]) {
        activeUser = storedActiveUser;
      }
    } catch (e) {
      console.error('Error loading state from localStorage:', e);
      notes = [];
      activities = [];
    }
  }

  function saveNotesToStorage(broadcast = true) {
    try {
      localStorage.setItem(STORAGE_KEY_NOTES, JSON.stringify(notes));
      if (broadcast && syncChannel) {
        syncChannel.postMessage({ type: 'STATE_UPDATED', timestamp: Date.now() });
      }
    } catch (e) {
      console.error('Failed to save notes:', e);
    }
  }

  function saveActivitiesToStorage(broadcast = true) {
    try {
      localStorage.setItem(STORAGE_KEY_ACTIVITY, JSON.stringify(activities));
      if (broadcast && syncChannel) {
        syncChannel.postMessage({ type: 'STATE_UPDATED', timestamp: Date.now() });
      }
    } catch (e) {
      console.error('Failed to save activities:', e);
    }
  }

  function saveProjectInfoToStorage() {
    try {
      localStorage.setItem(STORAGE_KEY_PROJECT, JSON.stringify(projectInfo));
      if (syncChannel) {
        syncChannel.postMessage({ type: 'STATE_UPDATED', timestamp: Date.now() });
      }
    } catch (e) {
      console.error('Failed to save project info:', e);
    }
  }

  function logActivity(user, text) {
    const newAct = {
      id: 'act_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      user: user,
      text: text,
      time: new Date().toISOString()
    };
    activities.unshift(newAct);
    if (activities.length > 50) activities.pop();
    saveActivitiesToStorage();
    renderActivities();
  }

  // Cross-tab storage event listener
  window.addEventListener('storage', (e) => {
    if (e.key === STORAGE_KEY_NOTES || e.key === STORAGE_KEY_ACTIVITY || e.key === STORAGE_KEY_PROJECT) {
      loadStateFromStorage();
      renderApp();
    }
  });

  // ==========================================================================
  // Active User Switcher
  // ==========================================================================
  function setActiveUser(user) {
    if (!COLLABORATORS[user]) return;
    activeUser = user;
    localStorage.setItem(STORAGE_KEY_ACTIVE_USER, user);

    // Update switcher buttons
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
  function showToast(message, type = 'info', duration = 3200) {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    let icon = '🌿';
    if (type === 'saie') icon = '✨';
    if (type === 'tanvi') icon = '🌿';
    if (type === 'error') icon = '⚠️';

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

  // ==========================================================================
  // Time Formatting Helper
  // ==========================================================================
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
  // Calculations & Progress Statistics
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

    // Update Project Progress UI
    progressPercentageText.textContent = `${percentage}% Complete`;
    projectProgressBarFill.style.width = `${percentage}%`;
    projectProgressBarTrack.setAttribute('aria-valuenow', percentage);
    taskStatsCounter.textContent = `${completedTasks} of ${totalTasks} tasks completed across all notes`;

    // Collaborators quick stats
    tanviContribStats.textContent = `${tanviNotes} notes • ${tanviTasksDone} tasks done`;
    saieContribStats.textContent = `${saieNotes} notes • ${saieTasksDone} tasks done`;

    // Metrics Grid
    totalNotesMetric.textContent = notes.length;
    completedTasksMetric.textContent = completedTasks;
    totalCommentsMetric.textContent = totalComments;
    reviewNeededMetric.textContent = reviewNeededCount;

    // Activity badge
    activityBadgeCount.textContent = activities.length;
  }

  // ==========================================================================
  // Notes Filtering & Sorting
  // ==========================================================================
  function getFilteredAndSortedNotes() {
    let list = [...notes];

    // Author filter
    if (filterAuthor !== 'all') {
      list = list.filter(n => n.author === filterAuthor);
    }

    // Status filter
    if (filterStatus !== 'all') {
      list = list.filter(n => n.status === filterStatus);
    }

    // Search filter
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

    // Sorting
    list.sort((a, b) => {
      // Pinned always on top
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

    // Status formatting
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

    // Tasks calculation
    const tasks = note.tasks || [];
    const completedTasksCount = tasks.filter(t => t.completed).length;
    const taskPercent = tasks.length > 0 ? Math.round((completedTasksCount / tasks.length) * 100) : 0;

    // Pin badge
    const pinBadgeHtml = note.pinned
      ? `<div class="pin-indicator-badge">📌 Pinned</div>`
      : '';

    // Tags HTML
    const tagsHtml = note.tags && note.tags.length > 0
      ? `<div class="note-tags-list">
          ${note.tags.map(tag => `<span class="tag-badge">#${escapeHtml(tag.trim())}</span>`).join('')}
        </div>`
      : '';

    // Checklist HTML
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

    // Comments HTML
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

        <!-- Add Comment Form -->
        <form class="add-comment-form" data-note-id="${note.id}">
          <input type="text" class="add-comment-input" placeholder="Comment as ${activeUser}..." required maxlength="300">
          <button type="submit" class="btn-send-comment">Post</button>
        </form>
      </div>
    `;

    // Emoji Reactions HTML
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

    // Assemble Card innerHTML
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
  // Checklists Builder inside Modal
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
  // ==========================================================
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

      // Duplicate tasks to avoid mutating prematurely
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

  function handleSaveNoteSubmit(e) {
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
      const index = notes.findIndex(n => n.id === editId);
      if (index !== -1) {
        notes[index].title = title;
        notes[index].content = content;
        notes[index].status = status;
        notes[index].priority = priority;
        notes[index].pinned = pinned;
        notes[index].tags = tags;
        notes[index].tasks = currentBuilderTasks;
        notes[index].updatedAt = now;

        logActivity(activeUser, `Updated note "${title}"`);
        showToast(`Updated "${title}"`, activeUser.toLowerCase());
      }
    } else {
      // Create new note authored by activeUser
      const newNote = {
        id: 'note_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        title: title,
        content: content,
        author: activeUser, // Explicit author attribution
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
      notes.unshift(newNote);

      logActivity(activeUser, `Created new note "${title}"`);
      showToast(`Created note "${title}"`, activeUser.toLowerCase());
    }

    saveNotesToStorage();
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

  function executeDeleteNote() {
    if (!notePendingDeleteId) return;
    const note = notes.find(n => n.id === notePendingDeleteId);
    if (note) {
      notes = notes.filter(n => n.id !== notePendingDeleteId);
      saveNotesToStorage();
      logActivity(activeUser, `Deleted note "${note.title}"`);
      showToast(`Deleted note "${note.title}"`, 'info');
      renderApp();
    }
    notePendingDeleteId = null;
    deleteConfirmModal.close();
  }

  function togglePinNote(noteId) {
    const note = notes.find(n => n.id === noteId);
    if (!note) return;
    note.pinned = !note.pinned;
    note.updatedAt = new Date().toISOString();
    saveNotesToStorage();
    logActivity(activeUser, `${note.pinned ? 'Pinned' : 'Unpinned'} note "${note.title}"`);
    showToast(`${note.pinned ? 'Pinned' : 'Unpinned'} note`, activeUser.toLowerCase());
    renderApp();
  }

  function handleTaskCheckboxToggle(noteId, taskId, isChecked) {
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

    // Auto-update note status if all tasks are complete
    const allDone = note.tasks.length > 0 && note.tasks.every(t => t.completed);
    if (allDone && note.status !== 'completed') {
      note.status = 'completed';
      showToast(`All tasks finished! Marked "${note.title}" as completed`, 'info');
    }

    note.updatedAt = new Date().toISOString();
    saveNotesToStorage();
    renderApp();
  }

  function handleAddComment(noteId, text) {
    if (!text.trim()) return;
    const note = notes.find(n => n.id === noteId);
    if (!note) return;

    if (!note.comments) note.comments = [];

    const newComment = {
      id: 'c_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      author: activeUser, // Explicit author distinction
      text: text.trim(),
      createdAt: new Date().toISOString()
    };

    note.comments.push(newComment);
    note.updatedAt = new Date().toISOString();
    saveNotesToStorage();

    logActivity(activeUser, `Added comment on "${note.title}"`);
    showToast(`Comment added by ${activeUser}`, activeUser.toLowerCase());
    renderApp();
  }

  function handleDeleteComment(noteId, commentId) {
    const note = notes.find(n => n.id === noteId);
    if (!note || !note.comments) return;

    note.comments = note.comments.filter(c => c.id !== commentId);
    note.updatedAt = new Date().toISOString();
    saveNotesToStorage();

    logActivity(activeUser, `Removed a comment on "${note.title}"`);
    showToast('Comment removed', 'info');
    renderApp();
  }

  function handleEmojiReaction(noteId, emoji) {
    const note = notes.find(n => n.id === noteId);
    if (!note) return;

    if (!note.reactions) note.reactions = {};
    if (!note.reactions[emoji]) note.reactions[emoji] = [];

    const userList = note.reactions[emoji];
    const userIndex = userList.indexOf(activeUser);

    if (userIndex !== -1) {
      // Remove reaction
      userList.splice(userIndex, 1);
      if (userList.length === 0) delete note.reactions[emoji];
    } else {
      // Add reaction
      userList.push(activeUser);
      logActivity(activeUser, `Reacted with ${emoji} on "${note.title}"`);
    }

    saveNotesToStorage();
    renderApp();
  }

  // ==========================================================================
  // Project Info Customization
  // ==========================================================================
  function handleEditProjectName() {
    const newName = prompt('Enter project workspace name:', projectInfo.title);
    if (newName && newName.trim() && newName.trim() !== projectInfo.title) {
      projectInfo.title = newName.trim();
      projectNameHeading.textContent = projectInfo.title;
      saveProjectInfoToStorage();
      logActivity(activeUser, `Renamed project to "${projectInfo.title}"`);
      showToast('Project title updated', 'info');
    }
  }

  // ==========================================================================
  // Export & Reset Data
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

  function clearWorkspaceData() {
    if (confirm('Are you sure you want to erase all notes and activity history? This will empty your workspace.')) {
      notes = [];
      activities = [];
      saveNotesToStorage();
      saveActivitiesToStorage();
      showToast('Workspace cleared. Ready for your notes!', 'info');
      renderApp();
    }
  }

  // ==========================================================================
  // Event Delegations & Listeners
  // ==========================================================================
  function setupEventListeners() {
    // Profile Switcher
    userTanviBtn.addEventListener('click', () => setActiveUser('Tanvi'));
    userSaieBtn.addEventListener('click', () => setActiveUser('Saie'));

    // Project Name Editing
    editProjectNameBtn.addEventListener('click', handleEditProjectName);

    // Note Modal triggers
    openNewNoteModalBtn.addEventListener('click', () => openNoteModal(null));
    emptyStateNewNoteBtn.addEventListener('click', () => openNoteModal(null));
    closeNoteModalBtn.addEventListener('click', closeNoteModal);
    cancelNoteModalBtn.addEventListener('click', closeNoteModal);
    noteForm.addEventListener('submit', handleSaveNoteSubmit);

    // Checklist Subtask Builder in Modal
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

    // Activity Drawer
    openActivityBtn.addEventListener('click', () => {
      renderActivities();
      activityDrawer.showModal();
    });
    closeActivityDrawerBtn.addEventListener('click', () => activityDrawer.close());
    doneActivityDrawerBtn.addEventListener('click', () => activityDrawer.close());
    clearActivityHistoryBtn.addEventListener('click', () => {
      if (confirm('Clear activity log history?')) {
        activities = [];
        saveActivitiesToStorage();
        renderActivities();
        showToast('Activity log cleared', 'info');
      }
    });

    // Delete Modal
    cancelDeleteBtn.addEventListener('click', () => deleteConfirmModal.close());
    abortDeleteBtn.addEventListener('click', () => deleteConfirmModal.close());
    confirmDeleteSubmitBtn.addEventListener('click', executeDeleteNote);

    // Search and Filters
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

    // Workspace utilities
    exportDataBtn.addEventListener('click', exportWorkspaceData);
    if (clearWorkspaceBtn) clearWorkspaceBtn.addEventListener('click', clearWorkspaceData);

    // Global Notes Grid Click Delegation
    notesGrid.addEventListener('click', (e) => {
      // 1. Checklist checkbox
      const checkbox = e.target.closest('input[type="checkbox"]');
      if (checkbox && checkbox.hasAttribute('data-note-id')) {
        const noteId = checkbox.getAttribute('data-note-id');
        const taskId = checkbox.getAttribute('data-task-id');
        handleTaskCheckboxToggle(noteId, taskId, checkbox.checked);
        return;
      }

      // 2. Card action buttons: pin, edit, delete
      const actionBtn = e.target.closest('.btn-card-action');
      if (actionBtn) {
        const action = actionBtn.getAttribute('data-action');
        const noteId = actionBtn.getAttribute('data-note-id');
        if (action === 'pin') togglePinNote(noteId);
        if (action === 'edit') openNoteModal(noteId);
        if (action === 'delete') confirmDeleteNote(noteId);
        return;
      }

      // 3. Emoji reactions
      const reactionBtn = e.target.closest('.emoji-reaction-pill');
      if (reactionBtn) {
        const noteId = reactionBtn.getAttribute('data-note-id');
        const emoji = reactionBtn.getAttribute('data-emoji');
        handleEmojiReaction(noteId, emoji);
        return;
      }

      // 4. Delete comment
      const deleteCommentBtn = e.target.closest('.btn-delete-comment');
      if (deleteCommentBtn) {
        const noteId = deleteCommentBtn.getAttribute('data-note-id');
        const commentId = deleteCommentBtn.getAttribute('data-comment-id');
        handleDeleteComment(noteId, commentId);
        return;
      }
    });

    // Notes Grid Form Submit Delegation (Add Comment)
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

    // Light dismiss for native dialogs
    [noteModal, deleteConfirmModal, activityDrawer].forEach(dialog => {
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

  // ==========================================================================
  // Master Render
  // ==========================================================================
  function renderApp() {
    projectNameHeading.textContent = projectInfo.title;
    projectDesc.textContent = projectInfo.description;

    // Apply active user selection state
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

  // Initialize
  function init() {
    loadStateFromStorage();
    setupEventListeners();
    renderApp();
  }

  // Boot on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
