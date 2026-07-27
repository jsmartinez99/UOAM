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
  {
    name: 'Carlos Centurión',
    dimensions: {
      organology: ['Grand Piano', 'Tenor Sax', 'Trombone', 'Upright Bass', 'Paraguayan Percussion'],
      harmony: ['Quartal Voicings', 'Maj9(#11)', 'Paraguayan Folklore Jazz Fusion', 'SubTritone Substitutions'],
      counterpoint: ['Polyrhythmic Counterpoint', '3rds/6ths Parallel Lines', 'Call and Response Fills'],
      texture: ['Harp-like Piano Cascades', '3-Layer Stratification', '6/8 vs 3/4 Polyrhythmic Texture'],
      rhythm: ['Sesquiáltera (6/8 vs 3/4)', 'Kyre\'y Syncopation', 'Polka Paraguaya Groove', 'Jazz Swing Fusion'],
      taste: ['Cascada & McCoy Voicing', 'Paraguayan Jazz Identity', 'Respect for Folcloric Rhythm'],
    },
  },
  {
    name: 'Nelson Riddle',
    dimensions: {
      organology: ['Violins', 'Saxes', 'Brass Section', 'Flutes'],
      harmony: ['Added 6th chords', 'Major 7ths', 'Smooth Chromatic Steps'],
      counterpoint: ['3-4 Voice Independent Saxes', 'Call and Response'],
      texture: ['Riddle Lift', 'Lush Strings', 'Dense Saxes'],
      rhythm: ['Relaxed Swing', 'Riddle Kick', 'Walking Bass'],
      taste: ['Riddle Lift', 'Frank Sinatra Sound', 'Classic Capitol Style'],
    },
  },
  {
    name: 'Henry Mancini',
    dimensions: {
      organology: ['Flute', 'Harmon Muted Trumpet', 'Strings', 'Percussion'],
      harmony: ['Tonal Middle of the Road', 'Altered Dominants', 'Modal Touches'],
      counterpoint: ['Subtle Woodwind Answers', 'Lyrical Counter-melodies'],
      texture: ['Transparent Density', 'Spacious Intervals', 'Movie Themes'],
      rhythm: ['Bossa Nova', 'Light Swing', 'Samba'],
      taste: ['Pink Panther Vibe', 'Moon River Lyricism', 'Harmon Mute'],
    },
  },
  {
    name: 'Sammy Nestico',
    dimensions: {
      organology: ['Count Basie Big Band', 'Brass Section', 'Saxes', 'Rhythm Section'],
      harmony: ['Clean Extended Jazz Harmony', '9ths and 13ths', 'Functional Cadences'],
      counterpoint: ['Sectional Homophony', 'Clean Brass Attacks'],
      texture: ['Symmetrical Brass', 'Crisp Tutti Sections'],
      rhythm: ['Basie Swing', 'Driving Pulse', 'Hi-Hat 2 and 4'],
      taste: ['Basie Ending', 'Nestico Simplicity', 'Straight Ahead Swing'],
    },
  },
  {
    name: 'Thad Jones',
    dimensions: {
      organology: ['Big Band', 'Flugelhorn', 'Dense Brass', 'Saxes'],
      harmony: ['Dissonant Voicings', 'Altered Chords', 'Cluster Harmonies'],
      counterpoint: ['Complex Polyphonic Lines', 'Off-beat Interjections'],
      texture: ['Dense and Complex', 'Unusual Voicing Spacing'],
      rhythm: ['Off-beat Syncopation', 'Modern Big Band Groove'],
      taste: ['Thad Jones Voicing', 'Unconventional Accents', 'Modern Jazz'],
    },
  },
  {
    name: 'Clare Fischer',
    dimensions: {
      organology: ['Electric Piano', 'Vocal Ensemble', 'Latin Percussion', 'Strings'],
      harmony: ['Dense Harmonic Voicings', 'Complex Alterations', 'Reharmonization'],
      counterpoint: ['Vocal Counterpoint', 'Inner Line Movement'],
      texture: ['Choral Density', 'Harmonic Thickness'],
      rhythm: ['Latin Jazz', 'Bossa Nova', 'Complex Micro-timing'],
      taste: ['Fischer Harmonies', 'Hi-Lo\'s Vocal Style', 'Latin Fusion'],
    },
  },
  {
    name: 'Maria Schneider',
    dimensions: {
      organology: ['Large Jazz Orchestra', 'Accordion', 'Soprano Sax', 'Strings'],
      harmony: ['Impressionistic Modal', 'Extended Tonalities', 'Coloristic Harmony'],
      counterpoint: ['Polyphonic Weaving', 'Long Evolving Lines'],
      texture: ['Expansive Acoustic Textures', 'Continuous Growth', 'Tone Poems'],
      rhythm: ['Fluid Meter', 'Rubato Waves', 'Subtle Pulse'],
      taste: ['Schneider Color', 'Ethereal Waves', 'Gil Evans Heritage'],
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

  // ── Arranger profiles (Idempotent by name) ──
  for (const p of ARRANGER_PROFILES) {
    const existing = await arrangerRepo.findOne({ where: { name: p.name } });
    if (!existing) {
      const entity = arrangerRepo.create({
        name: p.name,
        dimensions: p.dimensions,
      });
      await arrangerRepo.save(entity);
      logger.info(`[seed] Seeded profile: ${p.name}`);
    }
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
