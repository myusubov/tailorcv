import { parseDate } from '@internationalized/date';
import type { DateValue } from '@internationalized/date';

/**
 * Parses resume date strings for DatePicker controls.
 * Existing resume data may be stored as YYYY or YYYY-MM, while newly selected
 * dates can include a day as YYYY-MM-DD.
 */
export function parseResumeDateValue({
  value,
}: {
  value: null | string | undefined;
}) {
  if (!value) return null;

  if (value.length === 4) return parseDate(`${value}-01-01`);
  if (value.length === 7) return parseDate(`${value}-01`);

  return parseDate(value);
}

/**
 * Serializes DatePicker values without dropping the selected day.
 */
export function serializeResumeDateValue({
  value,
}: {
  value: DateValue | null;
}) {
  return value ? value.toString() : '';
}
