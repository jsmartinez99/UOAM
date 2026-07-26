import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { ArrangerProfile, Dimensions6D } from '../domain/arranger-profile.js';
import { HybridEngine } from '../engines/hybrid-engine.js';
import { QdrantSearchEngine } from '../engines/qdrant-search-engine.js';
import { LLMIntegrationService } from '../services/llm-integration.service.js';
import { UserService } from '../services/user.service.js';
import { VectorDatabaseClient } from '../ports/vector-database.port.js';
import { LLMClient } from '../ports/llm-client.port.js';

// ─── Tipos de aplicación ────────────────────────────────────────────

export interface AppDependencies {
  qdrantClient: VectorDatabaseClient;
  llmClient: LLMClient;
  jwtSecret: string;
}

// ─── Middleware de autenticación ─────────────────────────────────

export function authenticateToken(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token de autenticación requerido' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'dev-secret', (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Token inválido' });
    }

    if (req.user) {
      req.user = user as { id: string; email: string; role: string };
      next();
    }
  });
}

// ─── Middleware de autorización RBAC ──────────────────────────────

export function authorizeRole(requiredRole: string) {
  return (req: Request, res: Response, next: NextFunction) => {
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

// ─── Controladores ─────────────────────────────────────────────────

export function createArrangerController(
  dependencies: AppDependencies,
) {
  const hybridEngine = new HybridEngine();
  const searchEngine = new QdrantSearchEngine(dependencies.qdrantClient);
  const llmService = new LLMIntegrationService(dependencies.llmClient);
  const userService = new UserService();

  // ── Arreglistas ──

  async function getAllArrangers(req: Request, res: Response) {
    // En una implementación real, esto iría a un repositorio
    res.json([]);
  }

  async function createArranger(req: Request, res: Response) {
    try {
      const { name, dimensions } = req.body;
      const profile = new ArrangerProfile(name, dimensions as Dimensions6D);
      // Guardar en repositorio
      res.status(201).json(profile);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  // ── Hibridación ──

  async function hybridizeProfiles(req: Request, res: Response) {
    try {
      const { profileIds } = req.body;
      // Recuperar perfiles de repositorio
      const profiles: ArrangerProfile[] = []; // Mock

      if (profiles.length < 2) {
        return res.status(400).json({
          error: 'Se requieren al menos 2 perfiles para hibridación',
        });
      }

      const result = hybridEngine.mergeFullSignatures(
        profiles[0].dimensions,
        profiles[1].dimensions,
      );

      res.json(result);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  // ── Búsqueda semántica ──

  async function searchSimilar(req: Request, res: Response) {
    try {
      const { vector } = req.body;
      const results = await searchEngine.searchSimilar(vector);
      res.json(results);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  // ── Análisis LLM ──

  async function generateAnalysis(req: Request, res: Response) {
    try {
      const { context } = req.body;
      const report = await llmService.generateArrangementReport(context);
      res.json(report);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  // ── Autenticación ──

  async function registerUser(req: Request, res: Response) {
    try {
      const { email, password, role } = req.body;
      const user = await userService.registerUser(email, password, role);
      res.status(201).json(user);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async function loginUser(req: Request, res: Response) {
    try {
      const { email, password } = req.body;
      const user = userService.findByEmail(email);

      if (!user) {
        return res.status(401).json({ error: 'Credenciales inválidas' });
      }

      // En producción: verificar hash de contraseña
      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        dependencies.jwtSecret,
        { expiresIn: '1h' },
      );

      res.json({ token });
    } catch (error) {
      res.status(400).json({ error: error.message });
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
  };
}
