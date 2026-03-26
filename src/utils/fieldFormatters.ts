import { format, parseISO, isValid } from 'date-fns';
import type { DataTypeMap } from '@/api/types/dataType';

/**
 * Format a single asset field value for display in list cells and detail rows.
 * Returns a human-readable string; never returns raw JSON or undefined.
 *
 * Covers all dataType variants defined in ARCHITECTURE.md §4 (InputType.dataType).
 */
export function formatFieldValue(
  value: unknown,
  dataType: string,
  dataTypeMap: DataTypeMap,
): string {
  if (value === null || value === undefined) return '—';

  // Boolean
  if (dataType === 'boolean') {
    return value ? 'Yes' : 'No';
  }

  // Datetime
  if (dataType === 'datetime') {
    try {
      const d = typeof value === 'string' ? parseISO(value) : new Date(value as number);
      if (isValid(d)) return format(d, 'PPpp');
    } catch {
      // fall through to default
    }
    return String(value);
  }

  // Number
  if (dataType === 'number') {
    const n = Number(value);
    if (!isNaN(n)) return n.toLocaleString();
    return String(value);
  }

  // URL — render plain string (anchor handled by caller if needed)
  if (dataType === 'url') {
    return String(value);
  }

  // List types — join with truncation after 3 items
  if (
    dataType === '[]string' ||
    dataType === '[]url' ||
    dataType === '[]number' ||
    dataType === '[]datetime'
  ) {
    if (!Array.isArray(value)) return String(value);
    const items = (value as unknown[]).map((v) =>
      dataType === '[]datetime'
        ? formatFieldValue(v, 'datetime', dataTypeMap)
        : String(v),
    );
    if (items.length <= 3) return items.join(', ');
    return `${items.slice(0, 3).join(', ')} … (+${items.length - 3} more)`;
  }

  // Asset reference: "<assetTag>->" — show @key of the nested object
  if (dataType.endsWith('->') && !dataType.startsWith('[]')) {
    if (typeof value === 'object' && value !== null) {
      const rec = value as Record<string, unknown>;
      return String(rec['@key'] ?? rec['@assetType'] ?? JSON.stringify(value));
    }
    return String(value);
  }

  // Asset list reference: "[]<assetTag>->"
  if (dataType.startsWith('[]') && dataType.endsWith('->')) {
    if (!Array.isArray(value)) return String(value);
    const keys = (value as Record<string, unknown>[]).map(
      (v) => String(v['@key'] ?? v['@assetType'] ?? '?'),
    );
    if (keys.length <= 3) return keys.join(', ');
    return `${keys.slice(0, 3).join(', ')} … (+${keys.length - 3} more)`;
  }

  // Custom dataType — look up dropdown label, or fall back to base format
  if (dataTypeMap[dataType]) {
    const def = dataTypeMap[dataType];
    // Dropdown with a label map
    if (def.dropDownValues) {
      const label = def.dropDownValues[String(value)];
      if (label) return label;
    }
    // Resolve base format and re-format
    const base = def.acceptedFormats[0];
    if (base && base !== dataType) {
      return formatFieldValue(value, base, dataTypeMap);
    }
  }

  // @object / @prop — render as compact JSON
  if (dataType === '@object' || dataType === '@prop') {
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }

  return String(value);
}
