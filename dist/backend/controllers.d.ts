import { Request, Response, NextFunction } from 'express';
import { VectorDatabaseClient } from '../ports/vector-database.port.js';
import { LLMClient } from '../ports/llm-client.port.js';
export interface AppDependencies {
    qdrantClient: VectorDatabaseClient;
    llmClient: LLMClient;
    jwtSecret: string;
}
export declare function authenticateToken(req: Request, res: Response, next: NextFunction): Response<any, Record<string, any>> | undefined;
export declare function authorizeRole(requiredRole: string): (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
export declare function createArrangerController(dependencies: AppDependencies): {
    getAllArrangers: (req: Request, res: Response) => Promise<void>;
    createArranger: (req: Request, res: Response) => Promise<void>;
    hybridizeProfiles: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
    searchSimilar: (req: Request, res: Response) => Promise<void>;
    generateAnalysis: (req: Request, res: Response) => Promise<void>;
    registerUser: (req: Request, res: Response) => Promise<void>;
    loginUser: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
};
//# sourceMappingURL=controllers.d.ts.map