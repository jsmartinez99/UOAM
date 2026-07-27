import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { ArrangerProfile, Dimensions6D } from '../domain/arranger-profile.js';
import { HybridEngine } from '../engines/hybrid-engine.js';
import { QdrantSearchEngine } from '../engines/qdrant-search-engine.js';
import { LLMIntegrationService } from '../services/llm-integration.service.js';
import { UserService } from '../services/user.service.js';
import { MusicFileAnalyzer } from '../services/music-file-analyzer.service.js';
import { VectorDatabaseClient } from '../ports/vector-database.port.js';
import { LLMClient } from '../ports/llm-client.port.js';
import { AppDataSource } from '../infrastructure/database/data-source.js';
import { ArrangerProfileEntity } from '../infrastructure/database/entities/arranger-profile.entity.js';
import { In } from 'typeorm';
import { logger } from '../infrastructure/logger.js';
import { StandaloneArrangerService } from '../services/standalone-arranger.service.js';
import { requireStringField, BadRequestError } from './http-helpers.js';
import { MusicXMLExporterService } from '../services/musicxml-exporter.service.js';

// Extender Request para incluir user
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: { id: string; email: string; role: string };
    }
  }
}

// ─── Tipos de aplicación ────────────────────────────────────────────

export interface AppDependencies {
  qdrantClient: VectorDatabaseClient;
  llmClient: LLMClient;
  jwtSecret: string;
}

// ─── Middleware de autenticación ─────────────────────────────────

export function authenticateToken(dependencies: AppDependencies) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      res.status(401).json({ error: 'Token de autenticación requerido' });
      return;
    }

    jwt.verify(token, dependencies.jwtSecret, (err, user) => {
      if (err) {
        res.status(403).json({ error: 'Token inválido' });
        return;
      }

      req.user = user as { id: string; email: string; role: string };
      next();
    });
  };
}

// ─── Middleware de autorización RBAC ──────────────────────────────

export function authorizeRole(requiredRole: string) {
  return (req: Request, res: Response, next: NextFunction): Response | void => {
    if (!req.user) {
      return res.status(401).json({ error: 'Autenticación requerida' });
    }

    if (req.user.role !== requiredRole && req.user.role !== 'ADMIN') {
      return res.status(403).json({
        error: `Rol '${req.user.role}' no autorizado para esta operación`, 
      });
    }

    next();
  };
}

// ─── Tipos de controladores ────────────────────────────────────────

interface ArrangerController {
  getAllArrangers: (req: Request, res: Response) => Promise<Response>;
  createArranger: (req: Request, res: Response) => Promise<Response>;
  hybridizeProfiles: (req: Request, res: Response) => Promise<Response>;
  searchSimilar: (req: Request, res: Response) => Promise<Response>;
  generateAnalysis: (req: Request, res: Response) => Promise<Response>;
  registerUser: (req: Request, res: Response) => Promise<Response>;
  loginUser: (req: Request, res: Response) => Promise<Response>;
  uploadArrangement: (req: Request, res: Response) => Promise<Response>;
  generateStandaloneArrangement: (req: Request, res: Response) => Promise<Response>;
  exportMusicXML: (req: Request, res: Response) => Promise<void>;
}

// ─── Controladores ─────────────────────────────────────────────────

