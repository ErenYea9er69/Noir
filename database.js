import Database from 'better-sqlite3';
import { join } from 'path';

const db = new Database('noir.db');

// Initialize Schema
db.exec(`
  CREATE TABLE IF NOT EXISTS novels (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    teaser TEXT,
    status TEXT DEFAULT 'draft',
    progress INTEGER DEFAULT 0,
    chapters INTEGER DEFAULT 0,
    words INTEGER DEFAULT 0,
    agents TEXT DEFAULT 'Active',
    edited DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS chapters (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    novel_id INTEGER NOT NULL,
    saga_name TEXT,
    chapter_number INTEGER,
    title TEXT,
    content TEXT,
    FOREIGN KEY (novel_id) REFERENCES novels (id)
  );

  CREATE TABLE IF NOT EXISTS bible_entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    novel_id INTEGER NOT NULL,
    category TEXT NOT NULL, -- 'summary', 'character', 'beat', 'world'
    title TEXT,
    content TEXT,
    metadata TEXT, -- JSON string
    FOREIGN KEY (novel_id) REFERENCES novels (id)
  );

  CREATE TABLE IF NOT EXISTS agent_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    novel_id INTEGER NOT NULL,
    agent_name TEXT,
    status TEXT, -- 'normal', 'warning', 'idle'
    message TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (novel_id) REFERENCES novels (id)
  );
`);

// Seed initial data if empty
const count = db.prepare('SELECT COUNT(*) as count FROM novels').get();
if (count.count === 0) {
  const insertNovel = db.prepare(`
    INSERT INTO novels (title, teaser, status, progress, chapters, words, agents, edited)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const n1 = insertNovel.run('The Surgeon\'s Garden', 'A detective who thinks like a killer begins to fear she might be one.', 'active', 78, 12, 89284, '4 agents active', '2h ago').lastInsertRowid;
  const n2 = insertNovel.run('Hollow Men', 'Four strangers share one memory of a crime none of them committed.', 'draft', 45, 5, 31770, '2 agents active', 'yesterday').lastInsertRowid;
  const n3 = insertNovel.run('Black Meridian', 'A city disappears. Its residents remember it perfectly.', 'bible', 12, 0, 4100, 'Building bible', '3 days ago').lastInsertRowid;

  // Seed Bible Entries for n1
  const insertBible = db.prepare(`INSERT INTO bible_entries (novel_id, category, title, content, metadata) VALUES (?, ?, ?, ?, ?)`);
  insertBible.run(n1, 'summary', 'The Concise Summary', 'Detective Hana Yeo is assigned to a serial case where victims are surgically altered while alive. As the investigation deepens, she realizes the killer is mirroring her own suppressed medical trauma.', null);
  insertBible.run(n1, 'character', 'Hana Yeo', 'Hyper-logical, estranged daughter of a disgraced surgeon. Mirror of the killer.', JSON.stringify({ role: 'Protagonist', tags: ['Logic', 'Trauma'] }));
  insertBible.run(n1, 'beat', 'Inciting Incident', 'Hana discovers victim #2 was moved AFTER she visited the scene.', null);
  insertBible.run(n1, 'world', 'Atmosphere', 'Controlled dread. Scalpel-precise prose.', JSON.stringify({ motifs: ['Mirrors', 'Bleach', 'White'] }));

  // Seed Chapters for n1
  const insertChapter = db.prepare(`INSERT INTO chapters (novel_id, saga_name, chapter_number, title, content) VALUES (?, ?, ?, ?, ?)`);
  insertChapter.run(n1, 'Saga I', 1, 'Opening Image', 'The blood was cleaner than it should have been...');
  insertChapter.run(n1, 'Saga I', 8, 'The Dark Night', '...through it with her hands behind her back, like a visitor in a museum she had already decided to rob.');
}

export default db;
export const query = (sql, params = []) => db.prepare(sql).all(params);

export const getNovels = () => db.prepare('SELECT * FROM novels ORDER BY edited DESC').all();
export const getNovel = (id) => db.prepare('SELECT * FROM novels WHERE id = ?').get(id);
export const createNovel = (title, teaser) => {
  const info = db.prepare(`
    INSERT INTO novels (title, teaser, status) VALUES (?, ?, ?)
  `).run(title, teaser || '', 'draft');
  return info.lastInsertRowid;
};

// Bible Helpers
export const getBibleEntries = (novelId) => db.prepare('SELECT * FROM bible_entries WHERE novel_id = ?').all(novelId);
export const updateBibleEntry = (id, content) => db.prepare('UPDATE bible_entries SET content = ? WHERE id = ?').run(content, id);

// Chapter Helpers
export const getChapters = (novelId) => db.prepare('SELECT * FROM chapters WHERE novel_id = ? ORDER BY chapter_number ASC').all(novelId);
export const updateChapter = (id, content) => db.prepare('UPDATE chapters SET content = ? WHERE id = ?').run(content, id);
export const createChapter = (novelId, title) => {
  const info = db.prepare('INSERT INTO chapters (novel_id, title) VALUES (?, ?)').run(novelId, title);
  return info.lastInsertRowid;
};
