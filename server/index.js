import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import cors from 'cors';
import router from './routes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const port = process.env.PORT || 8787;

app.use(cors());
app.use(express.json({ limit: '5mb' }));

app.get('/api/health', (req, res) => {
  res.json({ ok: true });
});

app.use('/api', router);

const distPath = path.join(__dirname, '..', 'dist');
const indexPath = path.join(distPath, 'index.html');

if (fs.existsSync(distPath) && fs.existsSync(indexPath)) {
  app.use(express.static(distPath));
  app.get(/^(?!\/api(?:\/|$)).*/, (req, res) => {
    return res.sendFile(indexPath);
  });
}

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

