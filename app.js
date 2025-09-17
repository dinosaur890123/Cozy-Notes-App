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
    snackbar: q('#snackbar'),
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

  // Parallax background: update CSS variables based on mouse position
  let rafId = null;
  let mouseX = 0, mouseY = 0;
  function updateParallaxVars() {
    rafId = null;
    // Apply values in pixels; CSS uses them in calc() for subtle movement
    if (els.parallaxBg) {
      els.parallaxBg.style.setProperty('--mouse-x', mouseX.toFixed(1) + 'px');
      els.parallaxBg.style.setProperty('--mouse-y', mouseY.toFixed(1) + 'px');
    }
  }
  function handleMouseMove(e) {
    // Center the origin so movement is symmetric around viewport center
    mouseX = e.clientX - window.innerWidth / 2;
    mouseY = e.clientY - window.innerHeight / 2;
    if (!rafId) rafId = requestAnimationFrame(updateParallaxVars);
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

  // Highlight helper for search term in list (safe: escapes HTML first)
  function escapeHTML(s = '') {
    return s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }
  function highlight(text = '', term = '') {
    const safe = escapeHTML(text);
    const t = term.trim();
    if (!t) return safe;
    const esc = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp(`(${esc(t)})`, 'ig');
    return safe.replace(re, '<mark>$1</mark>');
  }

  function renderList() {
    const list = filteredNotes();
    els.notesList.innerHTML = '';
    const term = state.search.trim();
    list.forEach(n => {
      const li = document.createElement('li');
      li.dataset.id = n.id;
      li.className = n.id === state.activeId ? 'active' : '';
      const rawPreview = (n.content || '').replace(/\n/g, ' ').slice(0, 80);
      const preview = highlight(rawPreview, term);
      const titleHtml = highlight(n.title || 'Untitled', term);
      const pinIcon = n.pinned ? `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="var(--accent)" stroke="var(--bg)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>` : '';
      li.innerHTML = `
        <div class="note-title">${pinIcon} ${titleHtml}</div>
        <div class="note-preview">${preview}</div>
        <div class="note-meta"><span>${fmtDate(n.updatedAt)}</span><span>${(n.content || '').length} chars</span></div>
      `;
      li.addEventListener('click', () => selectNote(n.id));
      els.notesList.appendChild(li);
    });
  }

  function selectNote(id) {
    // Guard: if selecting the same note, do nothing
    if (state.activeId === id) return;

    const next = state.notes.find(n => n.id === id);
    if (!next) return;

    // Cancel any ongoing swap timers
    if (selectNote._swapTimer) {
      clearTimeout(selectNote._swapTimer);
      selectNote._swapTimer = null;
    }

    // Add swap-out animations
    els.titleInput.classList.remove('swap-in');
    els.contentInput.classList.remove('swap-in');
    els.previewOutput.classList.remove('swap-in');
    els.titleInput.classList.add('swap-out');
    els.contentInput.classList.add('swap-out');
    els.previewOutput.classList.add('swap-out');

    // After swap-out completes, swap content and animate in
    selectNote._swapTimer = setTimeout(() => {
      state.activeId = id;
      els.titleInput.value = next.title || '';
      els.contentInput.value = next.content || '';
      const html = marked.parse(next.content || '');
      els.previewOutput.innerHTML = (window.DOMPurify ? DOMPurify.sanitize(html) : html);
      els.pinBtn.classList.toggle('active', !!next.pinned);
      els.previewOutput.scrollTop = 0;

      // switch to swap-in
      els.titleInput.classList.remove('swap-out');
      els.contentInput.classList.remove('swap-out');
      els.previewOutput.classList.remove('swap-out');
      // Force reflow to ensure animations restart
      void els.titleInput.offsetWidth;
      els.titleInput.classList.add('swap-in');
      els.contentInput.classList.add('swap-in');
      els.previewOutput.classList.add('swap-in');

      // Cleanup swap-in classes after animation
      const cleanup = (el) => el.addEventListener('animationend', () => el.classList.remove('swap-in'), { once: true });
      cleanup(els.titleInput);
      cleanup(els.contentInput);
      cleanup(els.previewOutput);

      renderList();
      selectNote._swapTimer = null;
    }, 140); // match CSS swap-out duration
  }

  function createNote() {
    const n = { id: uid(), title: 'New note', content: '', pinned: false, createdAt: now(), updatedAt: now() };
    state.notes.unshift(n);
    save();
    renderList();
    // Animate only the newly inserted element to avoid flashing
    const li = els.notesList.querySelector(`li[data-id="${n.id}"]`);
    if (li) {
      li.classList.add('enter');
      li.addEventListener('animationend', () => li.classList.remove('enter'), { once: true });
    }
    selectNote(n.id);
    els.titleInput.focus();
  }

  function deleteActive() {
    if (!state.activeId) return;
    
    const noteEl = q(`[data-id="${state.activeId}"]`);
  const performDelete = () => {
    const i = state.notes.findIndex(n => n.id === state.activeId);
    if (i === -1) return;

    const removed = state.notes.splice(i, 1)[0];
    const nextActiveId = state.notes[0]?.id || null;
    state.activeId = nextActiveId;
    save();
    renderList();
    if (state.activeId) {
      selectNote(state.activeId);
    } else {
      els.titleInput.value = '';
      els.contentInput.value = '';
      els.previewOutput.innerHTML = '';
    }

    // Show snackbar with Undo
    showSnackbar(`Deleted "${removed.title || 'Untitled'}"`, () => {
      // Undo: restore note at same index
      state.notes.splice(i, 0, removed);
      state.activeId = removed.id;
      save();
      renderList();
      selectNote(removed.id);
    });
  };

    if (noteEl) {
        noteEl.style.animation = 'fade-out 0.3s forwards';
        setTimeout(performDelete, 300);
    } else {
        performDelete();
    }
  }

  // Snackbar helper
  let snackbarTimer = null;
  function showSnackbar(message, onUndo) {
    if (!els.snackbar) return;
    els.snackbar.innerHTML = `<span>${message}</span><button class="action">Undo</button>`;
    els.snackbar.classList.add('show');
    const btn = els.snackbar.querySelector('button.action');
    const undo = () => {
      clearTimeout(snackbarTimer);
      els.snackbar.classList.remove('show');
      if (onUndo) onUndo();
    };
    btn.addEventListener('click', undo, { once: true });
    clearTimeout(snackbarTimer);
    snackbarTimer = setTimeout(() => {
      els.snackbar.classList.remove('show');
    }, 4000);
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
    {
      const html = marked.parse(note.content);
      els.previewOutput.innerHTML = (window.DOMPurify ? DOMPurify.sanitize(html) : html);
    }
    // Transient save indicator
    const saveEl = q('#saveStatus');
    if (saveEl) {
      saveEl.textContent = 'Saved';
      saveEl.classList.add('show');
      clearTimeout(autosave._saveStatusTimer);
      autosave._saveStatusTimer = setTimeout(() => saveEl.classList.remove('show'), 800);
    }
    // brief fade-in on preview update for smoother feel
    els.previewOutput.classList.remove('fade-in');
    // force reflow to restart animation if needed
    // eslint-disable-next-line no-unused-expressions
    void els.previewOutput.offsetWidth;
    els.previewOutput.classList.add('fade-in');
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

    // Pointer support (mouse, pen, touch) for parallax
    const moveEvt = window.PointerEvent ? 'pointermove' : 'mousemove';
    window.addEventListener(moveEvt, handleMouseMove);

    // Keyboard shortcuts
    window.addEventListener('keydown', (e) => {
      // Avoid interfering with IME or content typing cases unless a modifier is pressed
      const mod = e.ctrlKey || e.metaKey;
      if (mod && e.key.toLowerCase() === 'n') { // Ctrl/Cmd+N -> new note
        e.preventDefault();
        createNote();
      } else if (mod && e.key.toLowerCase() === 'p') { // Ctrl/Cmd+P -> pin
        e.preventDefault();
        togglePin();
      } else if (mod && e.key.toLowerCase() === 'd') { // Ctrl/Cmd+D -> delete
        e.preventDefault();
        deleteActive();
      } else if (mod && e.key === '1') { // Ctrl/Cmd+1 -> split
        e.preventDefault();
        setViewMode('split');
      } else if (mod && e.key === '2') { // Ctrl/Cmd+2 -> editor only
        e.preventDefault();
        setViewMode('editor-only');
      } else if (mod && e.key === '3') { // Ctrl/Cmd+3 -> preview only
        e.preventDefault();
        setViewMode('preview-only');
      }
    });

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
