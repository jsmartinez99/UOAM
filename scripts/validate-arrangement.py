#!/usr/bin/env python3
"""
Custom validator for arrangement schema.
Checks for section measure overlaps and other semantic constraints.
"""

import json
import sys
from typing import Dict, List, Tuple, Any
from jsonschema import Draft7Validator, validators


def validate_section_overlaps(instance: Dict) -> List[str]:
    """Validate that sections don't have overlapping measure ranges."""
    errors = []
    sections = instance.get("sections", [])
    
    # Build list of (start, end, id) for each section
    ranges = []
    for section in sections:
        start = section.get("start_measure")
        end = section.get("end_measure")
        sid = section.get("id", "unknown")
        if start is not None and end is not None:
            ranges.append((start, end, sid))
    
    # Check for overlaps
    for i, (s1, e1, id1) in enumerate(ranges):
        for s2, e2, id2 in ranges[i+1:]:
            # Check if ranges overlap
            if not (e1 < s2 or e2 < s1):
                errors.append(
                    f"Sections '{id1}' (measures {s1}-{e1}) and "
                    f"'{id2}' (measures {s2}-{e2}) have overlapping measure ranges"
                )
    
    return errors


def validate_measure_sequence(instance: Dict) -> List[str]:
    """Validate that sections form a continuous sequence without gaps (optional)."""
    errors = []
    sections = instance.get("sections", [])
    
    if not sections:
        return errors
    
    # Sort by start measure
    sorted_sections = sorted(sections, key=lambda s: s.get("start_measure", 0))
    
    # Check for gaps
    for i in range(len(sorted_sections) - 1):
        curr_end = sorted_sections[i].get("end_measure", 0)
        next_start = sorted_sections[i + 1].get("start_measure", 0)
        if next_start > curr_end + 1:
            errors.append(
                f"Gap between section '{sorted_sections[i].get('id')}' "
                f"(ends at measure {curr_end}) and "
                f"'{sorted_sections[i+1].get('id')}' (starts at measure {next_start})"
            )
    
    return errors


def validate_dynamic_consistency(instance: Dict) -> List[str]:
    """Validate that dynamics fields are consistent."""
    errors = []
    sections = instance.get("sections", [])
    
    for section in sections:
        dynamics = section.get("dynamics")
        dynamics_percent = section.get("dynamics_percent")
        
        # If both provided, check consistency
        if dynamics and dynamics_percent is not None:
            dynamic_to_percent = {
                "ppp": 10, "pp": 20, "p": 30, "mp": 40,
                "mf": 55, "f": 70, "ff": 85, "fff": 95
            }
            expected = dynamic_to_percent.get(dynamics, 50)
            if abs(dynamics_percent - expected) > 15:
                errors.append(
                    f"Section '{section.get('id')}': dynamics '{dynamics}' "
                    f"inconsistent with dynamics_percent {dynamics_percent} "
                    f"(expected ~{expected})"
                )
    
    return errors


def validate_harmonic_content(instance: Dict) -> List[str]:
    """Validate harmonic content structure."""
    errors = []
    sections = instance.get("sections", [])
    
    for section in sections:
        harmonic = section.get("harmonic_content")
        if not harmonic:
            continue
            
        # Check progression format
        progression = harmonic.get("progression", [])
        for i, chord in enumerate(progression):
            # Basic Roman numeral validation
            if not chord:
                errors.append(
                    f"Section '{section.get('id')}': empty chord at position {i}"
                )
        
        # Check key format
        key = harmonic.get("key")
        if key and not key.match(r"^[A-G][#b]?$"):
            errors.append(
                f"Section '{section.get('id')}': invalid key format '{key}'"
            )
    
    return errors


def extend_validator(validator_class):
    """Extend JSON Schema validator with custom validation functions."""
    def validate_custom(validator, instance, schema):
        # Run standard validation first
        for error in validator_class.VALIDATORS["type"](validator, instance, schema):
            yield error
        
        # Run custom validations
        if validator.is_type(instance, "object"):
            for error in validate_section_overlaps(instance):
                yield validator.descend(instance, "sections", instance.get("sections", []), schema)
                # Create a custom error
                from jsonschema.exceptions import ValidationError
                yield ValidationError(error, validator=validator, instance=instance, schema=schema)
            
            for error in validate_measure_sequence(instance):
                from jsonschema.exceptions import ValidationError
                yield ValidationError(error, validator=validator, instance=instance, schema=schema)
            
            for error in validate_dynamic_consistency(instance):
                from jsonschema.exceptions import ValidationError
                yield ValidationError(error, validator=validator, instance=instance, schema=schema)
            
            for error in validate_harmonic_content(instance):
                from jsonschema.exceptions import ValidationError
                yield ValidationError(error, validator=validator, instance=instance, schema=schema)
    
    return validators.extend(
        validator_class,
        {"customValidation": validate_custom}
    )


# Create extended validator
ArrangementValidator = extend_validator(Draft7Validator)


def validate_arrangement(arrangement: Dict) -> Tuple[bool, List[str]]:
    """
    Validate an arrangement against the schema with custom rules.
    Returns (is_valid, list_of_errors).
    """
    with open("schemas/arrangement-schema.json") as f:
        schema = json.load(f)
    
    validator = ArrangementValidator(schema)
    errors = list(validator.iter_errors(arrangement))
    
    error_messages = []
    for error in errors:
        path = " -> ".join(str(p) for p in error.path) if error.path else "root"
        error_messages.append(f"[{path}] {error.message}")
    
    return len(error_messages) == 0, error_messages


if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="Validate arrangement JSON")
    parser.add_argument("file", help="Arrangement JSON file to validate")
    args = parser.parse_args()
    
    with open(args.file) as f:
        arrangement = json.load(f)
    
    valid, errors = validate_arrangement(arrangement)
    
    if valid:
        print("✓ Arrangement is valid")
        sys.exit(0)
    else:
        print("✗ Arrangement validation failed:")
        for error in errors:
            print(f"  - {error}")
        sys.exit(1)