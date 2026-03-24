import Database from 'better-sqlite3';
import { join } from 'path';

const db = new Database('noir.db');
db.pragma('foreign_keys = ON');

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
    FOREIGN KEY (novel_id) REFERENCES novels (id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS bible_entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    novel_id INTEGER NOT NULL,
    category TEXT NOT NULL,
    title TEXT,
    content TEXT,
    metadata TEXT,
    FOREIGN KEY (novel_id) REFERENCES novels (id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS agent_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    novel_id INTEGER NOT NULL,
    agent_name TEXT,
    status TEXT,
    message TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (novel_id) REFERENCES novels (id) ON DELETE CASCADE
  );
`);

// No initial seed data for a fresh start.

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
export const deleteNovel = (id) => {
  // Manual cleanup just in case the schema wasn't recreated with CASCADE
  db.prepare('DELETE FROM chapters WHERE novel_id = ?').run(id);
  db.prepare('DELETE FROM bible_entries WHERE novel_id = ?').run(id);
  db.prepare('DELETE FROM agent_logs WHERE novel_id = ?').run(id);
  return db.prepare('DELETE FROM novels WHERE id = ?').run(id);
};
export const updateNovel = (id, title, teaser) => db.prepare('UPDATE novels SET title = ?, teaser = ? WHERE id = ?').run(title, teaser, id);

// Bible Helpers
export const getBibleEntries = (novelId) => db.prepare('SELECT * FROM bible_entries WHERE novel_id = ?').all(novelId);
export const deleteBibleEntry = (id) => db.prepare('DELETE FROM bible_entries WHERE id = ?').run(id);
export const updateBibleEntry = (id, title, content) => {
  if (title) {
    return db.prepare('UPDATE bible_entries SET title = ?, content = ? WHERE id = ?').run(title, content, id);
  }
  return db.prepare('UPDATE bible_entries SET content = ? WHERE id = ?').run(content, id);
};

// Chapter Helpers
export const getChapters = (novelId) => db.prepare('SELECT * FROM chapters WHERE novel_id = ? ORDER BY chapter_number ASC').all(novelId);
export const deleteChapter = (id) => db.prepare('DELETE FROM chapters WHERE id = ?').run(id);
export const updateChapter = (id, content, title) => {
  if (title) {
    return db.prepare('UPDATE chapters SET title = ?, content = ? WHERE id = ?').run(title, content, id);
  }
  return db.prepare('UPDATE chapters SET content = ? WHERE id = ?').run(content, id);
};
export const createChapter = (novelId, title) => {
  return info.lastInsertRowid;
};

// Agent Helpers
export const getAgentLogs = (novelId) => db.prepare('SELECT * FROM agent_logs WHERE novel_id = ? ORDER BY timestamp DESC').all(novelId);
export const createAgentLog = (novelId, name, status, message) => {
  return db.prepare('INSERT INTO agent_logs (novel_id, agent_name, status, message) VALUES (?, ?, ?, ?)')
    .run(novelId, name, status, message).lastInsertRowid;
};
