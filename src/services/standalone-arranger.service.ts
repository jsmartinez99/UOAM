import { Dimensions6D, ArrangerProfile } from '../domain/arranger-profile.js';

export interface ArrangementSection {
  name: 'Introduction' | 'Exposition' | 'Development' | 'Climax' | 'Coda';
  bars: { start: number; end: number };
  densityCap: number;
  dynamicEnvelope: 'ppp' | 'pp' | 'p' | 'mf' | 'f' | 'ff';
  activeInstruments: string[];
  harmonicTechniques: string[];
  counterpointMotion: 'contrary' | 'oblique' | 'parallel' | 'homophonic';
  aestheticGestures: string[];
}

export interface StandaloneArrangementOutput {
  title: string;
  targetArranger: string;
  keyCenter: string;
  tempoBpm: number;
  timeSignature: string;
  sections: ArrangementSection[];
  depthScore: number;
  isProfessionalAssimilation: boolean;
}

export interface GenerateArrangementOptions {
  title?: string;
  keyCenter?: string;
  tempoBpm?: number;
  timeSignature?: string;
  targetArrangerProfile?: ArrangerProfile;
  dimensionsOverride?: Partial<Dimensions6D>;
}

export class StandaloneArrangerService {
  /**
   * Genera un arreglo musical autónomo en 5 secciones (Intro, Exposición, Desarrollo, Clímax, Coda)
   * basado en un perfil 6D de arreglista o una firma de dimensiones personalizada.
   */
  generateArrangement(options: GenerateArrangementOptions): StandaloneArrangementOutput {
    const title = options.title || 'Nuevo Arreglo Autónomo';
    const targetArranger = options.targetArrangerProfile?.name || 'Estilo Personalizado';
    const keyCenter = options.keyCenter || 'Cm';
    const tempoBpm = options.tempoBpm || 78;
    const timeSignature = options.timeSignature || '4/4';

    const dims: Dimensions6D = {
      organology: options.dimensionsOverride?.organology || options.targetArrangerProfile?.dimensions.organology || ['Violins I', 'Violins II', 'Violas', 'Acoustic Grand Piano'],
      harmony: options.dimensionsOverride?.harmony || options.targetArrangerProfile?.dimensions.harmony || ['Added 6th chords', 'Tritone substitution', 'Quartal voicings'],
      counterpoint: options.dimensionsOverride?.counterpoint || options.targetArrangerProfile?.dimensions.counterpoint || ['Contrary motion in 2 voices', 'Call and response'],
      texture: options.dimensionsOverride?.texture || options.targetArrangerProfile?.dimensions.texture || ['Ethereal cloud', '3-layer stratification', 'Delayed string entry'],
      rhythm: options.dimensionsOverride?.rhythm || options.targetArrangerProfile?.dimensions.rhythm || ['Rubato pulse', '6/8 vs 3/4 sesquiáltera'],
      taste: options.dimensionsOverride?.taste || options.targetArrangerProfile?.dimensions.taste || ['Riddle Lift', 'Ogerman Swell', 'Restraint first'],
    };

    // Evaluador de Profundidad de Asimilación (Depth Score)
    const depthScore = this.calculateDepthScore(dims);
    const isProfessionalAssimilation = depthScore >= 0.85;

    // Generar las 5 secciones estructurales
    const sections: ArrangementSection[] = [
      {
        name: 'Introduction',
        bars: { start: 1, end: 8 },
        densityCap: 0.2,
        dynamicEnvelope: 'pp',
        activeInstruments: [dims.organology[0] || 'Piano'],
        harmonicTechniques: [dims.harmony[0] || 'Pedal point'],
        counterpointMotion: 'homophonic',
        aestheticGestures: dims.taste.filter(t => t.toLowerCase().includes('lift') || t.toLowerCase().includes('restraint')).slice(0, 1),
      },
      {
        name: 'Exposition',
        bars: { start: 9, end: 24 },
        densityCap: 0.4,
        dynamicEnvelope: 'p',
        activeInstruments: dims.organology.slice(0, 2),
        harmonicTechniques: dims.harmony.slice(0, 2),
        counterpointMotion: 'contrary',
        aestheticGestures: dims.taste.slice(0, 1),
      },
      {
        name: 'Development',
        bars: { start: 25, end: 40 },
        densityCap: 0.7,
        dynamicEnvelope: 'mf',
        activeInstruments: dims.organology.slice(0, 4),
        harmonicTechniques: dims.harmony,
        counterpointMotion: 'contrary',
        aestheticGestures: dims.taste.filter(t => t.toLowerCase().includes('swell') || t.toLowerCase().includes('voicing')).slice(0, 1),
      },
      {
        name: 'Climax',
        bars: { start: 41, end: 48 },
        densityCap: 0.9,
        dynamicEnvelope: 'f',
        activeInstruments: dims.organology,
        harmonicTechniques: dims.harmony,
        counterpointMotion: 'contrary',
        aestheticGestures: dims.taste,
      },
      {
        name: 'Coda',
        bars: { start: 49, end: 56 },
        densityCap: 0.2,
        dynamicEnvelope: 'ppp',
        activeInstruments: [dims.organology[0] || 'Piano'],
        harmonicTechniques: [dims.harmony[dims.harmony.length - 1] || 'Cadential resolution'],
        counterpointMotion: 'homophonic',
        aestheticGestures: ['Early String Exit', 'Fade Out'],
      },
    ];

    return {
      title,
      targetArranger,
      keyCenter,
      tempoBpm,
      timeSignature,
      sections,
      depthScore,
      isProfessionalAssimilation,
    };
  }

  private calculateDepthScore(dims: Dimensions6D): number {
    let score = 0.5; // Base score
    const requiredKeywords = ['added 6th', 'quartal', 'contrary', 'swell', 'lift', 'sesquiáltera', '3+3+2', 'restraint', 'divisi'];
    
    let matchedDimensionsCount = 0;

    for (const key of Object.keys(dims) as Array<keyof Dimensions6D>) {
      const items = dims[key];
      const hasProfessionalKeyword = items.some(item => 
        requiredKeywords.some(kw => item.toLowerCase().includes(kw))
      );
      if (hasProfessionalKeyword) {
        matchedDimensionsCount++;
      }
    }

    // Si al menos 4 de 6 dimensiones contienen vocabulario técnico profesional
    if (matchedDimensionsCount >= 4) {
      score += 0.38;
    } else if (matchedDimensionsCount >= 2) {
      score += 0.20;
    }

    return Math.min(1.0, Math.round(score * 100) / 100);
  }
}
