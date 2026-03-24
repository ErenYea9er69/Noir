import './style.css';

// App State
const state = {
  currentLayer: 'vault', // 'vault', 'draft-room', 'writing-room'
  currentNovel: null,
  currentChapter: null,
  novels: [],
  bible: [],
  chapters: [],
  agentLogs: [],
  chatHistory: []
};

const API_BASE = 'http://localhost:3001/api';

const PILLAR_PROMPTS = {
  summary: `You are the NOIR Architect. Your goal is "All Story in Small Words." 
    Provide a compressed, brutal, cinematic distillation of the narrative arc (approx 50-80 words). 
    Focus on the "central wound" and the "unavoidable collision". Use short, punchy sentences.`,
  character: `You are the NOIR Psychologist. Create a "Development Profile." 
    Focus on the character's core contradiction (e.g., "A priest who no longer believes in God but still believes in sin"). 
    Detail their "Ghost" (past trauma), "Want" (external goal), and "Need" (internal change).`,
  beat: `You are the NOIR Structuralist. Define a key "Story Beat." 
    Explain the dramatic pressure of this moment and how it irreversibly shifts the narrative trajectory.`,
  world: `You are the NOIR Stylist. Focus on "Motifs, Tone, and Anchors." 
    Describe sensory triggers (smells, textures, lighting) that define the gothic or noir atmosphere of this story.`,
  seeding: `You are the NOIR Mastermind. Based on a high-level pitch, generate a complete Story Bible in JSON format.
    Return ONLY a JSON object with this structure:
    {
      "summary": "concise 50-word summary",
      "characters": [{"title": "Name", "role": "PROTAGONIST/ANTAGONIST...", "bio": "Psychological profile"}],
      "beats": [{"title": "Beat Title", "content": "Dramatic event description"}],
      "world": [{"title": "Atmosphere Anchor", "content": "Sensory description"}]
    }
    Generate 3 characters, 5 beats, and 2 world anchors. Cinematic, dark, and precise.`
};

