import jwt from 'jsonwebtoken';
import { ArrangerProfile } from '../domain/arranger-profile.js';
import { HybridEngine } from '../engines/hybrid-engine.js';
import { QdrantSearchEngine } from '../engines/qdrant-search-engine.js';
import { LLMIntegrationService } from '../services/llm-integration.service.js';
import { UserService } from '../services/user.service.js';
import { MusicFileAnalyzer } from '../services/music-file-analyzer.service.js';
import { AppDataSource } from '../infrastructure/database/data-source.js';
import { ArrangerProfileEntity } from '../infrastructure/database/entities/arranger-profile.entity.js';
import { In } from 'typeorm';
// ─── Middleware de autenticación ─────────────────────────────────
export function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
        res.status(401).json({ error: 'Token de autenticación requerido' });
        return;
    }
    jwt.verify(token, process.env.JWT_SECRET || 'dev-secret', (err, user) => {
        if (err) {
            res.status(403).json({ error: 'Token inválido' });
            return;
        }
        req.user = user;
        next();
    });
}
// ─── Middleware de autorización RBAC ──────────────────────────────
export function authorizeRole(requiredRole) {
    return (req, res, next) => {
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
export function createArrangerController(dependencies) {
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
    async function getAllArrangers(_req, res) {
        try {
            const repo = AppDataSource.getRepository(ArrangerProfileEntity);
            const arrangers = await repo.find();
            return res.json(arrangers);
        }
        catch (error) {
            return res.status(500).json({ error: error.message });
        }
    }
    async function createArranger(req, res) {
        try {
            const { name, dimensions } = req.body;
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
        catch (error) {
            return res.status(400).json({ error: error.message });
        }
    }
    // ── Hibridación ──
    async function hybridizeProfiles(req, res) {
        try {
            const { profileIds } = req.body;
            // Sanitize input before logging
            const sanitizedProfileIds = Array.isArray(profileIds)
                ? profileIds.map(id => String(id).replace(/[\r\n]/g, ''))
                : String(profileIds).replace(/[\r\n]/g, '');
            console.log(`Hibridando perfiles: ${sanitizedProfileIds}`);
            const repo = AppDataSource.getRepository(ArrangerProfileEntity);
            const profilesData = await repo.findBy({ id: In(profileIds) });
            if (profilesData.length < 2) {
                return res.status(400).json({
                    error: 'Se requieren al menos 2 perfiles válidos para hibridación',
                });
            }
            const profiles = profilesData.map((p) => new ArrangerProfile(p.name, p.dimensions, p.id));
            const result = hybridEngine.mergeFullSignatures(profiles[0].dimensions, profiles[1].dimensions);
            return res.json(result);
        }
        catch (error) {
            return res.status(400).json({ error: error.message });
        }
    }
    // ── Búsqueda semántica ──
    async function searchSimilar(req, res) {
        try {
            const { vector } = req.body;
            const results = await searchEngine.searchSimilar(vector);
            return res.json(results);
        }
        catch (error) {
            return res.status(400).json({ error: error.message });
        }
    }
    // ── Análisis LLM ──
    async function generateAnalysis(req, res) {
        try {
            const { context } = req.body;
            const report = await llmService.generateArrangementReport(context);
            return res.json(report);
        }
        catch (error) {
            return res.status(400).json({ error: error.message });
        }
    }
    // ── Autenticación ──
    async function registerUser(req, res) {
        try {
            const { email, password, role } = req.body;
            const user = await userService.registerUser(email, password, role);
            return res.status(201).json(user);
        }
        catch (error) {
            return res.status(400).json({ error: error.message });
        }
    }
    async function loginUser(req, res) {
        try {
            const { email, password } = req.body;
            // Usar password para verificar (simulado)
            if (!password)
                return res.status(400).json({ error: 'Contraseña requerida' });
            const user = await userService.findByEmail(email);
            if (!user) {
                return res.status(401).json({ error: 'Credenciales inválidas' });
            }
            // En producción: verificar hash de contraseña
            const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, dependencies.jwtSecret, { expiresIn: '1h' });
            return res.json({ token });
        }
        catch (error) {
            return res.status(400).json({ error: error.message });
        }
    }
    // ── Ingesta de archivos musicales ──
    async function uploadArrangement(req, res) {
        try {
            if (!req.file) {
                return res.status(400).json({ error: 'No se proporcionó archivo' });
            }
            const result = await MusicFileAnalyzer.analyze(req.file.buffer, req.file.mimetype, req.file.originalname);
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
        }
        catch (error) {
            return res.status(400).json({ error: error.message });
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
//# sourceMappingURL=controllers.js.map