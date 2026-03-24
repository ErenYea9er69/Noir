import './style.css';

// App State
const state = {
  currentLayer: 'vault', // 'vault', 'draft-room', 'writing-room'
  currentNovel: null,
  novels: [
    {
      id: 1,
      title: 'The Surgeon\'s Garden',
      teaser: 'A detective who thinks like a killer begins to fear she might be one.',
      status: 'active',
      chapters: 12,
      words: 89284,
      edited: '2h ago',
      progress: 78,
      agents: 4
    },
    {
      id: 2,
      title: 'Hollow Men',
      teaser: 'Four strangers share one memory of a crime none of them committed.',
      status: 'draft',
      chapters: 5,
      words: 31770,
      edited: 'yesterday',
      progress: 45,
      agents: 2
    },
    {
      id: 3,
      title: 'Black Meridian',
      teaser: 'A city disappears. Its residents remember it perfectly.',
      status: 'bible',
      chapters: 0,
      words: 4100,
      edited: '3 days ago',
      progress: 12,
      agents: 'Building bible'
    }
  ]
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
        <span class="active-agent-dot"></span> Continuity scanner running on The Surgeon's Garden
      </div>
      <div class="footer-summary mono">
        3 manuscripts • 125,074 words total
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
              <button class="btn btn-small"><span class="bolt">⚡</span> Generate</button>
              <button class="btn btn-small">Edit</button>
            </div>
          </div>
          <div class="pillar-body">
            <div class="agent-conflict-card">
              <div class="conflict-header uppercase mono">
                <span class="error-dot">●</span> Agent Flag — Chapter 8 Conflict
              </div>
              <p class="conflict-text">Detective Hana's motive shifts from justice to vengeance in Ch.8, contradicting her summary arc. Update summary or revise chapter?</p>
              <div class="conflict-actions">
                <button class="btn btn-outline">Update Summary</button>
                <button class="btn btn-outline" onclick="app.setLayer('writing-room')">Revise Ch.8</button>
              </div>
            </div>
            <div class="summary-text prose">
              <p>Detective Hana Yeo is assigned to a serial case where victims are surgically...</p>
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
              <button class="btn btn-small"><span class="bolt">⚡</span> Add Profile</button>
            </div>
          </div>
          <div class="pillar-body scroll-y">
            <div class="profile-card">
              <div class="profile-meta mono">PROTAGONIST • LEAD DETECTIVE</div>
              <h4>Hana Yeo</h4>
              <div class="tags">
                <span class="tag">Hyper-logical</span>
                <span class="tag">Estranged daughter</span>
                <span class="tag">Mirror of the killer</span>
              </div>
            </div>
            <div class="profile-card">
              <div class="profile-meta mono">ANTAGONIST • PRIMARY</div>
              <h4>The Surgeon (unnamed)</h4>
              <div class="tags">
                <span class="tag">Practicing physician</span>
                <span class="tag">Obsessive care</span>
                <span class="tag">Views victims as art</span>
              </div>
            </div>
            <div class="profile-card">
              <div class="profile-meta mono">SUPPORTING • AUTHORITY FIGURE</div>
              <h4>Director Kwon</h4>
              <div class="tags">
                <span class="tag">Political pressure</span>
                <span class="tag">Hides case history</span>
              </div>
            </div>
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
              <button class="btn btn-small"><span class="bolt">⚡</span> Generate</button>
              <button class="btn btn-small">Reorder</button>
            </div>
          </div>
          <div class="pillar-body scroll-y">
            <div class="beat-item">
              <div class="beat-label mono">II • INCITING INCIDENT</div>
              <p>Hana discovers victim #2 was moved AFTER she visited the scene. Someone knew her route.</p>
            </div>
            <div class="beat-item">
              <div class="beat-label mono">III • MIDPOINT — THE MIRROR</div>
              <p>A victim leaves Hana a message: "He said you'd understand."</p>
            </div>
            <div class="beat-item warning">
              <div class="beat-label mono">IV • DARK NIGHT — CH.8 <span class="warn-icon">▲</span></div>
              <p>Hana crosses a line. Method mirrors the killer. [Agent conflict flagged]</p>
            </div>
            <div class="beat-item">
              <div class="beat-label mono">V • RESOLUTION</div>
              <p>Unwritten — AI suggests ambiguous ending. Reader decides who the killer is.</p>
            </div>
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
              <button class="btn btn-small"><span class="bolt">⚡</span> Generate</button>
            </div>
          </div>
          <div class="pillar-body scroll-y">
            <div class="motif-grid">
              <div class="motif-tag">Mirrors</div>
              <div class="motif-tag">Surgical gloves</div>
              <div class="motif-tag">Rain at crime scenes</div>
              <div class="motif-tag">Unfinished meals</div>
              <div class="motif-tag">Hospital white</div>
              <div class="motif-tag">Specific plants</div>
            </div>
            <div class="tone-anchor">
              <div class="anchor-label mono">TONE ANCHORS</div>
              <p class="prose italic">Controlled dread. Clinical observation over visceral horror. Every sentence should feel like a scalpel — precise, deliberate, slightly cold.</p>
            </div>
            <div class="tone-anchor">
              <div class="anchor-label mono">DIALOGUE VOICE — HANA</div>
              <p class="prose italic">"She speaks in questions that aren't questions. Her voice never lifts at the end of a sentence."</p>
            </div>
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
          <div class="saga-header mono uppercase">Saga I — The Garden</div>
          <ul class="chapter-list">
            <li class="chapter-node mono">01 Opening Image</li>
            <li class="chapter-node mono">02 The Second Body</li>
            <li class="chapter-node active">
              <span class="node-title mono">08 The Dark Night</span>
              <ul class="page-list">
                <li class="page-node mono">Page 1</li>
                <li class="page-node mono">Page 2</li>
                <li class="page-node mono">Page 3</li>
                <li class="page-node mono">Page 4</li>
                <li class="page-node active mono">Page 5 ←</li>
              </ul>
            </li>
            <li class="chapter-node mono">09 The Garden Itself</li>
            <li class="chapter-node mono">10 Her Method</li>
            <li class="chapter-node mono">11 The Last Arrangement</li>
          </ul>
        </div>

        <div class="saga-group">
          <div class="saga-header mono uppercase">Saga II — The Mirror</div>
          <ul class="chapter-list">
            <li class="chapter-node mono idle">12 Unwritten</li>
          </ul>
        </div>
      </nav>

      <!-- Editor -->
      <article class="editor-container">
        <div class="editor-header">
          <h2 class="serif">Chapter 8 — The Dark Night</h2>
          <div class="page-counter mono">Page 5 of 6</div>
        </div>
        <div class="prose-editor" contenteditable="true">
          <p>...through it with her hands behind her back, like a visitor in a museum she had already decided to rob.</p>
          <p><span class="highlight">She found the evidence on the third shelf. Her hands were steady, which surprised her. She had expected them to shake, the way they shook the morning her father died, the morning she understood that grief was not sadness but a form of recognition.</span></p>
          <p>She photographed everything. Then she put one thing in her pocket. She told herself this was methodical. She told herself a lot of things in the next hour, standing in that kitchen that smelled of bleach and something older.</p>
        </div>
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
  init() {
    this.render();
  },
  
  setLayer(layer) {
    state.currentLayer = layer;
    this.render();
  },
  
  render() {
    const root = document.getElementById('app');
    if (state.currentLayer === 'vault') {
      root.innerHTML = Vault();
    } else if (state.currentLayer === 'draft-room') {
      root.innerHTML = DraftRoom();
    } else if (state.currentLayer === 'writing-room') {
      root.innerHTML = WritingRoom();
    }
  },
  
  openNovel(id) {
    const novel = state.novels.find(n => n.id === id);
    state.currentNovel = novel;
    this.setLayer('draft-room');
  }
};

window.app = app;
app.init();
