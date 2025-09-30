#!/usr/bin/env python3
"""
SQLite to PostgreSQL 16 Converter
Converts SQLite database dump to PostgreSQL 16 compatible format
"""

import re
import json
import datetime
from typing import List, Dict, Tuple, Any

class SQLiteToPostgreSQLConverter:
    def __init__(self):
        self.sqlite_to_pg_types = {
            'TEXT': 'TEXT',
            'INTEGER': 'INTEGER',
            'DECIMAL': 'NUMERIC',
            'BOOLEAN': 'BOOLEAN',
            'DATETIME': 'TIMESTAMP WITH TIME ZONE',
            'JSONB': 'JSONB'
        }

        # Tables that have timestamp fields with Unix epoch milliseconds
        self.timestamp_fields = {
            'Category': ['created_at'],
            'Order': ['submitted_at', 'created_at', 'updated_at'],
            'User': ['created_at', 'updated_at'],
            'Product': ['created_at', 'updated_at'],
            'Brand': ['created_at'],
            'AnalyticsEvent': ['created_at'],
            'CatalogImport': ['created_at'],
            'ExternalProductMap': ['created_at'],
            'ExchangeRate': ['created_at'],
            'SearchLanding': ['created_at'],
            'SearchLandingHit': ['created_at'],
            'SearchQueryLog': ['created_at']
        }

    def convert_sqlite_type_to_postgresql(self, sqlite_type: str) -> str:
        """Convert SQLite data type to PostgreSQL equivalent"""
        if sqlite_type in self.sqlite_to_pg_types:
            return self.sqlite_to_pg_types[sqlite_type]
        return sqlite_type

    def convert_timestamp_from_epoch(self, epoch_ms: str) -> str:
        """Convert Unix epoch milliseconds to PostgreSQL timestamp"""
        try:
            # Handle the case where it might be a string representation of epoch
            if epoch_ms.isdigit():
                timestamp = datetime.datetime.fromtimestamp(int(epoch_ms) / 1000, tz=datetime.timezone.utc)
                return f"'{timestamp.strftime('%Y-%m-%d %H:%M:%S.%f')[:-3]}+00'"
            else:
                # It's already a formatted datetime string
                return f"'{epoch_ms}'"
        except (ValueError, OSError):
            return f"'{epoch_ms}'"

    def convert_boolean_value(self, value: str) -> str:
        """Convert 0/1 to false/true"""
        if value == '0':
            return 'false'
        elif value == '1':
            return 'true'
        return value

    def escape_string_value(self, value: str) -> str:
        """Properly escape string values for PostgreSQL"""
        if value == 'NULL':
            return 'NULL'

        # Escape single quotes by doubling them
        escaped = value.replace("'", "''")
        return f"'{escaped}'"

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
                    col_name = parts[0].strip('"')
                    col_type = parts[1]

                    # Convert type
                    pg_type = self.convert_sqlite_type_to_postgresql(col_type)

                    # Rebuild line with PostgreSQL type
                    line = line.replace(col_type, pg_type, 1)

            converted_lines.append('    ' + line)

        return f'CREATE TABLE IF NOT EXISTS "{table_name}" (\n' + '\n'.join(converted_lines) + '\n);'

    def convert_insert_statement(self, table_name: str, insert_stmt: str) -> str:
        """Convert SQLite INSERT statement to PostgreSQL"""
        # Handle various INSERT statement patterns
        match = re.match(r"INSERT INTO (?:\"?(\w+)\"?) VALUES\((.*)\);?", insert_stmt)
        if not match:
            return insert_stmt

        table = match.group(1)
        values_str = match.group(2)

        # Parse values (handling quotes and commas properly)
        values = self.parse_insert_values(values_str)

        # Convert values based on table and data patterns
        converted_values = []
        for i, value in enumerate(values):
            if value == 'NULL':
                converted_values.append('NULL')
            elif value.isdigit() and len(value) == 13:
                # Unix epoch milliseconds timestamp
                converted_values.append(self.convert_timestamp_from_epoch(value))
            elif value in ['0', '1'] and self.likely_boolean_field(table, i, insert_stmt):
                # Boolean values - only convert if context suggests boolean
                converted_values.append(self.convert_boolean_value(value))
            elif value.startswith("'{") and value.endswith("}'"):
                # JSON value in single quotes
                converted_values.append(value)
            elif value.startswith("'") and value.endswith("'"):
                # Already quoted string - ensure proper escaping
                content = value[1:-1]  # Remove outer quotes
                escaped_content = content.replace("'", "''")
                converted_values.append(f"'{escaped_content}'")
            elif self.is_numeric_value(value):
                # Numeric value (including decimals)
                converted_values.append(value)
            elif value and not value.startswith("'"):
                # Unquoted string value that needs quoting and escaping
                escaped_value = value.replace("'", "''")
                converted_values.append(f"'{escaped_value}'")
            else:
                converted_values.append(value)

        return f'INSERT INTO "{table}" VALUES({", ".join(converted_values)});'

    def parse_insert_values(self, values_str: str) -> List[str]:
        """Parse INSERT VALUES clause handling quotes and commas properly"""
        values = []
        current_value = ""
        in_quotes = False
        quote_char = None
        i = 0
        paren_depth = 0

        while i < len(values_str):
            char = values_str[i]

            if not in_quotes:
                if char in ["'", '"']:
                    in_quotes = True
                    quote_char = char
                    current_value += char
                elif char == '(':
                    paren_depth += 1
                    current_value += char
                elif char == ')':
                    paren_depth -= 1
                    current_value += char
                elif char == ',' and paren_depth == 0:
                    values.append(current_value.strip())
                    current_value = ""
                else:
                    current_value += char
            else:
                current_value += char
                if char == quote_char:
                    # Check if it's an escaped quote
                    if i + 1 < len(values_str) and values_str[i + 1] == quote_char:
                        current_value += quote_char
                        i += 1  # Skip the next quote
                    else:
                        in_quotes = False
                        quote_char = None

            i += 1

        if current_value.strip():
            values.append(current_value.strip())

        return values

    def is_timestamp_field(self, table_name: str, field_index: int) -> bool:
        """Check if a field is a timestamp field based on table schema"""
        # This is a simplified check - in a real implementation you'd need
        # to map field positions to field names based on CREATE TABLE statements
        timestamp_tables = {
            'Category': [4],  # created_at
            'Order': [9, 10, 11],  # submitted_at, created_at, updated_at
            'User': [13, 14],  # created_at, updated_at
            'Product': [15, 16],  # created_at, updated_at
            'Brand': [5],  # created_at
        }

        return table_name in timestamp_tables and field_index in timestamp_tables[table_name]

    def is_boolean_field(self, table_name: str, field_index: int, value: str) -> bool:
        """Check if a field should be treated as boolean"""
        # Check if value is 0 or 1 (potential boolean)
        return value in ['0', '1']

    def likely_boolean_field(self, table_name: str, field_index: int, insert_stmt: str) -> bool:
        """Determine if a field is likely boolean based on context"""
        # Known boolean field positions in specific tables
        boolean_fields = {
            'User': [11, 12],  # is_active, deleted
            'Product': [12, 13],  # is_active, is_deleted
            'Brand': [4],  # is_active
            'SearchLanding': [5],  # is_published
        }

        if table_name in boolean_fields and field_index in boolean_fields[table_name]:
            return True

        # Look for boolean field patterns in INSERT statement
        boolean_patterns = ['is_active', 'is_deleted', 'is_published', 'deleted']
        return any(pattern in insert_stmt.lower() for pattern in boolean_patterns)

    def is_numeric_value(self, value: str) -> bool:
        """Check if a value is numeric (int or float)"""
        try:
            float(value)
            return True
        except ValueError:
            return False

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
            "-- Generated on: " + datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
            "",
            "-- Disable foreign key checks during import",
            "SET session_replication_role = replica;",
            "",
            "BEGIN;",
            ""
        ])

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

def main():
    converter = SQLiteToPostgreSQLConverter()
    input_file = '/Users/sebastianfente/Documents/Development/elecsion-web/database_export_20250930_150522.sql'
    output_file = '/Users/sebastianfente/Documents/Development/elecsion-web/database_postgresql_complete.sql'

    print("Starting SQLite to PostgreSQL conversion...")
    converter.convert_file(input_file, output_file)
    print(f"Conversion completed. Output written to: {output_file}")

if __name__ == "__main__":
    main()