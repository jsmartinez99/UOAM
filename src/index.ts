import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';
import { createArrangerController } from './backend/controllers.js';
import { config } from './config.js';
import { QdrantAdapter } from './infrastructure/qdrant/qdrant-client.js';
import { logger } from './infrastructure/logger.js';
import type { LLMClient } from './ports/llm-client.port.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

// Multer config for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (_req, file, cb) => {
    const allowed = ['.xml', '.musicxml', '.mxl', '.mid', '.midi'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Formato no soportado. Use MusicXML (.xml, .musicxml, .mxl) o MIDI (.mid, .midi)'));
    }
  },
});

// Initialize Qdrant client
const qdrantAdapter = new QdrantAdapter();
qdrantAdapter.ensureCollection('arrangements_collection', 6).catch((error: unknown) => {
  logger.error('Error initializing Qdrant collection:', error as Error);
});

// Dependencies
const dependencies = {
  qdrantClient: qdrantAdapter,
  llmClient: { generateText: async () => 'Mock analysis' } as LLMClient,
  jwtSecret: config.jwtSecret,
};

const controller = createArrangerController(dependencies);

app.get('/api/v1/arrangers', controller.getAllArrangers);
app.post('/api/v1/arrangers', controller.createArranger);
app.post('/api/v1/hybridize', controller.hybridizeProfiles);
app.post('/api/v1/search', controller.searchSimilar);
app.post('/api/v1/analyze', controller.generateAnalysis);
app.post('/api/v1/auth/register', controller.registerUser);
app.post('/api/v1/auth/login', controller.loginUser);
app.post('/api/v1/upload', upload.single('file'), controller.uploadArrangement);

// Serve static frontend files
app.use(express.static(path.join(__dirname, '../dist/public')));

app.use((_req, res) => {
  res.sendFile(path.join(__dirname, '../dist/public/index.html'));
});

app.listen(config.port, () => {
  logger.info(`Server running on port ${config.port}`);
});
