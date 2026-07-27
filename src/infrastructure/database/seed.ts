/**
 * Seed Idempotente: pobla la base de datos con perfiles de referencia y
 * cuentas de demo en cada arranque del servidor.
 *
 * - Sólo inserta los datos si la tabla está vacía (no duplica).
 * - Genera hashes bcrypt válidos para las contraseñas de demo.
 * - Registra cada nombre de arreglista en la colección vectorial de Qdrant.
 */

import bcrypt from 'bcryptjs';
import { AppDataSource } from './data-source.js';
import { ArrangerProfileEntity } from './entities/arranger-profile.entity.js';
import { QdrantAdapter } from '../qdrant/qdrant-client.js';
import { logger } from '../logger.js';

interface DemoUser {
  email: string;
  password: string;
  role: 'STANDARD' | 'ARRANGER' | 'ADMIN';
}

const DEMO_USERS: DemoUser[] = [
  { email: 'admin@uoam.com', password: 'Admin@1234', role: 'ADMIN' },
  { email: 'arranger@uoam.com', password: 'Arranger@1234', role: 'ARRANGER' },
  { email: 'standard@uoam.com', password: 'Standard@1234', role: 'STANDARD' },
];

const ARRANGER_PROFILES: Array<{ name: string; dimensions: Record<string, string[]> }> = [
  {
    name: 'Quincy Jones',
    dimensions: {
      organology: ['Big Band', 'Brass Section', 'Synths'],
      harmony: ['Extended Chords', 'Sus Chords', 'Modulations'],
      counterpoint: ['Horn Riffs', 'Call and Response', 'Walking Bass'],
      texture: ['Dense Brass', 'Layered Synths', 'Homophonic'],
      rhythm: ['Swing', 'Funk Groove', 'Syncopation'],
      taste: ['Q Groove', 'Swell', 'Brass Punch'],
    },
  },
  {
    name: 'Astor Piazzolla',
    dimensions: {
      organology: ['Bandoneon', 'Violin', 'Contrabass', 'Piano', 'Electric Guitar'],
      harmony: ['Minor Keys', 'Tension Chords', 'Chromaticism'],
      counterpoint: ['Fugue', 'Imitative Counterpoint', 'Ostinato'],
      texture: ['Contrapuntal', 'Polyphonic', 'Aggressive Divisi'],
      rhythm: ['3+3+2 Accentuation', 'Tango Nuevo rhythm', 'Rubato'],
      taste: ['Piazzolla Accent', 'Rubato Transitions', 'Bandoneon Solo'],
    },
  },
  {
    name: 'Duke Ellington',
    dimensions: {
      organology: ['Big Band', 'Brass Section', 'Woodwinds', 'Saxes'],
      harmony: ['Extended Chords', 'Tritone Substitutions', 'Blue Notes', 'Dissonant Harmony'],
      counterpoint: ['Independent Lines', 'Call and Response', 'Layered Voices', 'Strayhorn-style Voicings'],
      texture: ['Bespoke Orchestration', 'Section Solos', 'Sparse Sections', 'Tutti Brass'],
      rhythm: ['Swing', 'Stride', 'Latin', 'Rhumba'],
      taste: ['Ellington Dissonance', 'Such Sweet Thunder', 'Plush Jungle', 'Caravan'],
    },
  },
  {
    name: 'Billy Strayhorn',
    dimensions: {
      organology: ['Piano Trio', 'Strings', 'Big Band'],
      harmony: ['Quartal Voicings', 'Extended Chords', 'Chromatic Harmony'],
      counterpoint: ['Independent Lines', 'Bach-inspired'],
      texture: ['Lush Strings', 'Layered Harmonies'],
      rhythm: ['Ballad', 'Swing', 'Bossa Nova'],
      taste: ['Lush Life Ballad', 'Chelsea Bridge', 'A Train Style'],
    },
  },
  {
    name: 'Gil Evans',
    dimensions: {
      organology: ['French Horn', 'Tuba', 'Flute', 'English Horn', 'Strings'],
      harmony: ['Modal Harmony', 'Impressionistic Harmony', 'Block Voicings', 'Debussy Influence'],
      counterpoint: ['Tuba as Counter-melody', 'Independent Wind Lines'],
      texture: ['Tone Painting', 'Atmospheric Textures', 'Blurred Sections'],
      rhythm: ['Rubato', 'Modal Space', 'Sustained Pads'],
      taste: ['Gil Evans Texture', 'Sketches of Spain', 'Miles Ahead Sound'],
    },
  },
  {
    name: 'Claus Ogerman',
    dimensions: {
      organology: ['Strings', 'Woodwinds', 'Brass', 'Light Percussion'],
      harmony: ['Lush Voicings', 'Quartal Harmony', 'Complex Extensions'],
      counterpoint: ['Independent String Lines', 'Woodwind Doubling'],
      texture: ['Transparent Density', 'Lush Strings', 'Shimmering'],
      rhythm: ['Bossa Nova', 'Subtle Pulse', 'Baião'],
      taste: ['Ogerman Swell', 'Light Touch', 'Jobim Orchestration'],
    },
  },
];

export async function seedDatabase(qdrant?: QdrantAdapter): Promise<void> {
  try {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }
  } catch {
    // Already initialized
  }

  const arrangerRepo = AppDataSource.getRepository(ArrangerProfileEntity);

  // ── Demo users (idempotent via ON CONFLICT) ──
  for (const demo of DEMO_USERS) {
    const hashedPassword = await bcrypt.hash(demo.password, 12);
    // Use raw upsert for atomicity — avoids race between findOneBy and save.
    // gen_random_uuid() is built into Postgres 13+ (no extension needed).
    await AppDataSource.manager.query(
      `INSERT INTO users (id, email, "hashedPassword", role, "createdAt")
       VALUES (gen_random_uuid(), $1, $2, $3, NOW())
       ON CONFLICT (email) DO UPDATE
         SET "hashedPassword" = EXCLUDED."hashedPassword"
         WHERE users."hashedPassword" IS DISTINCT FROM EXCLUDED."hashedPassword"`,
      [demo.email, hashedPassword, demo.role],
    );
    logger.info(`[seed] Upserted demo user ${demo.email} (${demo.role})`);
  }

  // ── Arranger profiles ──
  const existingCount = await arrangerRepo.count();
  if (existingCount === 0) {
    for (const p of ARRANGER_PROFILES) {
      const entity = arrangerRepo.create({
        name: p.name,
        dimensions: p.dimensions,
      });
      await arrangerRepo.save(entity);
    }
    logger.info(`[seed] Seeded ${ARRANGER_PROFILES.length} arranger profiles`);
  } else {
    logger.info(`[seed] Skipping arranger seed (${existingCount} profiles already present)`);
  }

  // ── Qdrant indexing ──
  if (qdrant && typeof qdrant.upsert === 'function') {
    const all = await arrangerRepo.find();
    for (const profile of all) {
      const vec = Object.values(profile.dimensions).map((d: unknown) =>
        Array.isArray(d) ? d.length : 0,
      );
      try {
        await qdrant.upsert(process.env.QDRANT_COLLECTION || 'arrangements_collection', [
          {
            id: profile.id,
            vector: vec,
            payload: { name: profile.name },
          },
        ]);
      } catch (e) {
        logger.warn(`[seed] Qdrant upsert failed for ${profile.name}: ${(e as Error).message}`);
      }
    }
    logger.info(`[seed] Indexed ${all.length} profiles into Qdrant`);
  }
}
