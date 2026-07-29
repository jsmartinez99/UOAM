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
    name: 'Nelson Riddle',
    dimensions: {
      organology: ['5 Saxes (2 Alto, 2 Tenor, 1 Baritone doubling Flute/Clarinet)', '4 Trumpets (Harmon/Cup mutes)', '4 Trombones', '12-16 Strings (Violins/Violas/Cellos/Basses)', 'Acoustic Piano & Contrabass (No Electric Bass)'],
      harmony: ['Jazz Tonal Extendido', 'Acorde Sello C6 (6ª Añadida de Resolución)', 'Progresión I - VI7 - IIm7 - V7 - I', 'Tensiones Resueltas Siempre', 'Modulación por Ascenso de 2ª'],
      counterpoint: ['Contrapunto Real a 3-4 Voces en Saxofones', 'Alto 1 Melodía / Alto 2 Contracanto a 3ª y 6ª', 'Tenor 1 Movimiento Contrario', 'Líneas de Cámara Independientes'],
      texture: ['3 Capas Transparentes (Melodía, Relleno Armónico, Base Rítmica)', 'Entradas Graduales Acumulativas', 'Clímax Tutti en Último Chorus', 'Silencios de Frase de 2-4 Compases'],
      rhythm: ['Swing Feel Relajado (60/40 Ratio)', 'Walking Bass en Contrabajo con Cromatismos', 'Ride Cymbal Swing Pattern', 'Figura Sello: Riddle Kick (Corchea con Puntillo + Semicorchea)'],
      taste: ['Riddle Lift (Semicorchea de Violines Anticipando Downbeat)', 'Sutileza Armónica C6', 'Melodía como Ley Absoluta', 'Prefiere Sutileza al Impacto'],
    },
  },
  {
    name: 'Quincy Jones',
    dimensions: {
      organology: ['5 Saxes', '4 Trumpets (Plunger Mutes / Wah-wah)', '4 Trombones', 'Fender Rhodes & Clavinet', 'Funk Electric Bass & Chorus Guitar', 'Percusión Latina (Congas, Timbales, Shekere)', 'Minimoog Synths'],
      harmony: ['Blues/Funk Extendido & Modal', 'Acorde Sello m7(#5) (Menor con 5ª Aumentada)', 'Progresión Im7 - IV7 - bVII7 - bIII7', 'Sustituciones Tritonales de Norma', 'Pedal de Tensión de 16 Compases'],
      counterpoint: ['Riffs Sincopados Superpuestos', 'Polirritmia Melódica por Capas', 'Patrones Melódico-Rítmicos Entrelazados', 'Contraste Sección a Sección'],
      texture: ['Extremos: Hiperdensa o Minimalista (Voz + Bajo)', 'Cortes Súbitos a Silencio de 1 Compás', 'Tutti Acumulativo Final'],
      rhythm: ['Groove Funk Semicorcheado', 'Backbeat Fuerte en 2 y 4 con Ghost Notes', 'Acentos en Contratiempos (2+ y 4+)', 'Polirritmia 3/2 sobre 4/4'],
      taste: ['Quincy Crescendo (Crecimiento por Capas de Riffs sin subir Volumen)', 'Plunger Wah-wah Action', 'Ritmo como Rey Absoluto'],
    },
  },
  {
    name: 'Astor Piazzolla',
    dimensions: {
      organology: ['Bandoneón Solista', 'Violín Virtuoso', 'Contrabajo con Frullato/Golpe de Caja', 'Piano Acústico Performativo', 'Guitarra Eléctrica con Overdrive Suave'],
      harmony: ['Armonía Cromática de Tensión', 'Menor Melódica y Acordes de Fuga', 'Sustituciones Disminuidas y Disonantes', 'Clusters Modales de Tango Nuevo'],
      counterpoint: ['Fuga Bachiana en Tango', 'Contrapunto Imitativo a 3 Voces', 'Ostinato Contrapuntístico', 'Polifonía de Línea Solista'],
      texture: ['Polifónica Agresiva', 'Estratificación Rítmico-Tímbrica', 'Contraste Cantabile vs Percusivo', 'Divisi de Violín Violento'],
      rhythm: ['Acentuación Rítmica 3+3+2 (Tango Nuevo)', 'Síncopa Marcada en 6/8 y 4/4', 'Rubato Expresivo Dramático', 'Marcato en 4 Accentuato'],
      taste: ['Acento Piazzolleano', 'Transiciones Rubato a Marcato', 'Bandoneón Solo Soliloquio', 'Furia Tanguera'],
    },
  },
  {
    name: 'Duke Ellington',
    dimensions: {
      organology: ['Big Band', 'Brass Section (Plunger Mutes / Growl Trumpet)', 'Woodwinds & Saxes', 'Piano Stride Solista'],
      harmony: ['Extended Chords', 'Tritone Substitutions', 'Blue Notes & Dissonant Clusters', 'Acordes Estilo Strayhorn'],
      counterpoint: ['Líneas Independientes de Sección', 'Call and Response Africano', 'Voces Estratificadas', 'Contracanto de Trombón'],
      texture: ['Orquestación a la Medida (Bespoke Orchestration)', 'Solos de Sección', 'Plush Jungle Textures', 'Tutti Brass Punch'],
      rhythm: ['Swing Stride', 'Rhumba & Latin Grooves', 'Síncopa Africana', 'Backbeat Relajado'],
      taste: ['Disonancia Ellingtoniana', 'Plush Jungle Mood', 'Caravan Exoticism', 'Elegancia Swing'],
    },
  },
  {
    name: 'Billy Strayhorn',
    dimensions: {
      organology: ['Piano Trio', 'Lush Chamber Strings', 'Big Band Saxes', 'French Horn / Flute Doubles'],
      harmony: ['Quartal Voicings Modal', 'Extended Chords (maj9, #11, b13)', 'Armonía Cromática Impresionista', 'Sustituciones Elegantes'],
      counterpoint: ['Líneas Independientes Estilo Bach', 'Contrapunto de Maderas Lento', 'Movimiento Contrario Suave'],
      texture: ['Lush Strings (Cuerdas Voluptuosas)', 'Harmonías Estratificadas en Capas', 'Transparencia de Cámara'],
      rhythm: ['Ballad Rubato', 'Swing Sofisticado', 'Bossa Nova Suave', 'Tempo Lento de Balada'],
      taste: ['Estilo Lush Life', 'Atmósfera Chelsea Bridge', 'A-Train Precision', 'Sofisticación Melancólica'],
    },
  },
  {
    name: 'Gil Evans',
    dimensions: {
      organology: ['Flauta Baja & Clarinete Bajo', 'Fagot & Saxo Soprano', 'Trompa Francesa (Pilar)', 'Tuba (en vez de Trombón Bajo)', 'Percusión Tímbrica (Vibráfono, Gongs) - SIN VIOLINES'],
      harmony: ['Impresionista-Jazz (Debussy/Ravel)', 'Acorde Sello: Cluster Quintal sin 3ª (C-G-D-A-E)', 'Pedales Armónicos de 8 Minutos', 'Tensión Permanente Mantenida'],
      counterpoint: ['Contrapunto Tímbrico (Diferenciación por Color Instrumental)', 'Diálogo Horizontal Lento de Trompa, Tuba y Flauta Baja'],
      texture: ['Acuarela Sonora', 'Capas Transparentes Superpuestas', 'Entradas Lentísimas de 30 Segundos', 'Orquesta como Pintura Sonora'],
      rhythm: ['Rubato Espacial sin Pulso Fijo', 'Música que Respira', 'Sin Batería Rítmica (Solo Golpes Tímbricos)'],
      taste: ['Textura Modal Absoluta', 'La Orquesta como Único Instrumento', 'Color Tímbrico Inconfundible'],
    },
  },
  {
    name: 'Michel Legrand',
    dimensions: {
      organology: ['Orquesta de Conservatorio Francés (Divisi a 8 Partes Reales)', 'Maderas Pareadas (Oboe, Clarinete, Fagot)', 'Acordeón (Instrumento Fetiche)', 'Celesta, Glockenspiel y Arpa'],
      harmony: ['Conservatorio Francés (Debussy, Ravel, Messiaen)', 'Acorde Sello: mM7 (C-Eb-G-B Menor con 7ª Mayor Agridulce)', 'Progresión IIm7(b5) - V7(b9b13) - ImM7', 'Politonalidad'],
      counterpoint: ['Contrapunto Francés de Conservatorio', 'Cañones a 2 Voces entre Flauta y Oboe a 1 Compás', 'Voces Internas con Interés Melódico'],
      texture: ['Cristalina por Registros Extremos (Flauta Sobreaguda + Contrabajo Pedal)', 'Texturas de Cámara Francesas'],
      rhythm: ['Bossa-Jazz-Waltz en 3/4 Francés', 'Síncopa Bossa Elegante (1-y, 3-y)', 'Walking Bossa en Contrabajo'],
      taste: ['Modulación Sorpresa Ascendente de 3ª Menor (Un Tono y Medio en Último Chorus)', 'Sofisticación Agridulce Francesa'],
    },
  },
  {
    name: 'John Barry',
    dimensions: {
      organology: ['4 French Horns, 3 Trumpets (Plunger), 3 Trombones, 1 Tuba', 'Cuerdas Masivas Dramáticas (16-20)', 'Guitarra Eléctrica con Chorus & Delay (Bond Sound)', 'Timbales Orquestales & Vibráfono'],
      harmony: ['Dramática-Cinematográfica', 'Acorde Sello: m(maj7)sus2 (The Barry Chord: D-E-F-A-C#)', 'Progresión Im - bIII - bVI - V7 - Im', 'Bordadura Cromática'],
      counterpoint: ['Contracantos Derivados de la Melodía', 'Imitación Narrativa Simple a 2 Compases en Cello/Viola'],
      texture: ['Bloques Dramáticos Cinematográficos', 'Ataques de Metales en Fortissimo', 'Cortes Secos a Silencio Total'],
      rhythm: ['Bond Groove (Walking Bass Jazz + Backbeat Rock)', 'Riff de Guitarra Eléctrica Sincopada'],
      taste: ['The Barry Chord + Guitarra Delay + Glissando de Metales', 'Estructura Narrativa Cinematográfica'],
    },
  },
  {
    name: 'Ray Conniff',
    dimensions: {
      organology: ['Coro de 16 Voces (Instrumento Principal: 8 Femeninas doblan Saxos, 8 Masculinas doblan Metales)', 'Trompetas con Sordina Wah-wah', 'Cuerdas de Acompañamiento'],
      harmony: ['Tonal Básico de Fácil Escucha', 'Close Harmony Vocal a 3ªs y 6ªs en Posiciones Cerradas', 'Acorde Sello: 6ª Vocal (C6)', 'Progresión I - IV - V7 - I'],
      counterpoint: ['Homofonía Pura en Bloque (Cero Contrapunto)', 'Movimiento Homofónico Voces e Instrumentos Simultáneos'],
      texture: ['Muro Vocal Continuo (Sin Silencios)', 'Voces Femeninas en Oooh/Ahhh + Voces Masculinas en Doo-bee-doo'],
      rhythm: ['Marcha Bailable 4/4 con Backbeat Obvio', 'Walking Bass Metronómico en Negras Constantes'],
      taste: ['Conniff Wah en Trompetas detrás del Coro', 'Final en Fade-out con Doo-bee-doo Vocal'],
    },
  },
  {
    name: 'Johnny Mandel',
    dimensions: {
      organology: ['Conjunto Camerístico-Jazz (8-12 músicos)', 'Flauta, Clarinete & Fagot Solista Melódico', 'Violín Solista Contracanto', 'Vibráfono Fetiche & Piano Acústico'],
      harmony: ['Jazz de Alta Escuela con Sustitución Cromática Invisible', 'Acorde Sello: m7(b5) como Pivote Modulante', 'Progresión Cromática Expandida IIm7 - V7(b9) - Imaj7 - #IVm7(b5) - VII7'],
      counterpoint: ['Contrapunto Jazzístico-Camerístico', 'Diálogo Melódico entre Flauta y Fagot en Registros Separados'],
      texture: ['Transparente y Seleccionada', 'Separación de Registros (Flauta Aguda + Fagot Medio-Grave + Contrabajo Pedal)'],
      rhythm: ['Swing Relajado y Elegante', 'Walking Bass con Saltos Melódicos de 3ª y 4ª', 'Rubati Sutiles de Respiración'],
      taste: ['Mandel Resolution (Resolución Armónica Engañosa a Menor que Suena Orgánicamente Perfecta)', 'Menos es Más'],
    },
  },
  {
    name: 'Alain Debray',
    dimensions: {
      organology: ['Maderas Pareadas de Conservatorio Francés (2 Flautas, 2 Oboes, 2 Clarinetes, 2 Fagotes)', 'Arpa Fetiche en Glissandi', '12-16 Cuerdas', 'Piano Acústico & Contrabajo en Redondas'],
      harmony: ['Chanson Francesa Romántica de Alta Escuela', 'Acorde Sello: maj7(#11) en Cuerdas (C-E-G-B-F#)', 'Cadencia de Debray: I - IVmaj7(#11) - IIIm7 - VI7(b9) - IIm7 - V7 - I'],
      counterpoint: ['Contrapunto de Cámara Francés (Ravel/Fauré)', 'Oboe y Flauta en Movimiento Contrario con Imitación a 2 Compases'],
      texture: ['Cascada de Maderas Escalonada (Flauta, Oboe, Clarinete de Abajo a Arriba)', 'Arpa en Glissandi de Transición'],
      rhythm: ['Chanson Française (Vals Francés 3/4 & 4/4 Elegante)', 'Síncopa de Chanson en Contratiempos 2+ y 4+'],
      taste: ['Elegancia y Belleza Tímbrica ante todo', 'Silencios de Respiración entre Secciones'],
    },
  },
  {
    name: 'Claus Ogerman',
    dimensions: {
      organology: ['Bloque Masivo de Metales (4 Trompas, 4 Trompetas, 4 Trombones, 1 Tuba)', 'Maderas Duplicando a Distancia de 8va (Nunca a 3ª/6ª)', 'Cuerdas en Sostenuto (Colchón Armónico)'],
      harmony: ['Tonal Middle-of-the-Road', 'Acorde Sello: V7sus4 -> V7 -> I (Cerradura Armónica Final)', 'Progresión I - III7 - VIm - II7 - V7 - I'],
      counterpoint: ['Homofonía en Bloque (NULO Contrapunto Real)', 'Vientos Moviéndose en el Mismo Patrón Rítmico Homofónico'],
      texture: ['Saturada y Llena (Alta Densidad)', 'Ogerman Swell (Crescendo por Acumulación de Capas de Secciones)', 'Espectro Frecuencial Total Ocupado'],
      rhythm: ['Swing Alemán Preciso y Constante', 'Figura Sello: Semicorcheas Constantes en Hi-Hat + Ride en Negras', 'Walking Bass Perpetuo en Negras'],
      taste: ['Ogerman Swell', 'Metales en Bloque Cerrado Tutti Final', 'Eficacia Sonora Masiva'],
    },
  },
  {
    name: 'Carlos Centurión',
    dimensions: {
      organology: ['Tenor Sax', 'Trombone', 'Grand Piano (McCoy Tyner Voicings)', 'Upright Bass', 'Paraguayan Percussion (Mbaracá, Pandeiro, Legüero)', 'Paraguayan Harp'],
      harmony: ['Paraguayan Polka-Jazz Fusion', 'Quartal Voicings (Acordes por Cuartas Modal)', 'SubV7 Substitutions', 'Guaraní Modal Harmony 6/8'],
      counterpoint: ['3-Part Polyphonic Counterpoint (Sax vs Trombone vs Bass Sincopado)', 'Call and Response Fills', 'Independent String Lines'],
      texture: ['3-Layer Stratification', 'Shimmering Harp-Piano Cascades', '6/8-3/4 Polyrhythmic Texture'],
      rhythm: ['Paraguayan Polka (6/8 & 3/4 Hemiola / Sesquiáltera)', 'Kyre\'y Syncopation', 'Paraguayan Bossa-Jazz Fusion'],
      taste: ['Centurión McCoy Voicings', 'Paraguayan Bicultural Identity', 'Respect for Guaraní Rhythms'],
    },
  },
  {
    name: 'Clare Fischer',
    dimensions: {
      organology: ['Electric Piano', 'Vocal Ensemble', 'Latin Percussion', 'Woodwinds'],
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

import { UserEntity } from './entities/user.entity.js';

export async function seedDatabase(qdrant?: QdrantAdapter): Promise<void> {
  try {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }
  } catch {
    // Already initialized
  }

  const arrangerRepo = AppDataSource.getRepository(ArrangerProfileEntity);
  const userRepo = AppDataSource.getRepository(UserEntity);

  // ── Demo users (idempotent via ON CONFLICT) ──
  for (const demo of DEMO_USERS) {
    const hashedPassword = await bcrypt.hash(demo.password, 12);
    const existing = await userRepo.findOne({ where: { email: demo.email } });
    if (!existing) {
      const newUser = userRepo.create({
        email: demo.email,
        hashedPassword,
        role: demo.role,
      });
      await userRepo.save(newUser);
      logger.info(`[seed] Created demo user ${demo.email} (${demo.role})`);
    } else {
      existing.hashedPassword = hashedPassword;
      await userRepo.save(existing);
      logger.info(`[seed] Updated demo user ${demo.email}`);
    }
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
    let successCount = 0;
    let failCount = 0;
    
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
        successCount++;
      } catch (e) {
        failCount++;
        logger.error(`[seed] Qdrant upsert failed for ${profile.name}: ${(e as Error).message}`);
      }
    }
    
    if (successCount > 0 && failCount === 0) {
      logger.info(`[seed] Indexed ${successCount} profiles into Qdrant`);
    } else if (successCount > 0 && failCount > 0) {
      logger.warn(`[seed] Partially indexed ${successCount}/${all.length} profiles into Qdrant (${failCount} failures)`);
    } else if (failCount > 0 && successCount === 0) {
      logger.error(`[seed] Failed to index any profiles into Qdrant (${failCount} failures). Vector search will be unavailable.`);
    }
  }
}
