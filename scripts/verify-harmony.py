#!/usr/bin/env python3
"""
Harmonic verification CLI: compares estimated chords/key against arrangement schema.
Usage: python scripts/verify-harmony.py <audio_path> <schema_path> [--method auto|vamp|template]
"""
import sys
import json
import argparse
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from src.verification.harmony import generate_harmonic_report


def main():
    parser = argparse.ArgumentParser(description="Verify harmonic content against arrangement schema")
    parser.add_argument("audio", help="Path to audio file (WAV, FLAC, MP3)")
    parser.add_argument("schema", help="Path to arrangement schema JSON")
    parser.add_argument("--method", default="auto", choices=["auto", "vamp", "template", "commandline"],
                        help="Chord estimation method")
    parser.add_argument("--output", "-o", help="Output JSON report path")
    args = parser.parse_args()

    with open(args.schema) as f:
        schema = json.load(f)

    report = generate_harmonic_report(args.audio, schema, method=args.method)

    if args.output:
        with open(args.output, 'w') as f:
            json.dump(report, f, indent=2, default=str)
        print(f"Report written to {args.output}")

    print(f"\nGlobal key: {report['global_key']['key']} {report['global_key']['mode']} "
          f"(confidence: {report['global_key']['confidence']:.2f})")
    print(f"Total chords detected: {report['total_chords']}")
    print(f"Key changes: {len(report['key_changes'])}")

    for sec in report['sections']:
        print(f"\n  {sec['section_label']} ({sec['start_time']:.1f}s - {sec['end_time']:.1f}s)")
        print(f"    Chords: {sec['chord_count']}, Cadence: {sec['cadence']}")
        if sec['harmonic_similarity']:
            print(f"    Harmonic match: {sec['harmonic_similarity']['score']:.0%} "
                  f"({sec['harmonic_similarity']['matches']}/{sec['harmonic_similarity']['total']})")


if __name__ == "__main__":
    main()