// API Service
const api = {
  async fetchNovels() {
    const res = await fetch(`${API_BASE}/novels`);
    state.novels = await res.json();
    return state.novels;
  },
  async fetchNovel(id) {
    const novel = await (await fetch(`${API_BASE}/novels/${id}`)).json();
    const bible = await (await fetch(`${API_BASE}/novels/${id}/bible`)).json();
    const chapters = await (await fetch(`${API_BASE}/novels/${id}/chapters`)).json();
    const logs = await (await fetch(`${API_BASE}/novels/${id}/logs`)).json();
    
    state.currentNovel = novel;
    state.bible = bible;
    state.chapters = chapters;
    state.agentLogs = logs;
    state.currentChapter = chapters[0] || null;
    state.chatHistory = []; 
    return state.currentNovel;
  },
  async updateBibleEntry(id, title, content) {
    await fetch(`${API_BASE}/bible/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, content })
    });
  },
  async createBibleEntry(novelId, category, title, content, metadata = '{}') {
    const res = await fetch(`${API_BASE}/novels/${novelId}/bible`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ category, title, content, metadata })
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
            <div class="card-actions">
              <button class="btn-action btn-edit-novel" onclick="event.stopPropagation(); app.editNovel(${novel.id})">✎</button>
              <button class="btn-action btn-delete btn-delete-novel" onclick="event.stopPropagation(); app.deleteNovel(${novel.id})">×</button>
            </div>
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
      <div class="header-right" style="display:flex; gap:10px;">
        <button class="btn btn-outline mono" onclick="app.seedStoryBible()"><span class="bolt">⚡</span> SEED BIBLE</button>
        <button class="btn btn-primary mono" onclick="app.generateFullBible()"><span class="bolt">⚡</span> Generate All Drafts</button>
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
                  <div class="card-actions">
                    <button class="btn-action btn-edit-bible" onclick="app.editBibleEntry(${char.id})">✎</button>
                    <button class="btn-action btn-delete btn-delete-bible" onclick="app.deleteBibleEntry(${char.id})">×</button>
                  </div>
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
                <div class="card-actions">
                  <button class="btn-action btn-edit-bible" onclick="app.editBibleEntry(${beat.id})">✎</button>
                  <button class="btn-action btn-delete btn-delete-bible" onclick="app.deleteBibleEntry(${beat.id})">×</button>
                </div>
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
                  <div class="card-actions">
                    <button class="btn-action btn-edit-bible" onclick="app.editBibleEntry(${world.id})">✎</button>
                    <button class="btn-action btn-delete btn-delete-bible" onclick="app.deleteBibleEntry(${world.id})">×</button>
                  </div>
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
        ${state.agentLogs.length > 0 ? state.agentLogs.map(log => `
          <div class="agent-item ${log.status}">
            <div class="agent-info">
              <span class="dot ${log.status === 'normal' ? 'active' : log.status === 'warning' ? 'warn' : 'idle'}"></span>
              <strong>${log.agent_name}</strong>
            </div>
            <p class="agent-status mono">${log.message}</p>
          </div>
        `).join('') : `
          <div class="agent-item idle">
            <div class="agent-info">
              <span class="dot idle"></span>
              <strong>System</strong>
            </div>
            <p class="agent-status mono">Monitoring initialized. Waiting for draft activity.</p>
          </div>
        `}
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
        <span>${state.currentChapter ? `Ch. ${state.currentChapter.chapter_number}` : 'No Ch.'}</span>
        <button class="btn btn-ghost">•••</button>
      </div>
    </header>

    <main class="writing-room-content">
      <!-- Saga Sidebar -->
      <nav class="saga-sidebar">
        <div class="sidebar-label mono uppercase">Manuscript</div>
        
        <div class="saga-group">
          <div class="saga-header mono uppercase">
            Active Sagas
            <button class="btn btn-small btn-add-chapter" style="margin-left:auto">+</button>
          </div>
          <ul class="chapter-list">
            ${state.chapters.map(ch => `
              <li class="chapter-node mono ${state.currentChapter?.id === ch.id ? 'active' : ''}" 
                  onclick="app.openChapter(${ch.id})"
                  style="display:flex; align-items:center;">
                <span style="flex:1">${ch.chapter_number.toString().padStart(2, '0')} ${ch.title}</span>
                <button class="btn-action btn-edit" onclick="event.stopPropagation(); app.editChapter(${ch.id})" style="border:none; width:16px; height:16px; font-size:10px; margin-right:4px;">✎</button>
                <button class="btn-action btn-delete" onclick="event.stopPropagation(); app.deleteChapter(${ch.id})" style="border:none; width:16px; height:16px; font-size:10px;">×</button>
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
          <div class="mono x-small">${state.currentChapter ? `Ch. ${state.currentChapter.chapter_number}` : 'Bible'} in focus</div>
          <button class="btn-close" onclick="app.setLayer('writing-room')">×</button>
        </div>

        <div class="chat-feed">
          ${state.chatHistory.length > 0 ? state.chatHistory.map(msg => `
            <div class="chat-msg ${msg.role} ${msg.thinking ? 'thinking' : ''}">
              <div class="msg-author mono">${msg.role === 'user' ? 'YOU' : 'NOIR AI'}</div>
              <p>${msg.text.replace(/\n/g, '<br>')}</p>
              ${msg.role === 'ai' && !msg.thinking && state.currentLayer === 'writing-room' ? `
                <button class="btn btn-apply mono" onclick="app.applyToManuscript(\`${msg.text.replace(/`/g, '\\`').replace(/\$/g, '\\$')}\`)">+ APPLY TO MANUSCRIPT</button>
              ` : ''}
            </div>
          `).join('') : `
            <div class="chat-msg ai">
              <div class="msg-author mono">NOIR AI</div>
              <p>The abyss is silent. Ask me for analysis, character insights, or narrative steering.</p>
            </div>
          `}
        </div>

        <div class="chat-input-container">
          <div class="context-hint mono">Context: ${state.currentChapter ? state.currentChapter.title : 'General Story Bible'}</div>
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

      // Add Bible Entries
      if (e.target.closest('.btn-add-character')) {
        this.showModal('ADD CHARACTER PROFILE', 'Name & Role', async (val) => {
          if (!val) return;
          await api.createBibleEntry(state.currentNovel.id, 'character', val, 'New profile...');
          await api.fetchNovel(state.currentNovel.id);
          this.render();
        });
      }
      if (e.target.closest('.btn-add-beat')) {
        this.showModal('DEFINE STORY BEAT', 'Title', async (val) => {
          if (!val) return;
          await api.createBibleEntry(state.currentNovel.id, 'beat', val, 'Define the tension...');
          await api.fetchNovel(state.currentNovel.id);
          this.render();
        });
      }
      if (e.target.closest('.btn-add-world')) {
        this.showModal('ANCHOR ATMOSPHERE', 'Theme', async (val) => {
          if (!val) return;
          await api.createBibleEntry(state.currentNovel.id, 'world', val, 'Describe the vibe...');
          await api.fetchNovel(state.currentNovel.id);
          this.render();
        });
      }
      
      // Add Chapter
      if (e.target.closest('.btn-add-chapter')) {
        this.showModal('INITIALIZE NEW CHAPTER', 'Chapter Title', async (title) => {
          if (!title) return;
          await fetch(`${API_BASE}/novels/${state.currentNovel.id}/chapters`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title })
          });
          await api.fetchNovel(state.currentNovel.id);
          this.render();
        });
      }
    });
  },

  showModal(title, placeholder, onConfirm, initialValue = '') {
    const modalRoot = document.getElementById('modal-root');
    modalRoot.innerHTML = `
      <div class="modal-overlay active">
        <div class="modal">
          <h2 class="serif">${title}</h2>
          <input type="text" id="modal-input" placeholder="${placeholder}" value="${initialValue}" autofocus>
          <div class="modal-actions">
            <button class="btn btn-ghost mono" id="modal-cancel">CANCEL</button>
            <button class="btn btn-primary mono" id="modal-confirm">CONFIRM</button>
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
    this.runAgentAnalysis(id);
    this.setLayer('draft-room');
  },

  async runAgentAnalysis(novelId) {
    const bibleTxt = state.bible.map(b => `[${b.title}]: ${b.content}`).join('\n');
    const chapterTxt = state.chapters.map(ch => `Chapter ${ch.chapter_number}: ${ch.content}`).join('\n');

    const agents = [
      { name: 'The Architect', role: 'Analyze pacing and structural integrity. Look for plot holes.' },
      { name: 'Psychologist', role: 'Analyze character consistency. Is the dialogue mapping to the profiles?' }
    ];

    for (const agent of agents) {
      try {
        const res = await api.getAICompletion([
          { role: 'system', content: `You are NOIR Agent: ${agent.name}. Role: ${agent.role}\nContext: ${bibleTxt}\nManuscript: ${chapterTxt}` },
          { role: 'user', content: `Provide a 1-sentence status update on the current work. If there is a problem, prefix with "⚠ ALERT:".` }
        ]);
        const msg = res.choices[0].message.content;
        const status = msg.includes('⚠') ? 'warning' : 'normal';
        
        await fetch(`${API_BASE}/novels/${novelId}/logs`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: agent.name, status, message: msg })
        });
      } catch (err) {
        console.error(`Agent ${agent.name} failed:`, err);
      }
    }
    
    // Refresh logs
    state.agentLogs = await (await fetch(`${API_BASE}/novels/${novelId}/logs`)).json();
    this.render();
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
      this.runAgentAnalysis(state.currentNovel.id);
    }, 2000);
  },

  async deleteNovel(id) {
    if (!confirm('Are you sure you want to delete this novel? This cannot be undone.')) return;
    await fetch(`${API_BASE}/novels/${id}`, { method: 'DELETE' });
    await api.fetchNovels();
    this.render();
  },

  async editNovel(id) {
    const novel = state.novels.find(n => n.id === id);
    this.showModal('RENAME CASE FILE', 'New Title', async (newTitle) => {
      if (!newTitle) return;
      await fetch(`${API_BASE}/novels/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle, teaser: novel.teaser })
      });
      await api.fetchNovels();
      this.render();
    }, novel.title);
  },

  async deleteBibleEntry(id) {
    if (!confirm('Delete this bible entry?')) return;
    await fetch(`${API_BASE}/bible/${id}`, { method: 'DELETE' });
    await api.fetchNovel(state.currentNovel.id);
    this.render();
  },

  async editBibleEntry(id) {
    const entry = state.bible.find(e => e.id === id);
    this.showModal(`EDIT ${entry.category.toUpperCase()}`, 'New Title', async (newTitle) => {
      if (!newTitle) return;
      this.showModal(`EDIT CONTENT`, 'New Content', async (newContent) => {
        if (!newContent) return;
        await api.updateBibleEntry(id, newTitle, newContent);
        await api.fetchNovel(state.currentNovel.id);
        this.render();
      }, entry.content);
    }, entry.title);
  },

  async deleteChapter(id) {
    if (!confirm('Delete this chapter?')) return;
    await fetch(`${API_BASE}/chapters/${id}`, { method: 'DELETE' });
    if (state.currentChapter?.id === id) state.currentChapter = null;
    await api.fetchNovel(state.currentNovel.id);
    this.render();
  },

  async editChapter(id) {
    const ch = state.chapters.find(c => c.id === id);
    this.showModal('RENAME CHAPTER', 'New Title', async (newTitle) => {
      if (!newTitle) return;
      await fetch(`${API_BASE}/chapters/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle, content: ch.content })
      });
      await api.fetchNovel(state.currentNovel.id);
      this.render();
    }, ch.title);
  },

  async generateFullBible() {
    const btn = document.querySelector('.btn-primary.mono');
    const originalText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<span class="bolt">⚡</span> ARCHITECTING...';

    const pillars = ['summary', 'character', 'beat', 'world'];
    try {
      for (const pillar of pillars) {
        const pillarBtn = Array.from(document.querySelectorAll('.btn-small')).find(b => 
          b.innerText.includes('Generate') && 
          b.closest('.pillar').querySelector('h3').innerText.toLowerCase().includes(pillar.replace('character', 'profile').replace('beat', 'beat').replace('world', 'motif'))
        );
        if (pillarBtn) {
          pillarBtn.click();
          // Wait a bit for each to finish or at least start
          await new Promise(r => setTimeout(r, 1000));
        }
      }
    } finally {
      btn.disabled = false;
      btn.innerHTML = originalText;
    }
  },

  async seedStoryBible() {
    this.showModal('SEED ENTIRE MANUSCRIPT', 'The story in your mind...', async (pitch) => {
      if (!pitch) return;
      
      const btn = document.querySelector('.btn-outline.mono');
      const originalText = btn.innerHTML;
      btn.disabled = true;
      btn.innerHTML = '<span class="bolt">⚡</span> SEEDING ABYSS...';

      try {
        const response = await api.getAICompletion([
          { role: 'system', content: PILLAR_PROMPTS.seeding },
          { role: 'user', content: `PITCH: ${pitch}` }
        ]);
        
        const raw = response.choices[0].message.content;
        const data = JSON.parse(raw.substring(raw.indexOf('{'), raw.lastIndexOf('}') + 1));
        
        // 1. Create Summary
        await api.createBibleEntry(state.currentNovel.id, 'summary', 'The Concise Summary', data.summary);
        
        // 2. Create Characters
        for (const char of data.characters) {
          await api.createBibleEntry(state.currentNovel.id, 'character', char.title, char.bio, JSON.stringify({ role: char.role, tags: ['Seeded'] }));
        }
        
        // 3. Create Beats
        for (const beat of data.beats) {
          await api.createBibleEntry(state.currentNovel.id, 'beat', beat.title, beat.content);
        }
        
        // 4. Create World Anchors
        for (const world of data.world) {
          await api.createBibleEntry(state.currentNovel.id, 'world', world.title, world.content, JSON.stringify({ motifs: [world.title] }));
        }

        await api.fetchNovel(state.currentNovel.id);
        this.addChatMessage('ai', 'The narrative seeds have been sown. The bible is now populated.');
        this.render();
      } catch (err) {
        console.error('Seeding failed:', err);
        this.addChatMessage('ai', 'The seeding failed. The abyss remains empty.');
      } finally {
        btn.disabled = false;
        btn.innerHTML = originalText;
      }
    });
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
      
      this.addChatMessage('ai', 'Thinking', true);

      try {
        const bibleTxt = state.bible.map(b => `[${b.title}]: ${b.content}`).join('\n');
        const response = await api.getAICompletion([
          { role: 'system', content: `You are NOIR AI, a cinematic co-writer for dark thrillers. You are helpful, clinical, and precise. 
            Story Bible Context:\n${bibleTxt}` },
          { role: 'user', content: text }
        ]);
        
        const aiText = response.choices[0].message.content;
        state.chatHistory.pop();
        this.addChatMessage('ai', aiText);
      } catch (err) {
        state.chatHistory.pop();
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
            const pillarKey = title.includes('Summary') ? 'summary' : title.toLowerCase().includes('profile') ? 'character' : title.toLowerCase().includes('beat') ? 'beat' : 'world';
            const response = await api.getAICompletion([
              { role: 'system', content: PILLAR_PROMPTS[pillarKey] || `You are NOIR AI. Focus on ${title}.` },
              { role: 'user', content: `Current context: ${body ? body.innerText : 'Empty'}. Please expand or create a new one.` }
            ]);
            
            const aiText = response.choices[0].message.content;
            
            const entry = state.bible.find(b => b.category === pillarKey);
            if (entry && pillarKey === 'summary') {
              await api.updateBibleEntry(entry.id, entry.title, aiText);
            } else if (pillarKey === 'character') {
              await api.createBibleEntry(state.currentNovel.id, 'character', 'New Contact', aiText, JSON.stringify({ role: 'UNKNOWN', tags: ['Generated'] }));
            } else if (pillarKey === 'beat') {
              await api.createBibleEntry(state.currentNovel.id, 'beat', 'New Beat', aiText);
            } else if (pillarKey === 'world') {
              await api.createBibleEntry(state.currentNovel.id, 'world', 'Atmosphere', aiText, JSON.stringify({ motifs: ['Noir'] }));
            } else if (pillarKey === 'summary') {
              await api.createBibleEntry(state.currentNovel.id, 'summary', 'The Concise Summary', aiText);
            }
            await api.fetchNovel(state.currentNovel.id);
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

  addChatMessage(role, text, thinking = false) {
    state.chatHistory.push({ role, text, thinking });
    this.render();
    // Scroll to bottom
    setTimeout(() => {
      const feed = document.querySelector('.chat-feed');
      if (feed) feed.scrollTop = feed.scrollHeight;
    }, 100);
  },

  applyToManuscript(text) {
    const editor = document.getElementById('editor-node');
    if (!editor) {
      this.addChatMessage('ai', '⚠ Manuscript not found. Select a chapter first.');
      return;
    }
    
    // Clear placeholder
    const currentText = editor.innerText.trim();
    if (currentText === 'Begin the first sentence...' || currentText === '') {
      editor.innerHTML = '';
    }

    // Append as new paragraph
    const p = document.createElement('p');
    p.innerText = text;
    editor.appendChild(p);
    
    // Focus and scroll
    editor.focus();
    editor.scrollTop = editor.scrollHeight;

    // Visual feedback
    editor.classList.add('flash-amber');
    setTimeout(() => editor.classList.remove('flash-amber'), 1000);

    // Immediate Autosave
    const content = editor.innerText;
    fetch(`${API_BASE}/chapters/${state.currentChapter.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content })
    });

    this.addChatMessage('ai', 'Intelligence applied to manuscript.');
  }
};

window.app = app;
app.init();
