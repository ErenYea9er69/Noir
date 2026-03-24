import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import axios from 'axios';
import db, { getNovels, getNovel, getAgentLogs, createAgentLog } from './database.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// API Routes
app.get('/api/novels', (req, res) => {
  try {
    const novels = getNovels();
    res.json(novels);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/novels', (req, res) => {
  try {
    const { title, teaser } = req.body;
    const id = db.prepare('INSERT INTO novels (title, teaser) VALUES (?, ?)').run(title, teaser || '').lastInsertRowid;
    const novel = getNovel(id);
    res.json(novel);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/novels/:id', (req, res) => {
  try {
    const novel = getNovel(req.params.id);
    if (!novel) return res.status(404).json({ error: 'Novel not found' });
    res.json(novel);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/novels/:id/bible', (req, res) => {
  try {
    const entries = db.prepare('SELECT * FROM bible_entries WHERE novel_id = ?').all(req.params.id);
    res.json(entries);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/novels/:id/bible', (req, res) => {
  try {
    const { category, title, content, metadata } = req.body;
    const id = db.prepare('INSERT INTO bible_entries (novel_id, category, title, content, metadata) VALUES (?, ?, ?, ?, ?)')
      .run(req.params.id, category, title, content, metadata || null).lastInsertRowid;
    res.json({ id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/bible/:id', (req, res) => {
  try {
    const { content } = req.body;
    db.prepare('UPDATE bible_entries SET content = ? WHERE id = ?').run(content, req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/novels/:id/chapters', (req, res) => {
  try {
    const chapters = db.prepare('SELECT * FROM chapters WHERE novel_id = ? ORDER BY chapter_number ASC').all(req.params.id);
    res.json(chapters);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/novels/:id/chapters', (req, res) => {
  try {
    const { title, saga_name, chapter_number } = req.body;
    const id = db.prepare('INSERT INTO chapters (novel_id, title, saga_name, chapter_number) VALUES (?, ?, ?, ?)')
      .run(req.params.id, title, saga_name || 'Active Sagas', chapter_number || 1).lastInsertRowid;
    res.json({ id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/novels/:id/logs', (req, res) => {
  try {
    const logs = getAgentLogs(req.params.id);
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/chapters/:id', (req, res) => {
  try {
    const { content } = req.body;
    db.prepare('UPDATE chapters SET content = ? WHERE id = ?').run(content, req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// AI Proxy for LongCat
app.post('/api/ai/completion', async (req, res) => {
  const { messages, model = "LongCat-Flash-Thinking-2601" } = req.body;
  const apiKey = process.env.LONGCAT_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'LongCat API key not configured' });
  }

  try {
    const response = await axios.post('https://api.longcat.chat/openai/v1/chat/completions', {
      model,
      messages,
      temperature: 0.7,
      max_tokens: 2000
    }, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    res.json(response.data);
  } catch (err) {
    console.error('AI Proxy Error:', err.response?.data || err.message);
    res.status(err.response?.status || 500).json(err.response?.data || { error: 'Inference failed' });
  }
});

app.listen(port, () => {
  console.log(`NOIR Backend listening at http://localhost:${port}`);
});
