import { QdrantClient } from '@qdrant/js-client-rest';
import { VectorDatabaseClient, VectorSearchHit } from '../../ports/vector-database.port.js';
import { logger } from '../logger.js';

export class QdrantAdapter implements VectorDatabaseClient {
  private client: QdrantClient;

  constructor(url: string = process.env.QDRANT_URL || 'http://localhost:6333') {
    this.client = new QdrantClient({ url });
  }

  async ensureCollection(collectionName: string, vectorSize: number = 6): Promise<void> {
    try {
      const collections = await this.client.getCollections();
      const exists = collections.collections.some(c => c.name === collectionName);
      
      if (!exists) {
        await this.client.createCollection(collectionName, {
          vectors: {
            size: vectorSize,
            distance: 'Cosine',
          },
        });
        logger.info(`Collection ${collectionName} created in Qdrant.`);
      }
    } catch (error: unknown) {
      logger.error('Error ensuring Qdrant collection:', error as Error);
    }
  }

  async search(
    collectionName: string,
    params: {
      vector: number[];
      limit: number;
      score_threshold?: number;
    }
  ): Promise<VectorSearchHit[]> {
    try {
      const results = await this.client.search(collectionName, {
        vector: params.vector,
        limit: params.limit,
        score_threshold: params.score_threshold,
      });

      return results.map(hit => ({
        id: hit.id,
        score: hit.score,
        payload: hit.payload || {},
      }));
    } catch (error: unknown) {
      logger.error('Error searching in Qdrant:', error as Error);
      return [];
    }
  }

  async upsert(
    collectionName: string,
    points: Array<{
      id: string | number;
      vector: number[];
      payload: Record<string, unknown>;
    }>
  ): Promise<void> {
    try {
      await this.client.upsert(collectionName, {
        wait: true,
        points: points.map(p => ({
          id: p.id,
          vector: p.vector,
          payload: p.payload,
        })),
      });
    } catch (error: unknown) {
      logger.error('Error upserting to Qdrant:', error as Error);
    }
  }
}