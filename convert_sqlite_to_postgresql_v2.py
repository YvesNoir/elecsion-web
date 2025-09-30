#!/usr/bin/env python3
"""
Enhanced SQLite to PostgreSQL 16 Converter
Converts SQLite database dump to PostgreSQL 16 compatible format with proper handling
"""

import re
import json
import datetime
from typing import List, Dict, Tuple, Any, Optional

class SQLiteToPostgreSQLConverter:
    def __init__(self):
        self.sqlite_to_pg_types = {
            'TEXT': 'VARCHAR',
            'INTEGER': 'INTEGER',
            'DECIMAL': 'DECIMAL',
            'BOOLEAN': 'BOOLEAN',
            'DATETIME': 'TIMESTAMP WITH TIME ZONE',
            'JSONB': 'JSONB'
        }

        # Store table schemas to know column types and positions
        self.table_schemas = {}

    def parse_table_schema(self, table_name: str, create_stmt: str) -> Dict[str, Any]:
        """Parse CREATE TABLE statement to extract column information"""
        schema = {
            'columns': [],
            'column_types': {},
            'column_positions': {}
        }

        # Extract the part between parentheses
        match = re.search(r'CREATE TABLE IF NOT EXISTS "' + table_name + r'" \((.*)\);', create_stmt, re.DOTALL)
        if not match:
            return schema

        table_def = match.group(1)
        lines = [line.strip() for line in table_def.split('\n') if line.strip()]

        col_position = 0
        for line in lines:
            if line.startswith('CONSTRAINT'):
                continue

            # Remove trailing comma
            line = line.rstrip(',')

            # Parse column definition
            parts = line.split()
            if len(parts) >= 2:
                col_name = parts[0].strip('"')
                col_type = parts[1]

                schema['columns'].append(col_name)
                schema['column_types'][col_name] = col_type
                schema['column_positions'][col_name] = col_position
                col_position += 1

        return schema

    def convert_timestamp_from_epoch(self, epoch_ms: str) -> str:
        """Convert Unix epoch milliseconds to PostgreSQL timestamp"""
        try:
            # Check if it's a numeric epoch timestamp
            if epoch_ms.isdigit() and len(epoch_ms) >= 10:
                timestamp = datetime.datetime.fromtimestamp(int(epoch_ms) / 1000, tz=datetime.timezone.utc)
                return f"'{timestamp.strftime('%Y-%m-%d %H:%M:%S.%f')[:-3]}+00'"
            else:
                # It's already a formatted datetime string, just wrap in quotes
                return f"'{epoch_ms}'"
        except (ValueError, OSError):
            return f"'{epoch_ms}'"

    def escape_string_for_postgresql(self, value: str) -> str:
        """Properly escape string values for PostgreSQL"""
        if value == 'NULL':
            return 'NULL'

        # Remove surrounding quotes if present
        if value.startswith("'") and value.endswith("'"):
            value = value[1:-1]

        # Escape single quotes by doubling them
        escaped = value.replace("'", "''")

        # Handle other special characters if needed
        return f"'{escaped}'"

    def parse_values_safely(self, values_str: str) -> List[str]:
        """Parse INSERT VALUES clause more carefully"""
        values = []
        current_value = ""
        in_quotes = False
        quote_char = None
        i = 0

        while i < len(values_str):
            char = values_str[i]

            if not in_quotes:
                if char in ["'"]:
                    in_quotes = True
                    quote_char = char
                    current_value += char
                elif char == ',':
                    values.append(current_value.strip())
                    current_value = ""
                else:
                    current_value += char
            else:
                if char == quote_char:
                    # Check if it's an escaped quote (double quote)
                    if i + 1 < len(values_str) and values_str[i + 1] == quote_char:
                        current_value += char + char
                        i += 1  # Skip the next quote
                    else:
                        in_quotes = False
                        quote_char = None
                        current_value += char
                else:
                    current_value += char

            i += 1

        if current_value.strip():
            values.append(current_value.strip())

        return values

    def convert_value_by_type(self, table_name: str, col_position: int, value: str) -> str:
        """Convert a value based on its column type and position"""
        if value == 'NULL':
            return 'NULL'

        schema = self.table_schemas.get(table_name, {})
        columns = schema.get('columns', [])
        column_types = schema.get('column_types', {})

        # Get column name and type
        if col_position < len(columns):
            col_name = columns[col_position]
            col_type = column_types.get(col_name, 'TEXT')

            # Handle different data types
            if col_type == 'DATETIME' or col_name.endswith('_at'):
                # Convert timestamp
                if value.startswith("'") and value.endswith("'"):
                    # Already quoted datetime string
                    return value
                elif value.isdigit() and len(value) >= 10:
                    # Unix epoch timestamp
                    return self.convert_timestamp_from_epoch(value)
                else:
                    return self.escape_string_for_postgresql(value)

            elif col_type == 'BOOLEAN':
                # Convert boolean
                if value == '0':
                    return 'false'
                elif value == '1':
                    return 'true'
                else:
                    return value

            elif col_type in ['TEXT', 'VARCHAR']:
                # String value
                return self.escape_string_for_postgresql(value)

            elif col_type in ['INTEGER', 'DECIMAL']:
                # Numeric value - no quotes needed
                return value

            elif col_type == 'JSONB':
                # JSON value - needs to be properly quoted
                if not value.startswith("'"):
                    return self.escape_string_for_postgresql(value)
                return value

        # Default handling
        if value.startswith("'") and value.endswith("'"):
            return value
        elif value.replace('.', '').replace('-', '').isdigit():
            return value
        else:
            return self.escape_string_for_postgresql(value)

    def convert_table_definition(self, table_name: str, table_def: str) -> str:
        """Convert SQLite table definition to PostgreSQL"""
        lines = table_def.strip().split('\n')
        converted_lines = []

        for line in lines:
            line = line.strip()
            if not line:
                continue

            # Handle column definitions
            if not line.startswith('CONSTRAINT'):
                # Extract column definition
                parts = line.rstrip(',').split()
                if len(parts) >= 2:
                    col_type = parts[1]
                    # Convert type
                    pg_type = self.sqlite_to_pg_types.get(col_type, col_type)
                    line = line.replace(col_type, pg_type, 1)

            converted_lines.append('    ' + line)

        return f'CREATE TABLE IF NOT EXISTS "{table_name}" (\n' + '\n'.join(converted_lines) + '\n);'

    def convert_insert_statement(self, table_name: str, insert_stmt: str) -> str:
        """Convert SQLite INSERT statement to PostgreSQL"""
        # Extract values from INSERT statement
        match = re.match(r"INSERT INTO (\w+) VALUES\((.*)\);", insert_stmt)
        if not match:
            return insert_stmt

        table = match.group(1)
        values_str = match.group(2)

        # Parse values safely
        values = self.parse_values_safely(values_str)

        # Convert each value based on its column type
        converted_values = []
        for i, value in enumerate(values):
            converted_value = self.convert_value_by_type(table, i, value)
            converted_values.append(converted_value)

        return f'INSERT INTO "{table}" VALUES({", ".join(converted_values)});'

    def generate_indexes(self) -> List[str]:
        """Generate recommended indexes for PostgreSQL"""
        indexes = [
            "-- Indexes for better performance",
            'CREATE INDEX IF NOT EXISTS idx_category_parent_id ON "Category"(parent_id);',
            'CREATE INDEX IF NOT EXISTS idx_category_slug ON "Category"(slug);',
            'CREATE INDEX IF NOT EXISTS idx_product_sku ON "Product"(sku);',
            'CREATE INDEX IF NOT EXISTS idx_product_slug ON "Product"(slug);',
            'CREATE INDEX IF NOT EXISTS idx_product_category_id ON "Product"(category_id);',
            'CREATE INDEX IF NOT EXISTS idx_product_brand_id ON "Product"(brand_id);',
            'CREATE INDEX IF NOT EXISTS idx_product_is_active ON "Product"(is_active);',
            'CREATE INDEX IF NOT EXISTS idx_productimage_product_id ON "ProductImage"(product_id);',
            'CREATE INDEX IF NOT EXISTS idx_order_client_user_id ON "Order"(client_user_id);',
            'CREATE INDEX IF NOT EXISTS idx_order_seller_user_id ON "Order"(seller_user_id);',
            'CREATE INDEX IF NOT EXISTS idx_order_status ON "Order"(status);',
            'CREATE INDEX IF NOT EXISTS idx_order_type ON "Order"(type);',
            'CREATE INDEX IF NOT EXISTS idx_order_created_at ON "Order"(created_at);',
            'CREATE INDEX IF NOT EXISTS idx_orderitem_order_id ON "OrderItem"(order_id);',
            'CREATE INDEX IF NOT EXISTS idx_orderitem_product_id ON "OrderItem"(product_id);',
            'CREATE INDEX IF NOT EXISTS idx_user_email ON "User"(email);',
            'CREATE INDEX IF NOT EXISTS idx_user_role ON "User"(role);',
            'CREATE INDEX IF NOT EXISTS idx_user_is_active ON "User"(is_active);',
            'CREATE INDEX IF NOT EXISTS idx_user_assigned_seller_id ON "User"(assigned_seller_id);',
            'CREATE INDEX IF NOT EXISTS idx_brand_slug ON "Brand"(slug);',
            'CREATE INDEX IF NOT EXISTS idx_analytics_event_name ON "AnalyticsEvent"(event_name);',
            'CREATE INDEX IF NOT EXISTS idx_analytics_user_id ON "AnalyticsEvent"(user_id);',
            'CREATE INDEX IF NOT EXISTS idx_analytics_product_id ON "AnalyticsEvent"(product_id);',
            'CREATE INDEX IF NOT EXISTS idx_analytics_created_at ON "AnalyticsEvent"(created_at);'
        ]
        return indexes

    def convert_file(self, input_file: str, output_file: str):
        """Convert entire SQLite dump file to PostgreSQL"""
        with open(input_file, 'r', encoding='utf-8') as f:
            content = f.read()

        # Split into lines for processing
        lines = content.split('\n')
        converted_lines = []

        # Add PostgreSQL header
        converted_lines.extend([
            "-- PostgreSQL 16 Database Dump",
            "-- Converted from SQLite",
            f"-- Generated on: {datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}",
            "",
            "-- Disable foreign key checks during import",
            "SET session_replication_role = replica;",
            "",
            "BEGIN;",
            ""
        ])

        # First pass: extract all table schemas
        print("Extracting table schemas...")
        i = 0
        while i < len(lines):
            line = lines[i].strip()

            if line.startswith('CREATE TABLE'):
                # Find the complete table definition
                table_def_lines = [line]
                i += 1

                while i < len(lines) and not lines[i].strip().endswith(');'):
                    table_def_lines.append(lines[i])
                    i += 1

                if i < len(lines):
                    table_def_lines.append(lines[i])

                # Extract table name and definition
                table_match = re.match(r'CREATE TABLE IF NOT EXISTS "(\w+)"', line)
                if table_match:
                    table_name = table_match.group(1)
                    full_def = '\n'.join(table_def_lines)

                    # Parse and store schema
                    schema = self.parse_table_schema(table_name, full_def)
                    self.table_schemas[table_name] = schema
                    print(f"  - {table_name}: {len(schema['columns'])} columns")

            i += 1

        # Second pass: convert the file
        print("Converting SQL statements...")
        i = 0
        while i < len(lines):
            line = lines[i].strip()

            # Skip SQLite specific pragmas
            if line.startswith('PRAGMA') or line == 'BEGIN TRANSACTION;':
                i += 1
                continue

            # Handle CREATE TABLE statements
            if line.startswith('CREATE TABLE'):
                # Find the complete table definition
                table_def_lines = [line]
                i += 1

                while i < len(lines) and not lines[i].strip().endswith(');'):
                    table_def_lines.append(lines[i])
                    i += 1

                if i < len(lines):
                    table_def_lines.append(lines[i])

                # Extract table name and definition
                table_match = re.match(r'CREATE TABLE IF NOT EXISTS "(\w+)"', line)
                if table_match:
                    table_name = table_match.group(1)
                    full_def = '\n'.join(table_def_lines)

                    # Extract just the column definitions part
                    def_match = re.search(r'CREATE TABLE IF NOT EXISTS "\w+" \((.*)\);', full_def, re.DOTALL)
                    if def_match:
                        table_def = def_match.group(1)
                        converted_table = self.convert_table_definition(table_name, table_def)
                        converted_lines.append(converted_table)
                        converted_lines.append("")

                i += 1
                continue

            # Handle INSERT statements
            if line.startswith('INSERT INTO'):
                converted_insert = self.convert_insert_statement(line.split()[2], line)
                converted_lines.append(converted_insert)
                i += 1
                continue

            # Handle COMMIT
            if line == 'COMMIT;':
                converted_lines.append("")
                converted_lines.append("-- Create indexes for performance")
                converted_lines.extend(self.generate_indexes())
                converted_lines.append("")
                converted_lines.append("-- Re-enable foreign key checks")
                converted_lines.append("SET session_replication_role = DEFAULT;")
                converted_lines.append("")
                converted_lines.append("COMMIT;")
                i += 1
                continue

            # Skip empty lines and other statements
            if line:
                converted_lines.append(line)

            i += 1

        # Write converted content
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write('\n'.join(converted_lines))

def main():
    converter = SQLiteToPostgreSQLConverter()
    input_file = '/Users/sebastianfente/Documents/Development/elecsion-web/database_export_20250930_150522.sql'
    output_file = '/Users/sebastianfente/Documents/Development/elecsion-web/database_postgresql_complete.sql'

    print("Starting enhanced SQLite to PostgreSQL conversion...")
    converter.convert_file(input_file, output_file)
    print(f"Conversion completed. Output written to: {output_file}")

if __name__ == "__main__":
    main()