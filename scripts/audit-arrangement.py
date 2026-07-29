#!/usr/bin/env python3
"""
Master CLI for arrangement auditing.
Usage:
  python scripts/audit-arrangement.py init <output_schema.json>
  python scripts/audit-arrangement.py analyze <audio> <schema> [--output report.json]
  python scripts/audit-arrangement.py report <audio> <schema> [--output report.html] [--pdf]
"""
import sys
import json
import argparse
from pathlib import Path
from datetime import datetime

sys.path.insert(0, str(Path(__file__).parent.parent))

from src.verification.harmony import generate_harmonic_report
from src.verification.dynamics import generate_dynamic_report
from src.verification.boundaries import verify_boundaries


EXAMPLE_SCHEMA = {
    "$schema": "https://uoam.dev/schemas/arrangement-schema.json",
    "version": "1.0",
    "title": "Example Arrangement",
    "composer": "Unknown",
    "time_signature": "4/4",
    "tempo_bpm": 78,
    "key_center": "Cm",
    "sections": [
        {
            "id": "intro",
            "label": "Introduction",
            "start_time": 0.0,
            "end_time": 24.6,
            "measures": {"start": 1, "end": 8},
            "dynamic": "pp",
            "harmonic_plan": {
                "key": "Cm",
                "mode": "minor",
                "progression": ["i", "VI", "iv", "V"]
            },
            "instruments": ["Bloque Masivo de Metales"],
            "counterpoint": "homophonic"
        },
        {
            "id": "exposition",
            "label": "Exposition",
            "start_time": 24.6,
            "end_time": 73.8,
            "measures": {"start": 9, "end": 24},
            "dynamic": "p",
            "harmonic_plan": {
                "key": "Cm",
                "mode": "minor",
                "progression": ["i", "iv", "V", "i", "VI", "V", "ii°", "V"]
            },
            "instruments": ["Bloque Masivo de Metales", "Maderas Duplicando a 8va"],
            "counterpoint": "contrary"
        },
        {
            "id": "development",
            "label": "Development",
            "start_time": 73.8,
            "end_time": 123.0,
            "measures": {"start": 25, "end": 40},
            "dynamic": "mf",
            "harmonic_plan": {
                "key": "Cm",
                "mode": "minor",
                "progression": ["i", "ii°", "V", "VI", "iv", "VII", "V", "ii°"]
            },
            "instruments": ["Bloque Masivo de Metales", "Maderas Duplicando a 8va", "Cuerdas en Sostenuto"],
            "counterpoint": "contrary"
        },
        {
            "id": "climax",
            "label": "Climax",
            "start_time": 123.0,
            "end_time": 147.6,
            "measures": {"start": 41, "end": 48},
            "dynamic": "f",
            "harmonic_plan": {
                "key": "Cm",
                "mode": "minor",
                "progression": ["VI", "VII", "V", "VI", "iv", "V", "i", "V"]
            },
            "instruments": ["Bloque Masivo de Metales", "Maderas Duplicando a 8va", "Cuerdas en Sostenuto"],
            "counterpoint": "contrary"
        },
        {
            "id": "coda",
            "label": "Coda",
            "start_time": 147.6,
            "end_time": 172.3,
            "measures": {"start": 49, "end": 56},
            "dynamic": "ppp",
            "harmonic_plan": {
                "key": "Cm",
                "mode": "minor",
                "progression": ["i", "V", "i"]
            },
            "instruments": ["Bloque Masivo de Metales"],
            "counterpoint": "homophonic"
        }
    ]
}


def cmd_init(args):
    """Initialize a new arrangement schema file."""
    output_path = args.output
    with open(output_path, 'w') as f:
        json.dump(EXAMPLE_SCHEMA, f, indent=2)
    print(f"Schema template written to {output_path}")
    print("Edit this file with your arrangement's actual section boundaries, dynamics, and harmonic plan.")


def cmd_analyze(args):
    """Run full analysis and output JSON."""
    with open(args.schema) as f:
        schema = json.load(f)

    print("Running harmonic analysis...")
    harmonic = generate_harmonic_report(args.audio, schema)

    print("Running dynamic analysis...")
    dynamic = generate_dynamic_report(args.audio, schema)

    print("Running boundary verification...")
    boundary = verify_boundaries(args.audio, schema)

    report = {
        'generated_at': datetime.now().isoformat(),
        'audio_file': Path(args.audio).name,
        'schema': schema,
        'harmonic': harmonic,
        'dynamic': dynamic,
        'boundary': boundary,
    }

    output_path = args.output or 'audit-analysis.json'
    with open(output_path, 'w') as f:
        json.dump(report, f, indent=2, default=str)
    print(f"\nAnalysis complete. Report written to {output_path}")

    print(f"\nGlobal key: {harmonic['global_key']['key']} {harmonic['global_key']['mode']}")
    print(f"Global LUFS: {dynamic['global_lufs']} dB")
    print(f"Boundary F1 score: {boundary.get('f1_score', 'N/A')}")


def cmd_report(args):
    """Generate HTML/PDF audit report."""
    from scripts.generate_report import build_report_data, render_html

    with open(args.schema) as f:
        schema = json.load(f)

    print("Collecting analysis data...")
    data = build_report_data(args.audio, schema)

    print("Rendering report...")
    html = render_html(data)

    output_path = args.output or 'audit-report.html'
    with open(output_path, 'w') as f:
        f.write(html)
    print(f"HTML report written to {output_path}")

    if args.pdf:
        try:
            from weasyprint import HTML
            pdf_path = output_path.replace('.html', '.pdf')
            HTML(string=html).write_pdf(pdf_path)
            print(f"PDF report written to {pdf_path}")
        except ImportError:
            print("weasyprint not installed — skipping PDF")
        except Exception as e:
            print(f"PDF generation failed: {e}")


def main():
    parser = argparse.ArgumentParser(
        description="UOAM Arrangement Audit Laboratory",
        epilog="Example: audit-arrangement.py analyze audio.wav schema.json"
    )
    sub = parser.add_subparsers(dest='command', required=True)

    p_init = sub.add_parser('init', help='Create a new arrangement schema template')
    p_init.add_argument('output', help='Output JSON path')

    p_analyze = sub.add_parser('analyze', help='Run full analysis pipeline')
    p_analyze.add_argument('audio', help='Path to audio file')
    p_analyze.add_argument('schema', help='Path to arrangement schema JSON')
    p_analyze.add_argument('--output', '-o', help='Output JSON path')

    p_report = sub.add_parser('report', help='Generate HTML/PDF audit report')
    p_report.add_argument('audio', help='Path to audio file')
    p_report.add_argument('schema', help='Path to arrangement schema JSON')
    p_report.add_argument('--output', '-o', help='Output HTML path')
    p_report.add_argument('--pdf', action='store_true', help='Also generate PDF')

    args = parser.parse_args()

    if args.command == 'init':
        cmd_init(args)
    elif args.command == 'analyze':
        cmd_analyze(args)
    elif args.command == 'report':
        cmd_report(args)


if __name__ == "__main__":
    main()
