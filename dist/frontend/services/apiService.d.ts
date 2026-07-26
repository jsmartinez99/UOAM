import { ArrangerProfile, Dimensions6D } from '../../domain/arranger-profile';
import { HybridResult, SearchResult, AnalysisReport } from '../../types/api-types';
export declare const apiService: {
    getArrangers(): Promise<ArrangerProfile[]>;
    createArranger(name: string, dimensions: Dimensions6D): Promise<ArrangerProfile>;
    hybridizeProfiles(profileIds: string[]): Promise<HybridResult>;
    searchSimilar(vector: number[]): Promise<SearchResult[]>;
    generateAnalysis(context: {
        arranger: string;
        confidence: number;
        matchedDimension: string;
    }): Promise<AnalysisReport>;
    uploadArrangement(file: File): Promise<ArrangerProfile>;
    register(email: string, password: string, role?: "STANDARD" | "ARRANGER" | "ADMIN"): Promise<{
        id: string;
        email: string;
        role: string;
    }>;
    login(email: string, password: string): Promise<{
        token: string;
        user: any;
    }>;
};
//# sourceMappingURL=apiService.d.ts.map