export function createArrangerController(
  dependencies: AppDependencies,
): ArrangerController {
  const hybridEngine = new HybridEngine();
  const searchEngine = new QdrantSearchEngine(dependencies.qdrantClient);
  const llmService = new LLMIntegrationService(dependencies.llmClient);
  const userService = new UserService();

  // ── Arreglistas ──

  /**
   * @swagger
   * /api/v1/arrangers:
   *   get:
   *     summary: Obtiene todos los arreglistas
   *     description: Retorna el catálogo completo de perfiles con sus firmas 6D.
   *     responses:
   *       '200':
   *         description: Lista de arreglistas
   *   post:
   *     summary: Crea un nuevo arreglista en el catálogo
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [name, dimensions]
   *             properties:
   *               name: { type: string }
   *               dimensions: { $ref: '#/components/schemas/Dimensions6D' }
   *     responses:
   *       '201':
   *         description: Perfil creado
   *       '400':
   *         description: Validación fallida
   */
    async function getAllArrangers(req: Request, res: Response): Promise<Response> {
      try {
        const repo = AppDataSource.getRepository(ArrangerProfileEntity);
        const { page, limit } = req.query;

        if (page !== undefined || limit !== undefined) {
          const pageNum = parseInt(page as string, 10) || 1;
          const limitNum = parseInt(limit as string, 10) || 10;
          const skip = (pageNum - 1) * limitNum;

          const [data, total] = await repo.findAndCount({
            skip,
            take: limitNum,
          });

          const sanitizedData = data.map((a) => ({
            ...a,
            dimensions: typeof a.dimensions === 'string' ? JSON.parse(a.dimensions) : a.dimensions,
          }));

          return res.json({
            data: sanitizedData,
            total,
            page: pageNum,
            limit: limitNum,
            totalPages: Math.ceil(total / limitNum),
          });
        }

        const arrangers = await repo.find();
        const sanitizedArrangers = arrangers.map((a) => ({
          ...a,
          dimensions: typeof a.dimensions === 'string' ? JSON.parse(a.dimensions) : a.dimensions,
        }));
        return res.json(sanitizedArrangers);
      } catch (error: unknown) {
        const err = error as Error;
        return res.status(500).json({ error: err.message });
      }
    }

    async function createArranger(req: Request, res: Response): Promise<Response> {
      const name = requireStringField(req.body, 'name');
      const dimensions = (req.body as Record<string, unknown>).dimensions as Dimensions6D | undefined;
      if (!dimensions || typeof dimensions !== 'object') {
        throw new BadRequestError('Campo requerido: dimensions');
      }
      const profile = new ArrangerProfile(name, dimensions);

      const repo = AppDataSource.getRepository(ArrangerProfileEntity);
      const entity = repo.create({
        id: profile.id,
        name: profile.name,
        dimensions: profile.dimensions
      });
      await repo.save(entity);

      // Index in Qdrant
      if (dependencies.qdrantClient.upsert) {
        const vector = Object.values(profile.toDimensionSummary());
        await dependencies.qdrantClient.upsert('arrangements_collection', [{
          id: profile.id,
          vector,
          payload: { name: profile.name }
        }]);
      }

      return res.status(201).json(profile);
    }

  // ── Hibridación ──

  /**
   * @swagger
   * /api/v1/hybridize:
   *   post:
   *     summary: Combina perfiles de arreglistas en un perfil híbrido
   *     description: Fusiona las firmas 6D de dos o más arreglistas usando el motor AST.
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [profileIds]
   *             properties:
   *               profileIds:
   *                 type: array
   *                 items: { type: string }
   *                 minItems: 2
   *     responses:
   *       '200':
   *         description: Perfil híbrido generado
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 mergedProfile: { $ref: '#/components/schemas/Dimensions6D' }
   *                 resolutionLog: { type: array, items: { type: string } }
   *       '400':
   *         description: Se requieren al menos 2 perfiles válidos
   */
   async function hybridizeProfiles(req: Request, res: Response): Promise<Response> {
     try {
       const { profileIds } = req.body;
       // Sanitize input before logging
       const sanitizedProfileIds = Array.isArray(profileIds) 
        ? profileIds.map(id => String(id).replace(/[\r\n]/g, '')) 
        : String(profileIds).replace(/[\r\n]/g, '');
      logger.info(`Hibridando perfiles: ${sanitizedProfileIds}`);
        
       const repo = AppDataSource.getRepository(ArrangerProfileEntity);
       const profilesData = await repo.findBy({ id: In(profileIds) });
       
       if (profilesData.length < 2) {
         return res.status(400).json({
           error: 'Se requieren al menos 2 perfiles válidos para hibridación',
         });
       }

         const profiles = profilesData.map((p: ArrangerProfileEntity) => {
           const dims = typeof p.dimensions === 'string' ? JSON.parse(p.dimensions) : p.dimensions;
           return new ArrangerProfile(p.name, dims, p.id);
         });

       const result = hybridEngine.mergeFullSignatures(
         profiles[0].dimensions,
         profiles[1].dimensions,
       );

       return res.json(result);
     } catch (error: unknown) {
       const err = error as Error;
       return res.status(400).json({ error: err.message });
     }
   }

  // ── Búsqueda semántica ──

  /**
   * @swagger
   * /api/v1/search:
   *   post:
   *     summary: Búsqueda por similitud vectorial KNN
   *     description: Devuelve los K arreglistas más similares a un vector de embedding.
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [vector]
   *             properties:
   *               vector:
   *                 type: array
   *                 items: { type: number }
   *                 minItems: 6
   *     responses:
   *       '200':
   *         description: Lista de coincidencias ordenadas por score
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 type: object
   *                 properties:
   *                   arranger: { type: string }
   *                   score: { type: number }
   *                   matchedDimension: { type: string }
   */
   async function searchSimilar(req: Request, res: Response): Promise<Response> {
     try {
       const { vector } = req.body;
       const results = await searchEngine.searchSimilar(vector);
       return res.json(results);
     } catch (error: unknown) {
       const err = error as Error;
       return res.status(400).json({ error: err.message });
     }
   }

  // ── Análisis LLM ──

  /**
   * @swagger
   * /api/v1/analyze:
   *   post:
   *     summary: Genera un análisis RAG contextual
   *     description: Genera un reporte usando el LLM con un contexto RAG pre-recuperado.
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [context]
   *             properties:
   *               context:
   *                 type: object
   *                 required: [arranger, confidence, matchedDimension]
   *                 properties:
   *                   arranger: { type: string }
   *                   confidence: { type: number, minimum: 0, maximum: 1 }
   *                   matchedDimension: { type: string }
   *     responses:
   *       '200':
   *         description: Reporte de análisis generado
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 content: { type: string }
   *                 context: { type: object }
   *                 generatedAt: { type: string, format: date-time }
   */
   async function generateAnalysis(req: Request, res: Response): Promise<Response> {
     try {
       const { context } = req.body;
       const report = await llmService.generateArrangementReport(context);
       return res.json(report);
     } catch (error: unknown) {
       const err = error as Error;
       return res.status(400).json({ error: err.message });
     }
   }

  // ── Autenticación ──

  /**
   * @swagger
   * /api/v1/auth/register:
   *   post:
   *     summary: Registra un nuevo usuario
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [email, password]
   *             properties:
   *               email: { type: string, format: email }
   *               password: { type: string, minLength: 8 }
   *               role: { type: string, enum: [STANDARD, ARRANGER, ADMIN] }
   *     responses:
   *       '201':
   *         description: Usuario creado
   *       '400':
   *         description: Validación fallida
   */
   async function registerUser(req: Request, res: Response): Promise<Response> {
     try {
       const { email, password, role } = req.body;
       const user = await userService.registerUser(email, password, role);
       return res.status(201).json(user);
     } catch (error: unknown) {
       const err = error as Error;
       return res.status(400).json({ error: err.message });
     }
   }

  /**
   * @swagger
   * /api/v1/auth/login:
   *   post:
   *     summary: Autentica y devuelve un JWT
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [email, password]
   *             properties:
   *               email: { type: string }
   *               password: { type: string }
   *     responses:
   *       '200':
   *         description: Token JWT y datos del usuario
   *       '401':
   *         description: Credenciales inválidas
   */
   async function loginUser(req: Request, res: Response): Promise<Response> {
     try {
       const { email, password } = req.body;
       if (!email || !password) {
         return res.status(400).json({ error: 'Email y contraseña requeridos' });
       }

       const user = await userService.verifyCredentials(email, password);
       if (!user) {
         return res.status(401).json({ error: 'Credenciales inválidas' });
       }

       const token = jwt.sign(
         { id: user.id, email: user.email, role: user.role },
         dependencies.jwtSecret,
         { expiresIn: '1h' },
       );

       return res.json({ token, user: { id: user.id, email: user.email, role: user.role } });
     } catch (error: unknown) {
       const err = error as Error;
       return res.status(400).json({ error: err.message });
     }
   }

  // ── Ingesta de archivos musicales ──

  /**
   * @swagger
   * /api/v1/upload:
   *   post:
   *     summary: Sube un archivo MusicXML o MIDI para extraer firma 6D
   *     requestBody:
   *       required: true
   *       content:
   *         multipart/form-data:
   *           schema:
   *             type: object
   *             properties:
   *               musicFile:
   *                 type: string
   *                 format: binary
   *     responses:
   *       '201':
   *         description: Perfil creado a partir del archivo
   *       '400':
   *         description: Formato no soportado o archivo ausente
   */
     async function uploadArrangement(req: Request, res: Response): Promise<Response> {
      try {
        const file = req.file;
        if (!file) {
          return res.status(400).json({ error: 'No se proporcionó archivo' });
        }

        const result = await MusicFileAnalyzer.analyze(file.buffer, file.mimetype, file.originalname);

       // Crear perfil con nombre sugerido
       const suggestedName = MusicFileAnalyzer.suggestName(result.dimensions, result.metadata);
       const profile = new ArrangerProfile(suggestedName, result.dimensions);

       // Guardar en base de datos
       const repo = AppDataSource.getRepository(ArrangerProfileEntity);
       const entity = repo.create({
         id: profile.id,
         name: profile.name,
         dimensions: profile.dimensions,
       });
       await repo.save(entity);

       // Indexar en Qdrant
       if (dependencies.qdrantClient.upsert) {
         const vector = Object.values(profile.toDimensionSummary());
         await dependencies.qdrantClient.upsert('arrangements_collection', [{
           id: profile.id,
           vector,
           payload: { name: profile.name }
         }]);
       }

       return res.status(201).json(profile);
     } catch (error: unknown) {
       const err = error as Error;
       return res.status(400).json({ error: err.message });
     }
   }

   async function generateStandaloneArrangement(req: Request, res: Response): Promise<Response> {
     try {
       const { title, keyCenter, tempoBpm, timeSignature, profileId, dimensionsOverride } = req.body || {};
       let targetArrangerProfile: ArrangerProfile | undefined;

       if (profileId) {
         const repo = AppDataSource.getRepository(ArrangerProfileEntity);
         const entity = await repo.findOne({ where: { id: profileId } });
         if (entity) {
           targetArrangerProfile = new ArrangerProfile(entity.name, entity.dimensions, entity.id);
         }
       }

       const arrangerService = new StandaloneArrangerService();
       const result = arrangerService.generateArrangement({
         title,
         keyCenter,
         tempoBpm,
         timeSignature,
         targetArrangerProfile,
         dimensionsOverride,
       });

       return res.status(200).json(result);
     } catch (error: unknown) {
       const err = error as Error;
       return res.status(400).json({ error: err.message });
     }
   }

   async function exportMusicXML(req: Request, res: Response): Promise<void> {
     try {
       const arrangement = req.body;
       if (!arrangement || !arrangement.sections) {
         res.status(400).json({ error: 'Arreglo inválido o ausente' });
         return;
       }

       const exporter = new MusicXMLExporterService();
       const xml = exporter.exportToMusicXML(arrangement);

       res.setHeader('Content-Type', 'application/xml');
       res.setHeader('Content-Disposition', `attachment; filename="${arrangement.title || 'arrangement'}.musicxml"`);
       res.status(200).send(xml);
     } catch (error: unknown) {
       const err = error as Error;
       res.status(400).json({ error: err.message });
     }
   }

  return {
    getAllArrangers,
    createArranger,
    hybridizeProfiles,
    searchSimilar,
    generateAnalysis,
    registerUser,
    loginUser,
    uploadArrangement,
    generateStandaloneArrangement,
    exportMusicXML,
  };
}
