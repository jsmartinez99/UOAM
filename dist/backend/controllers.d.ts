import { Request, Response, NextFunction } from 'express';
import { VectorDatabaseClient } from '../ports/vector-database.port.js';
import { LLMClient } from '../ports/llm-client.port.js';
declare global {
    namespace Express {
        interface Request {
            user?: {
                id: string;
                email: string;
                role: string;
            };
        }
    }
}
export interface AppDependencies {
    qdrantClient: VectorDatabaseClient;
    llmClient: LLMClient;
    jwtSecret: string;
}
export declare function authenticateToken(req: Request, res: Response, next: NextFunction): void;
export declare function authorizeRole(requiredRole: string): (req: Request, res: Response, next: NextFunction) => Response | void;
export declare function createArrangerController(dependencies: AppDependencies): {
    getAllArrangers: (_req: Request, res: Response) => Promise<Response>;
    createArranger: (req: Request, res: Response) => Promise<Response>;
    hybridizeProfiles: (req: Request, res: Response) => Promise<Response>;
    searchSimilar: (req: Request, res: Response) => Promise<Response>;
    generateAnalysis: (req: Request, res: Response) => Promise<Response>;
    registerUser: (req: Request, res: Response) => Promise<Response>;
    loginUser: (req: Request, res: Response) => Promise<Response>;
    uploadArrangement: (req: Request, res: Response) => Promise<Response>;
};
//# sourceMappingURL=controllers.d.ts.map