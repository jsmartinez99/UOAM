#!/usr/bin/env python3
"""
Generate HTML/PDF audit report from analysis results.
Usage: python scripts/generate-report.py <audio_path> <schema_path> [--output report.html] [--pdf]
"""
import sys
import json
import argparse
from pathlib import Path
from datetime import datetime

sys.path.insert(0, str(Path(__file__).parent.parent))

try:
    from jinja2 import Environment, FileSystemLoader
    JINJA2_AVAILABLE = True
except ImportError:
    JINJA2_AVAILABLE = False

from src.verification.harmony import generate_harmonic_report
from src.verification.dynamics import generate_dynamic_report
from src.verification.boundaries import verify_boundaries


def build_report_data(audio_path: str, schema: dict) -> dict:
    """Collect all analysis results into unified report data."""
    harmonic = generate_harmonic_report(audio_path, schema)
    dynamic = generate_dynamic_report(audio_path, schema)
    boundary = verify_boundaries(audio_path, schema)

    sections = []
    for i, sec in enumerate(schema.get('sections', [])):
        dyn_sec = dynamic['sections'][i] if i < len(dynamic['sections']) else {}
        harm_sec = harmonic['sections'][i] if i < len(harmonic['sections']) else {}
        bnd_sec = boundary['sections'][i] if i < len(boundary.get('sections', [])) else {}

        sections.append({
            'label': sec.get('label', f'Section {i+1}'),
            'start_time': sec.get('start_time', 0),
            'end_time': sec.get('end_time', 0),
            'declared_dynamic': sec.get('dynamic', sec.get('dynamic_envelope', 'mf')),
            'lufs': dyn_sec.get('measured_lufs', 0),
            'rms_db': dyn_sec.get('measured_rms_db', 0),
            'crest': dyn_sec.get('crest_factor_db', 0),
            'dynamic_pass': dyn_sec.get('overall_pass', False),
            'chord_count': harm_sec.get('chord_count', 0),
            'cadence': harm_sec.get('cadence', 'none'),
            'harmonic_match': harm_sec.get('harmonic_similarity', {}).get('score') if harm_sec.get('harmonic_similarity') else None,
            'boundary_deviation': bnd_sec.get('deviation_measures', 0),
            'boundary_pass': bnd_sec.get('pass', False),
            'overall_pass': dyn_sec.get('overall_pass', False) and bnd_sec.get('pass', True),
        })

    total = len(sections)
    passed = sum(1 for s in sections if s['overall_pass'])
    pass_rate = round(100 * passed / total) if total > 0 else 0

    return {
        'title': schema.get('title', 'Untitled Arrangement'),
        'generated_at': datetime.now().isoformat(),
        'audio_file': Path(audio_path).name,
        'schema_file': 'schema',
        'overall_pass': all(s['overall_pass'] for s in sections),
        'total_sections': total,
        'pass_rate': pass_rate,
        'global_key': f"{harmonic['global_key']['key']} {harmonic['global_key']['mode']}",
        'global_lufs': dynamic['global_lufs'],
        'global_crest': dynamic['global_crest_factor_db'],
        'fade_out': dynamic.get('fade_out'),
        'key_changes': harmonic.get('key_changes', []),
        'sections': sections,
    }


def render_html(data: dict) -> str:
    """Render report data to HTML using Jinja2 template."""
    if not JINJA2_AVAILABLE:
        return _render_fallback_html(data)

    template_dir = Path(__file__).parent.parent / 'templates'
    env = Environment(loader=FileSystemLoader(str(template_dir)))
    template = env.get_template('report.html.j2')
    return template.render(**data)


def _render_fallback_html(data: dict) -> str:
    """Fallback HTML renderer without Jinja2."""
    sections_html = ""
    for sec in data['sections']:
        status = "PASS" if sec['overall_pass'] else "FAIL"
        color = "#22c55e" if sec['overall_pass'] else "#ef4444"
        sections_html += f"""
        <tr>
            <td>{sec['label']}</td>
            <td>{sec['start_time']}s – {sec['end_time']}s</td>
            <td>{sec['declared_dynamic']}</td>
            <td>{sec['lufs']} dB</td>
            <td>{sec['rms_db']} dB</td>
            <td>{sec['crest']} dB</td>
            <td>{sec['chord_count']}</td>
            <td>{sec['cadence']}</td>
            <td style="color:{color}"><strong>{status}</strong></td>
        </tr>"""

    return f"""<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>Arrangement Audit — {data['title']}</title>
<style>body{{font-family:sans-serif;background:#0f172a;color:#e2e8f0;padding:2rem}}
h1{{color:#c5a059}} table{{width:100%;border-collapse:collapse;margin:1rem 0}}
th,td{{padding:.5rem;border-bottom:1px solid #334155;text-align:left}}
th{{color:#94a3b8;font-size:.75rem;text-transform:uppercase}}
.pass{{color:#22c55e}}.fail{{color:#ef4444}}
</style></head><body>
<h1>Arrangement Audit Report — {data['title']}</h1>
<p>Generated: {data['generated_at']} | Global key: {data['global_key']} | LUFS: {data['global_lufs']} dB</p>
<p>Overall: <span class="{'pass' if data['overall_pass'] else 'fail'}">{'PASS' if data['overall_pass'] else 'FAIL'}</span> | Pass rate: {data['pass_rate']}%</p>
<table><thead><tr><th>Section</th><th>Time</th><th>Dynamic</th><th>LUFS</th><th>RMS</th><th>Crest</th><th>Chords</th><th>Cadence</th><th>Verdict</th></tr></thead>
<tbody>{sections_html}</tbody></table>
</body></html>"""


def main():
    parser = argparse.ArgumentParser(description="Generate arrangement audit report")
    parser.add_argument("audio", help="Path to audio file")
    parser.add_argument("schema", help="Path to arrangement schema JSON")
    parser.add_argument("--output", "-o", default="audit-report.html", help="Output HTML path")
    parser.add_argument("--pdf", action="store_true", help="Also generate PDF (requires weasyprint)")
    args = parser.parse_args()

    with open(args.schema) as f:
        schema = json.load(f)

    print("Collecting analysis data...")
    data = build_report_data(args.audio, schema)

    print("Rendering report...")
    html = render_html(data)

    with open(args.output, 'w') as f:
        f.write(html)
    print(f"HTML report written to {args.output}")

    if args.pdf:
        try:
            from weasyprint import HTML
            pdf_path = args.output.replace('.html', '.pdf')
            HTML(string=html).write_pdf(pdf_path)
            print(f"PDF report written to {pdf_path}")
        except ImportError:
            print("weasyprint not installed — skipping PDF generation")
        except Exception as e:
            print(f"PDF generation failed: {e}")


if __name__ == "__main__":
    main()
