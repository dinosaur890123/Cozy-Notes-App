/* Cozy Notes App — September Vibes */
(function () {
  const q = (s, r = document) => r.querySelector(s);
  const qa = (s, r = document) => Array.from(r.querySelectorAll(s));

  const state = {
    notes: [],
    activeId: null,
    search: '',
  };

  const els = {
    parallaxBg: q('#parallax-bg'),
    leavesLayer: q('#leaves-layer'),
    notesList: q('#notesList'),
    newNoteBtn: q('#newNoteBtn'),
    searchInput: q('#searchInput'),
    titleInput: q('#titleInput'),
    contentInput: q('#contentInput'),
    previewOutput: q('#previewOutput'),
    pinBtn: q('#pinBtn'),
    deleteBtn: q('#deleteBtn'),
    editorBody: q('#editorBody'),
    viewSplitBtn: q('#viewSplitBtn'),
    viewEditorBtn: q('#viewEditorBtn'),
    viewPreviewBtn: q('#viewPreviewBtn'),
  };

  // Storage
  const STORAGE_KEY = 'cozy-notes-v1';
  const save = () => localStorage.setItem(STORAGE_KEY, JSON.stringify(state.notes));
  const load = () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const list = JSON.parse(raw);
      return Array.isArray(list) ? list : [];
    } catch (e) {
      console.warn('Storage parse failed', e);
      return [];
    }
  };

  // Utils
  const uid = () => Math.random().toString(36).slice(2, 9);
  const now = () => new Date().toISOString();
  const fmtDate = (iso) => new Date(iso).toLocaleString();

  // Leaves background
  function createLeafElement(hue, delayMs) {
    const leaf = document.createElement('div');
    leaf.className = 'leaf';
    leaf.style.setProperty('--x', (Math.random() * window.innerWidth - 40) + 'px');
    const drift = (Math.random() * 140 - 70);
    leaf.style.setProperty('--xEnd', (drift) + 'px');

    const dur = 9 + Math.random() * 9; // 9-18s fall
    leaf.style.animation = `fall ${dur}s linear ${delayMs}ms forwards, sway ${5 + Math.random() * 4}s ease-in-out ${delayMs}ms infinite`;

    const fill = `hsl(${hue}, 65%, ${60 + Math.random() * 12}%)`;
    leaf.innerHTML = `
      <svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 8c10 2 22 6 30 14s12 20 6 26-20 2-28-6S10 18 12 8z" fill="${fill}" />
        <path d="M12 8c8 8 16 16 24 24" stroke="rgba(0,0,0,0.25)" stroke-width="2" fill="none"/>
      </svg>
    `;
    return leaf;
  }

  function spawnLeaves() {
    const targetCount = Math.min(26, Math.max(12, Math.round(window.innerWidth / 60)));
    const current = els.leavesLayer.childElementCount;
    const toAdd = Math.max(0, targetCount - current);
    for (let i = 0; i < toAdd; i++) {
      const hue = 18 + Math.random() * 35; // orange to amber range
      const delay = Math.random() * 4000; // faster initial start for new leaves
      const leaf = createLeafElement(hue, delay);
      els.leavesLayer.appendChild(leaf);
      // Cleanup when finished falling
      setTimeout(() => leaf.remove(), 20000 + delay);
    }
    // Keep population stable by checking frequently
    setTimeout(spawnLeaves, 1500);
  }

  // Notes logic
  function sortNotes(a, b) {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return new Date(b.updatedAt) - new Date(a.updatedAt);
  }

  function filteredNotes() {
    const term = state.search.trim().toLowerCase();
    if (!term) return [...state.notes].sort(sortNotes);
    return state.notes.filter(n =>
      (n.title || '').toLowerCase().includes(term) ||
      (n.content || '').toLowerCase().includes(term)
    ).sort(sortNotes);
  }

  function renderList() {
    const list = filteredNotes();
    els.notesList.innerHTML = '';
    list.forEach(n => {
      const li = document.createElement('li');
      li.dataset.id = n.id;
      li.className = n.id === state.activeId ? 'active' : '';
      const preview = (n.content || '').replace(/\n/g, ' ').slice(0, 80);
      const pinIcon = n.pinned ? `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="var(--accent)" stroke="var(--bg)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>` : '';
      li.innerHTML = `
        <div class="note-title">${pinIcon} ${n.title || 'Untitled'}</div>
        <div class="note-preview">${preview}</div>
        <div class="note-meta"><span>${fmtDate(n.updatedAt)}</span><span>${(n.content || '').length} chars</span></div>
      `;
      li.addEventListener('click', () => selectNote(n.id));
      els.notesList.appendChild(li);
    });
  }

  function selectNote(id) {
    state.activeId = id;
    const note = state.notes.find(n => n.id === id);
    if (!note) return;
    els.titleInput.value = note.title || '';
    els.contentInput.value = note.content || '';
    els.previewOutput.innerHTML = marked.parse(note.content || '');
    els.pinBtn.classList.toggle('active', !!note.pinned);
    renderList();
  }

  function createNote() {
    const n = { id: uid(), title: 'New note', content: '', pinned: false, createdAt: now(), updatedAt: now() };
    state.notes.unshift(n);
    save();
    renderList();
    selectNote(n.id);
    els.titleInput.focus();
  }

  function deleteActive() {
    if (!state.activeId) return;
    
    const noteEl = q(`[data-id="${state.activeId}"]`);
    const performDelete = () => {
        const i = state.notes.findIndex(n => n.id === state.activeId);
        if (i === -1) return;

        state.notes.splice(i, 1);
        state.activeId = state.notes[0]?.id || null;
        save();
        renderList();
        if (state.activeId) {
            selectNote(state.activeId);
        } else {
            els.titleInput.value = '';
            els.contentInput.value = '';
            els.previewOutput.innerHTML = '';
        }
    };

    if (noteEl) {
        noteEl.style.animation = 'fade-out 0.3s forwards';
        setTimeout(performDelete, 300);
    } else {
        performDelete();
    }
  }

  function togglePin() {
    const note = state.notes.find(n => n.id === state.activeId);
    if (!note) return;
    note.pinned = !note.pinned;
    note.updatedAt = now();
    save();
    renderList();
    selectNote(note.id);
  }

  function autosave() {
    const note = state.notes.find(n => n.id === state.activeId);
    if (!note) return;
    note.title = els.titleInput.value.trim();
    note.content = els.contentInput.value;
    els.previewOutput.innerHTML = marked.parse(note.content);
    note.updatedAt = now();
    save();
    renderList();
  }

  function ensureInitialNote() {
    state.notes = load();
    if (state.notes.length === 0) {
      state.notes = [
        {
          id: uid(),
          title: 'Welcome to Cozy Notes',
          content: 'It\'s September. The air is crisp, coffee is warm, and your thoughts deserve a soft place to land.\n\nCreate a new note with the + button. Pin important notes with the pin icon. Your notes are saved automatically in your browser.',
          pinned: true,
          createdAt: now(),
          updatedAt: now(),
        },
      ];
      save();
    }
    state.activeId = state.notes[0].id;
  }

  function setViewMode(mode) {
      els.editorBody.className = 'editor-body';
      // Using a timeout to allow the class removal to register before adding the new one, ensuring transition fires
      setTimeout(() => {
        els.editorBody.classList.add(mode);
      }, 0);

      const currentActive = q('.view-controls .btn.active');
      if(currentActive) currentActive.classList.remove('active');
      
      let targetBtn;
      if (mode === 'split') targetBtn = els.viewSplitBtn;
      if (mode === 'editor-only') targetBtn = els.viewEditorBtn;
      if (mode === 'preview-only') targetBtn = els.viewPreviewBtn;
      
      if(targetBtn) targetBtn.classList.add('active');
  }

  // Wire events
  function wire() {
    els.newNoteBtn.addEventListener('click', createNote);
    els.deleteBtn.addEventListener('click', deleteActive);
    els.pinBtn.addEventListener('click', togglePin);
    els.searchInput.addEventListener('input', (e) => {
      state.search = e.target.value;
      renderList();
    });

    els.viewSplitBtn.addEventListener('click', () => setViewMode('split'));
    els.viewEditorBtn.addEventListener('click', () => setViewMode('editor-only'));
    els.viewPreviewBtn.addEventListener('click', () => setViewMode('preview-only'));

    window.addEventListener('mousemove', handleMouseMove);

    let t1, t2;
    els.titleInput.addEventListener('input', () => { clearTimeout(t1); t1 = setTimeout(autosave, 300); });
    els.contentInput.addEventListener('input', () => { clearTimeout(t2); t2 = setTimeout(autosave, 300); });
  }

  // Init
  function init() {
    ensureInitialNote();
    renderList();
    selectNote(state.activeId);
    setViewMode('split');
    spawnLeaves();
    wire();
  }

  init();
})();
