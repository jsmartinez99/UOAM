import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import multer from 'multer';
import swaggerUi from 'swagger-ui-express';
import { createArrangerController, authenticateToken } from './backend/controllers.js';
import { config } from './config.js';
import { QdrantAdapter } from './infrastructure/qdrant/qdrant-client.js';
import { logger } from './infrastructure/logger.js';
import { databaseInitializer } from './infrastructure/database/database-initializer.js';
import { swaggerSpec } from './api/swagger.js';
import { createLLMClient, resolveLLMProvider } from './adapters/llm/llm-factory.js';
import { OllamaLLMClient } from './adapters/llm/ollama-client.js';
import { securityHeaders, rateLimit, jsonBodyLimit } from './backend/security.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json({ limit: jsonBodyLimit }));
app.use(securityHeaders());

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['.xml', '.musicxml', '.mxl', '.mid', '.midi', '.wav', '.mp3'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Formato no soportado. Use MusicXML (.xml, .musicxml, .mxl), MIDI (.mid, .midi), WAV (.wav) o MP3 (.mp3)'));
    }
  },
});

async function bootstrap(): Promise<void> {
  await databaseInitializer.ensureInitialized();
  logger.info('Database initialized');

  const qdrantAdapter = new QdrantAdapter();
  const collection = process.env.QDRANT_COLLECTION || 'arrangements_collection';
  await qdrantAdapter.ensureCollection(collection, 6);
  logger.info('Qdrant collection ready');

  await databaseInitializer.ensureSeeded(qdrantAdapter);
  logger.info('Database seed complete');

  const dependencies = {
    qdrantClient: qdrantAdapter,
    llmClient: createLLMClient(),
    jwtSecret: config.jwtSecret,
  };

  // Health check del LLM (no bloqueante)
  if (dependencies.llmClient instanceof OllamaLLMClient) {
    dependencies.llmClient.healthCheck().then((h) => {
      if (h.ok) {
        logger.info(`LLM ready: Ollama model=${h.model}`);
      } else {
        logger.warn(`LLM unavailable: ${h.error}. Falling back to mock.`);
      }
    });
  } else {
    logger.info(`LLM provider: ${resolveLLMProvider()}`);
  }

  const controller = createArrangerController(dependencies);
  const auth = authenticateToken(dependencies);

  // Rate limiter estricto para auth (anti brute force)
  const authLimiter = rateLimit({ windowMs: 15 * 60_000, maxRequests: 20 });
  // Rate limiter general para la API
  const apiLimiter = rateLimit({ windowMs: 60_000, maxRequests: 100 });

  app.use('/api/', apiLimiter);

  app.get('/api/v1/arrangers', controller.getAllArrangers);
  app.post('/api/v1/arrangers', auth, controller.createArranger);
  app.post('/api/v1/hybridize', auth, controller.hybridizeProfiles);
  app.post('/api/v1/search', auth, controller.searchSimilar);
  app.post('/api/v1/analyze', auth, controller.generateAnalysis);
  app.post('/api/v1/auth/register', authLimiter, controller.registerUser);
  app.post('/api/v1/auth/login', authLimiter, controller.loginUser);
  app.post('/api/v1/upload', auth, upload.single('musicFile'), controller.uploadArrangement);
  app.post('/api/v1/arrangements/generate', auth, controller.generateStandaloneArrangement);
  app.post('/api/v1/arrangements/export/xml', auth, controller.exportMusicXML);

  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, { explorer: true }));
  app.get('/api-docs.json', (_req, res) => res.json(swaggerSpec));

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Serve static files for frontend - only for non-API routes
  app.use((req, res, next) => {
    if (req.path.startsWith('/api/') || req.path.startsWith('/api-docs')) {
      return next();
    }
    // Manually serve static files
    const staticPath = path.join(__dirname, '../dist/public', req.path);
    if (fs.existsSync(staticPath) && fs.statSync(staticPath).isFile()) {
      return res.sendFile(staticPath);
    }
    next();
  });

  // Serve index.html for all non-API routes (SPA routing)
  app.use((_req, res) => {
    res.sendFile(path.join(__dirname, '../dist/public/index.html'));
  });

  app.listen(config.port, () => {
    logger.info(`Server running on port ${config.port}`);
    logger.info(`API docs: http://localhost:${config.port}/api-docs`);
  });
}

// Global error handler middleware
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error('Unhandled error', err);
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason: unknown, promise: Promise<unknown>) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error: Error) => {
  logger.error('Uncaught Exception:', error);
  // Attempt graceful shutdown
  process.exit(1);
});

bootstrap().catch((error: unknown) => {
  logger.error('Fatal error during startup', error as Error);
  process.exit(1);
});
