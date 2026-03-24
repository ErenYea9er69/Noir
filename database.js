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

  insertNovel.run('The Surgeon\'s Garden', 'A detective who thinks like a killer begins to fear she might be one.', 'active', 78, 12, 89284, '4 agents active', '2h ago');
  insertNovel.run('Hollow Men', 'Four strangers share one memory of a crime none of them committed.', 'draft', 45, 5, 31770, '2 agents active', 'yesterday');
  insertNovel.run('Black Meridian', 'A city disappears. Its residents remember it perfectly.', 'bible', 12, 0, 4100, 'Building bible', '3 days ago');
}

export default db;
export const query = (sql, params = []) => db.prepare(sql).all(params);

export const getNovels = () => db.prepare('SELECT * FROM novels ORDER BY edited DESC').all();
export const getNovel = (id) => db.prepare('SELECT * FROM novels WHERE id = ?').get(id);
export const createNovel = (novel) => {
  const info = db.prepare(`
    INSERT INTO novels (title, teaser, status) VALUES (?, ?, ?)
  `).run(novel.title, novel.teaser || '', novel.status || 'draft');
  return info.lastInsertRowid;
};
