#!/usr/bin/env python3
"""
Quick fix to convert epoch timestamps in the PostgreSQL dump
"""

import re
import datetime

def convert_epoch_to_timestamp(epoch_str):
    """Convert epoch milliseconds to PostgreSQL timestamp"""
    try:
        timestamp = datetime.datetime.fromtimestamp(int(epoch_str) / 1000, tz=datetime.timezone.utc)
        return f"'{timestamp.strftime('%Y-%m-%d %H:%M:%S.%f')[:-3]}+00'"
    except:
        return epoch_str

def fix_order_timestamps(input_file, output_file):
    """Fix timestamp fields in Order table INSERT statements"""

    with open(input_file, 'r', encoding='utf-8') as f:
        content = f.read()

    lines = content.split('\n')
    fixed_lines = []

    for line in lines:
        if line.startswith('INSERT INTO "Order" VALUES('):
            # Extract the values part
            match = re.match(r'(INSERT INTO "Order" VALUES\()(.*)\);', line)
            if match:
                prefix = match.group(1)
                values_str = match.group(2)

                # Split by comma but handle quotes properly
                values = []
                current = ""
                in_quotes = False

                i = 0
                while i < len(values_str):
                    char = values_str[i]
                    if char == "'" and not in_quotes:
                        in_quotes = True
                        current += char
                    elif char == "'" and in_quotes:
                        in_quotes = False
                        current += char
                    elif char == ',' and not in_quotes:
                        values.append(current.strip())
                        current = ""
                    else:
                        current += char
                    i += 1

                if current.strip():
                    values.append(current.strip())

                # Convert timestamp fields at positions 8, 9, 10 (submitted_at, created_at, updated_at)
                for pos in [8, 9, 10]:
                    if pos < len(values):
                        value = values[pos]
                        # Check if it's an epoch timestamp (numeric, not NULL, not quoted)
                        if value != 'NULL' and not value.startswith("'") and value.isdigit() and len(value) >= 10:
                            values[pos] = convert_epoch_to_timestamp(value)

                # Reconstruct the line
                fixed_line = prefix + ','.join(values) + ');'
                fixed_lines.append(fixed_line)
            else:
                fixed_lines.append(line)
        else:
            fixed_lines.append(line)

    # Write the fixed content
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write('\n'.join(fixed_lines))

def main():
    input_file = '/Users/sebastianfente/Documents/Development/elecsion-web/database_postgresql_complete.sql'
    output_file = input_file  # Overwrite the same file

    print("Fixing epoch timestamps in Order table...")
    fix_order_timestamps(input_file, output_file)
    print("Timestamps fixed!")

if __name__ == "__main__":
    main()