import { StandaloneArrangementOutput } from './standalone-arranger.service.js';

export class MusicXMLExporterService {
  /**
   * Exporta un arreglo autónomo en 5 secciones a notación simbólica MusicXML (W3C standard).
   */
  exportToMusicXML(arrangement: StandaloneArrangementOutput): string {
    const partsXml = arrangement.sections
      .map((sec, secIdx) => {
        const activeInst = sec.activeInstruments[0] || 'Piano';
        return `
    <measure number="${secIdx + 1}">
      <attributes>
        <divisions>1</divisions>
        <key>
          <fifths>0</fifths>
          <mode>minor</mode>
        </key>
        <time>
          <beats>4</beats>
          <beat-type>4</beat-type>
        </time>
        <clef>
          <sign>G</sign>
          <line>2</line>
        </clef>
      </attributes>
      <direction placement="above">
        <direction-type>
          <words font-weight="bold">${sec.name} (Compases ${sec.bars.start}-${sec.bars.end})</words>
        </direction-type>
      </direction>
      <direction placement="below">
        <direction-type>
          <dynamics><${sec.dynamicEnvelope}/></direction-type>
        </direction-type>
      </direction>
      <note>
        <pitch>
          <step>C</step>
          <octave>4</octave>
        </pitch>
        <duration>4</duration>
        <type>whole</type>
        <instrument id="${activeInst.replace(/\s+/g, '-')}"/>
      </note>
    </measure>`;
      })
      .join('\n');

    return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE score-partwise PUBLIC "-//Recordare//DTD MusicXML 3.1 Partwise//EN" "http://www.musicxml.org/dtds/partwise.dtd">
<score-partwise version="3.1">
  <work>
    <work-title>${this.escapeXml(arrangement.title)}</work-title>
  </work>
  <identification>
    <creator type="composer">${this.escapeXml(arrangement.targetArranger)}</creator>
    <rights>UOAM System - Asimilación Profesional (Score: ${Math.round(arrangement.depthScore * 100)}%)</rights>
  </identification>
  <part-list>
    <score-part id="P1">
      <part-name>${this.escapeXml(arrangement.targetArranger)} Ensemble</part-name>
    </score-part>
  </part-list>
  <part id="P1">
${partsXml}
  </part>
</score-partwise>`;
  }

  private escapeXml(unsafe: string): string {
    return unsafe
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }
}
