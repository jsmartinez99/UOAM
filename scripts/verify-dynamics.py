#!/usr/bin/env python3
"""
Dynamic profile verification CLI.
Usage: python scripts/verify-dynamics.py <audio_path> <schema_path> [--output report.json]
"""
import sys
import json
import argparse
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from src.verification.dynamics import generate_dynamic_report


def main():
    parser = argparse.ArgumentParser(description="Verify dynamic profile against arrangement schema")
    parser.add_argument("audio", help="Path to audio file (WAV, FLAC, MP3)")
    parser.add_argument("schema", help="Path to arrangement schema JSON")
    parser.add_argument("--output", "-o", help="Output JSON report path")
    args = parser.parse_args()

    with open(args.schema) as f:
        schema = json.load(f)

    report = generate_dynamic_report(args.audio, schema)

    if args.output:
        with open(args.output, 'w') as f:
            json.dump(report, f, indent=2, default=str)
        print(f"Report written to {args.output}")

    print(f"\nGlobal LUFS: {report['global_lufs']} dB")
    print(f"Global crest factor: {report['global_crest_factor_db']} dB")
    if report['fade_out']:
        fo = report['fade_out']
        print(f"Fade-out detected: {fo['duration_s']:.1f}s, drop: {fo['level_drop_db']:.1f} dB")

    print(f"\nOverall dynamic pass: {'PASS' if report['overall_pass'] else 'FAIL'}")
    for sec in report['sections']:
        status = "PASS" if sec['overall_pass'] else "FAIL"
        print(f"  {sec['section_label']:20s} declared={sec['declared_dynamic']:4s}  "
              f"LUFS={sec['measured_lufs']:5.1f}  RMS={sec['measured_rms_db']:5.1f}  "
              f"crest={sec['crest_factor_db']:4.1f}  [{status}]")


if __name__ == "__main__":
    main()
