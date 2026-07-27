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

// Extender Request para incluir user
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: { id: string; email: string; role: string };
      musicFile?: { buffer: Buffer; mimetype: string; originalname: string };
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
   *     responses:
   *       200:
   *         description: Lista de arreglistas
   */
   async function getAllArrangers(_req: Request, res: Response): Promise<Response> {
     try {
       const repo = AppDataSource.getRepository(ArrangerProfileEntity);
       const arrangers = await repo.find();
       return res.json(arrangers);
     } catch (error: unknown) {
       const err = error as Error;
       return res.status(500).json({ error: err.message });
     }
   }

   async function createArranger(req: Request, res: Response): Promise<Response> {
     try {
       const { name, dimensions } = req.body;
       const profile = new ArrangerProfile(name, dimensions as Dimensions6D);
       
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
     } catch (error: unknown) {
       const err = error as Error;
       return res.status(400).json({ error: err.message });
     }
   }

  // ── Hibridación ──

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

        const profiles = profilesData.map((p: ArrangerProfileEntity) => new ArrangerProfile(p.name, p.dimensions, p.id));

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

    async function uploadArrangement(req: Request, res: Response): Promise<Response> {
      try {
        if (!req.musicFile) {
          return res.status(400).json({ error: 'No se proporcionó archivo' });
        }

        const result = await MusicFileAnalyzer.analyze(req.musicFile.buffer, req.musicFile.mimetype, req.musicFile.originalname);

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

  return {
    getAllArrangers,
    createArranger,
    hybridizeProfiles,
    searchSimilar,
    generateAnalysis,
    registerUser,
    loginUser,
    uploadArrangement,
  };
}
