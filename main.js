import './style.css';

// App State
const state = {
  currentLayer: 'vault', // 'vault', 'draft-room', 'writing-room'
  currentNovel: null,
  currentChapter: null,
  novels: [],
  bible: [],
  chapters: []
};

const API_BASE = 'http://localhost:3001/api';

// API Service
const api = {
  async fetchNovels() {
    const res = await fetch(`${API_BASE}/novels`);
    state.novels = await res.json();
    return state.novels;
  },
  async fetchNovel(id) {
    const res = await fetch(`${API_BASE}/novels/${id}`);
    state.currentNovel = await res.json();
    
    // Fetch Bible and Chapters
    const [bibleRes, chapterRes] = await Promise.all([
      fetch(`${API_BASE}/novels/${id}/bible`),
      fetch(`${API_BASE}/novels/${id}/chapters`)
    ]);
    state.bible = await bibleRes.json();
    state.chapters = await chapterRes.json();
    
    return state.currentNovel;
  },
  async updateBibleEntry(id, content) {
    await fetch(`${API_BASE}/bible/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content })
    });
  },
  async createBibleEntry(novelId, category, title, content) {
    const res = await fetch(`${API_BASE}/novels/${novelId}/bible`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ category, title, content })
    });
    return await res.json();
  },
  async createNovel(title, teaser) {
    const res = await fetch(`${API_BASE}/novels`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, teaser })
    });
    return await res.json();
  },
  async getAICompletion(messages) {
    const res = await fetch(`${API_BASE}/ai/completion`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages })
    });
    return await res.json();
  }
};

// UI Components
const Vault = () => {
  return `
    <header class="vault-header">
      <div class="logo">
        <h1 class="serif">NOIR</h1>
        <p class="mono">novel intelligence suite</p>
      </div>
      <div class="header-actions">
        <button class="btn mono">Sort: Recent</button>
        <button class="btn btn-primary mono">+ OPEN NEW FILE</button>
      </div>
    </header>

    <main class="vault-content">
      <div class="vault-meta">
        <p class="mono uppercase">Active Files — ${state.novels.length} Manuscripts</p>
      </div>
      
      <div class="library-grid">
        ${state.novels.map(novel => `
          <div class="case-file" onclick="app.openNovel(${novel.id})">
            <div class="case-tab ${novel.status}">
              <span class="dot"></span>
              ${novel.status.toUpperCase()}
            </div>
            <div class="case-content">
              <h2 class="novel-title">${novel.title}</h2>
              <p class="novel-teaser italic">"${novel.teaser}"</p>
              
              <div class="case-footer">
                <div class="stats">
                  <div class="progress-bar">
                    <div class="progress-fill" style="width: ${novel.progress}%"></div>
                  </div>
                  <div class="stats-text mono">
                    <span>Draft ${novel.progress}% complete</span>
                    <span>${typeof novel.agents === 'number' ? novel.agents + ' agents active' : novel.agents}</span>
                  </div>
                </div>
                
                <div class="counts mono">
                  <div><strong>${novel.chapters}</strong> chapters</div>
                  <div><strong>${novel.words.toLocaleString()}</strong> words</div>
                </div>
                
                <div class="timestamp mono">
                  Edited ${novel.edited}
                </div>
              </div>
            </div>
          </div>
        `).join('')}
        
        <div class="case-file new-file-placeholder">
          <div class="plus-icon">+</div>
          <p class="mono">OPEN A NEW FILE</p>
        </div>
      </div>
    </main>

    <footer class="vault-footer">
      <div class="footer-status mono">
        <span class="active-agent-dot"></span> System idle — ${state.novels.length} files scanned
      </div>
      <div class="footer-summary mono">
        ${state.novels.length} manuscripts • ${state.novels.reduce((sum, n) => sum + n.words, 0).toLocaleString()} words total
      </div>
    </footer>
  `;
};

const DraftRoom = () => {
  const novel = state.currentNovel;
  return `
    <header class="room-header">
      <div class="header-left">
        <button class="btn btn-ghost" onclick="app.setLayer('vault')">← Vault</button>
        <div class="novel-info">
          <h1 class="serif">${novel.title}</h1>
          <p class="mono">Draft Bible • Bible Phase</p>
        </div>
      </div>
      <nav class="room-nav">
        <button class="nav-item active">BIBLE</button>
        <button class="nav-item" onclick="app.setLayer('writing-room')">WRITE</button>
        <button class="nav-item">COPILOT ↗</button>
      </nav>
      <div class="header-right">
        <button class="btn btn-primary mono"><span class="bolt">⚡</span> Generate All Drafts</button>
      </div>
    </header>

    <main class="draft-room-content">
      <div class="bible-pillars">
        <!-- Summary Pillar -->
        <section class="pillar summary-pillar">
          <div class="pillar-header">
            <div class="pillar-label">
              <span class="mono">ALL STORY IN SMALL WORDS</span>
              <h3>THE CONCISE SUMMARY</h3>
            </div>
            <div class="pillar-actions">
              <button class="btn btn-small btn-generate"><span class="bolt">⚡</span> Generate</button>
            </div>
          </div>
          <div class="pillar-body">
            <div class="summary-text prose">
              <p>${state.bible.find(b => b.category === 'summary')?.content || 'No summary yet. AI generate to begin.'}</p>
            </div>
          </div>
        </section>

        <!-- Character Dossiers Pillar -->
        <section class="pillar character-pillar">
          <div class="pillar-header">
            <div class="pillar-label">
              <span class="mono">CHARACTER DOSSIERS</span>
              <h3>DEVELOPMENT PROFILES</h3>
            </div>
            <div class="pillar-actions">
              <button class="btn btn-small btn-add-character">Add Profile</button>
            </div>
          </div>
          <div class="pillar-body scroll-y">
            ${state.bible.filter(b => b.category === 'character').map(char => {
              const meta = char.metadata ? JSON.parse(char.metadata) : {};
              return `
                <div class="profile-card">
                  <div class="profile-meta mono">${meta.role?.toUpperCase() || 'SUPPORTING'}</div>
                  <h4>${char.title}</h4>
                  <div class="tags">
                    ${(meta.tags || []).map(t => `<span class="tag">${t}</span>`).join('')}
                    <span class="tag">Active</span>
                  </div>
                </div>
              `;
            }).join('') || '<p class="mono opacity-50">No characters profiled yet.</p>'}
          </div>
        </section>

        <!-- Beat Sheet Pillar -->
        <section class="pillar beat-pillar">
          <div class="pillar-header">
            <div class="pillar-label">
              <span class="mono">STRUCTURAL OUTLINE</span>
              <h3>BEAT SHEET</h3>
            </div>
            <div class="pillar-actions">
              <button class="btn btn-small btn-add-beat">Add Beat</button>
            </div>
          </div>
          <div class="pillar-body scroll-y">
            ${state.bible.filter(b => b.category === 'beat').map(beat => `
              <div class="beat-item">
                <div class="beat-label mono">${beat.title.toUpperCase()}</div>
                <p>${beat.content}</p>
              </div>
            `).join('') || '<p class="mono opacity-50">No beats outlined yet.</p>'}
          </div>
        </section>

        <!-- World & Atmosphere Pillar -->
        <section class="pillar world-pillar">
          <div class="pillar-header">
            <div class="pillar-label">
              <span class="mono">WORLD & ATMOSPHERE</span>
              <h3>MOTIFS • TONE • DIALOGUE</h3>
            </div>
            <div class="pillar-actions">
              <button class="btn btn-small btn-add-world">Add Anchor</button>
            </div>
          </div>
          <div class="pillar-body scroll-y">
            ${state.bible.filter(b => b.category === 'world').map(world => {
              const meta = world.metadata ? JSON.parse(world.metadata) : {};
              return `
                <div class="motif-grid">
                  ${(meta.motifs || []).map(m => `<span class="motif-tag">${m}</span>`).join('')}
                </div>
                <div class="tone-anchor">
                  <div class="anchor-label mono">${world.title.toUpperCase()}</div>
                  <p class="prose italic">${world.content}</p>
                </div>
              `;
            }).join('') || '<p class="mono opacity-50">No world anchors defined yet.</p>'}
          </div>
        </section>
      </div>

      <aside class="agents-sidebar">
        <div class="sidebar-label mono uppercase">Agents Running</div>
        
        <div class="agent-item active">
          <div class="agent-info">
            <span class="dot active"></span>
            <strong>The Architect</strong>
          </div>
          <p class="agent-status mono">Macro structure scan — Act II pacing normal</p>
        </div>

        <div class="agent-item warning">
          <div class="agent-info">
            <span class="dot warn"></span>
            <strong>Psychologist</strong>
          </div>
          <p class="agent-status mono">Tracking Hana across 12 chapters</p>
          <div class="agent-alert mono">⚠ Motive drift in Ch.8 detected</div>
        </div>

        <div class="agent-item">
          <div class="agent-info">
            <span class="dot idle"></span>
            <strong>Continuity</strong>
          </div>
          <p class="agent-status mono">No timeline errors found</p>
        </div>

        <div class="agent-item warning">
          <div class="agent-info">
            <span class="dot warn"></span>
            <strong>Atmosphere</strong>
          </div>
          <p class="agent-status mono">Tone consistency 87%</p>
          <div class="agent-alert mono">Ch.6 — Lighter than defined voice</div>
        </div>

        <div class="agent-item idle">
          <div class="agent-info">
            <span class="dot idle"></span>
            <strong>Dialogue</strong>
          </div>
          <p class="agent-status mono">Idle — enable for deep scan</p>
        </div>
      </aside>
    </main>
  `;
};

const WritingRoom = () => {
  const novel = state.currentNovel;
  return `
    <header class="room-header">
      <div class="header-left">
        <button class="btn btn-ghost" onclick="app.setLayer('draft-room')">← Bible</button>
        <div class="novel-info">
          <h1 class="serif">${novel.title}</h1>
          <p class="mono">Writing Room</p>
        </div>
      </div>
      <nav class="room-nav">
        <button class="nav-item" onclick="app.setLayer('draft-room')">BIBLE</button>
        <button class="nav-item active">WRITE</button>
        <button class="nav-item">COPILOT ↗</button>
      </nav>
      <div class="header-right mono stats-bar">
        <span>${novel.words.toLocaleString()} words</span>
        <span class="sep">/</span>
        <span>Ch.8 • Page 5</span>
        <button class="btn btn-ghost">•••</button>
      </div>
    </header>

    <main class="writing-room-content">
      <!-- Saga Sidebar -->
      <nav class="saga-sidebar">
        <div class="sidebar-label mono uppercase">Manuscript</div>
        
        <div class="saga-group">
          <div class="saga-header mono uppercase">Active Sagas</div>
          <ul class="chapter-list">
            ${state.chapters.map(ch => `
              <li class="chapter-node mono ${state.currentChapter?.id === ch.id ? 'active' : ''}" 
                  onclick="app.openChapter(${ch.id})">
                ${ch.chapter_number.toString().padStart(2, '0')} ${ch.title}
              </li>
            `).join('')}
          </ul>
        </div>
      </nav>

      <!-- Editor -->
      <article class="editor-container">
        ${state.currentChapter ? `
          <div class="editor-header">
            <h2 class="serif">Chapter ${state.currentChapter.chapter_number} — ${state.currentChapter.title}</h2>
          </div>
          <div class="prose-editor" contenteditable="true" id="editor-node" oninput="app.autoSave()">
            ${state.currentChapter.content ? `<p>${state.currentChapter.content.replace(/\n/g, '</p><p>')}</p>` : '<p>Begin the first sentence...</p>'}
          </div>
        ` : `
          <div class="editor-placeholder mono">Select a chapter to begin writing.</div>
        `}
      </article>

      <!-- Copilot Panel -->
      <aside class="copilot-panel">
        <div class="copilot-header">
          <div class="mono uppercase">Copilot</div>
          <div class="mono x-small">Saga I • Ch.8 • Page 5 in context</div>
          <button class="btn-close">×</button>
        </div>

        <div class="chat-feed">
          <div class="chat-msg user">
            <div class="msg-author mono">YOU</div>
            <p>In Saga 1, Chapter 8, page 5 — make Hana's dialogue colder. Remove the grief flashback. It's too soft for this moment.</p>
          </div>

          <div class="chat-msg ai">
            <div class="msg-author mono">NOIR AI</div>
            <p>Agreed. The grief flashback breaks the clinical register you've built for Hana. Here's the revised paragraph — the emotion is still present but compressed into action, not reflection:</p>
            
            <div class="diff-block">
              <div class="diff-old">
                Her hands were steady, which surprised her. She had expected them to shake, the way they shook the morning her father died, the morning she understood that grief was not sadness but a form of recognition.
              </div>
              <div class="diff-new">
                Her hands were steady. She noted this the way she noted everything: without judgment, without surprise. The steadiness was just information.
              </div>
            </div>

            <div class="diff-actions">
              <button class="btn btn-small btn-primary">✓ Accept</button>
              <button class="btn btn-small">Reject</button>
            </div>
          </div>

          <div class="chat-msg user">
            <div class="msg-author mono">YOU</div>
            <p>Good. Also - add a subtle mirror motif somewhere on this page. Should not be obvious.</p>
          </div>
        </div>

        <div class="chat-input-container">
          <div class="context-hint mono">Context: Saga I • Ch.8 • Page 5</div>
          <div class="input-wrapper">
            <textarea placeholder="Ask about any chapter, page, or element..." rows="2"></textarea>
            <button class="btn-send">↑</button>
          </div>
        </div>
      </aside>
    </main>
  `;
};

// Application Controller
const app = {
  async init() {
    await api.fetchNovels();
    this.render();
    this.initGlobalEvents();
  },
  
  initGlobalEvents() {
    document.addEventListener('click', async (e) => {
      if (e.target.closest('.new-file-placeholder') || e.target.closest('.btn-primary') && e.target.innerText.includes('NEW FILE')) {
        this.showModal('OPEN NEW CASE FILE', 'Project Title', async (title) => {
          if (!title) return;
          const novel = await api.createNovel(title, 'A new dark masterpiece.');
          await api.fetchNovels();
          this.openNovel(novel.id);
        });
      }
    });
  },

  showModal(title, placeholder, onConfirm) {
    const modalRoot = document.getElementById('modal-root');
    modalRoot.innerHTML = `
      <div class="modal-overlay active">
        <div class="modal">
          <h2 class="serif">${title}</h2>
          <input type="text" id="modal-input" placeholder="${placeholder}" autofocus>
          <div class="modal-actions">
            <button class="btn btn-ghost mono" id="modal-cancel">CANCEL</button>
            <button class="btn btn-primary mono" id="modal-confirm">INITIALIZE</button>
          </div>
        </div>
      </div>
    `;

    const input = document.getElementById('modal-input');
    const confirm = document.getElementById('modal-confirm');
    const cancel = document.getElementById('modal-cancel');

    const close = () => {
      modalRoot.innerHTML = '';
    };

    confirm.onclick = () => {
      onConfirm(input.value);
      close();
    };

    cancel.onclick = close;
    
    input.onkeypress = (e) => {
      if (e.key === 'Enter') {
        onConfirm(input.value);
        close();
      }
    };
    
    input.focus();
  },

  setLayer(layer) {
    state.currentLayer = layer;
    this.render();
  },
  
  async render() {
    const root = document.getElementById('app');
    if (!document.getElementById('modal-root')) {
      const modalRoot = document.createElement('div');
      modalRoot.id = 'modal-root';
      document.body.appendChild(modalRoot);
    }

    if (state.currentLayer === 'vault') {
      root.innerHTML = Vault();
    } else if (state.currentLayer === 'draft-room') {
      root.innerHTML = DraftRoom();
      this.initCopilot();
    } else if (state.currentLayer === 'writing-room') {
      root.innerHTML = WritingRoom();
      this.initCopilot();
    }
  },
  
  async openNovel(id) {
    await api.fetchNovel(id);
    this.setLayer('draft-room');
  },

  openChapter(id) {
    state.currentChapter = state.chapters.find(ch => ch.id === id);
    this.render();
  },

  autoSaveTimeout: null,
  autoSave() {
    clearTimeout(this.autoSaveTimeout);
    this.autoSaveTimeout = setTimeout(async () => {
      const editor = document.getElementById('editor-node');
      if (!editor || !state.currentChapter) return;
      const content = editor.innerText;
      await fetch(`${API_BASE}/chapters/${state.currentChapter.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content })
      });
      console.log('Autosaved.');
    }, 2000);
  },

  initCopilot() {
    const input = document.querySelector('.chat-input-container textarea');
    const sendBtn = document.querySelector('.btn-send');
    if (!input || !sendBtn) return;

    const sendMessage = async () => {
      const text = input.value.trim();
      if (!text) return;

      this.addChatMessage('user', text);
      input.value = '';

      try {
        const response = await api.getAICompletion([
          { role: 'system', content: 'You are NOIR AI, a cinematic co-writer for dark thrillers. You are helpful, clinical, and precise.' },
          { role: 'user', content: text }
        ]);
        
        const aiText = response.choices[0].message.content;
        this.addChatMessage('ai', aiText);
      } catch (err) {
        this.addChatMessage('ai', 'Connection lost. The abyss does not respond.');
      }
    };

    sendBtn.addEventListener('click', sendMessage);
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    });

    // Wire up Generate buttons in Draft Room
    document.querySelectorAll('.btn-small').forEach(btn => {
      if (btn.innerText.includes('Generate') && !btn.dataset.wired) {
        btn.dataset.wired = "true";
        btn.addEventListener('click', async () => {
          const pillar = btn.closest('.pillar');
          const title = pillar.querySelector('h3').innerText;
          const body = pillar.querySelector('.prose, .profile-card, .beat-item');
          
          btn.disabled = true;
          btn.innerHTML = '<span class="bolt">⚡</span> Thinking...';

          try {
            const response = await api.getAICompletion([
              { role: 'system', content: `You are NOIR AI. Generate a draft ${title} for a dark thriller.` },
              { role: 'user', content: `Current context: ${body ? body.innerText : 'Empty'}. Please expand or create a new one.` }
            ]);
            
            const aiText = response.choices[0].message.content;
            
            const entry = state.bible.find(b => b.category === (title.includes('Summary') ? 'summary' : title.toLowerCase()));
            if (entry) {
              await api.updateBibleEntry(entry.id, aiText);
              entry.content = aiText;
            } else if (title.includes('Summary')) {
              await api.createBibleEntry(state.currentNovel.id, 'summary', 'The Concise Summary', aiText);
              await api.fetchNovel(state.currentNovel.id);
            } else {
              this.addChatMessage('ai', `Analysis Complete for ${title}: ${aiText}`);
            }
            this.render();
          } catch (err) {
            console.error(err);
          } finally {
            btn.disabled = false;
            btn.innerHTML = '<span class="bolt">⚡</span> Generate';
          }
        });
      }
    });
  },

  addChatMessage(role, text) {
    const feed = document.querySelector('.chat-feed');
    if (!feed) return;

    const msg = document.createElement('div');
    msg.className = `chat-msg ${role}`;
    msg.innerHTML = `
      <div class="msg-author mono">${role === 'user' ? 'YOU' : 'NOIR AI'}</div>
      <p>${text.replace(/\n/g, '<br>')}</p>
    `;
    
    feed.appendChild(msg);
    feed.scrollTop = feed.scrollHeight;
  }
};

window.app = app;
app.init();
