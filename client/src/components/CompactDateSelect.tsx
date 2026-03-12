import { useEffect, useMemo, useState } from 'react';

type CompactDateSelectProps = {
  value: string;
  onChange: (value: string) => void;
  allowEmpty?: boolean;
};

const MONTHS = [
  { value: '01', label: 'Jan' },
  { value: '02', label: 'Feb' },
  { value: '03', label: 'Mar' },
  { value: '04', label: 'Apr' },
  { value: '05', label: 'May' },
  { value: '06', label: 'Jun' },
  { value: '07', label: 'Jul' },
  { value: '08', label: 'Aug' },
  { value: '09', label: 'Sep' },
  { value: '10', label: 'Oct' },
  { value: '11', label: 'Nov' },
  { value: '12', label: 'Dec' }
];

function daysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate();
}

function parseDate(value: string) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!m) return null;
  return { year: m[1], month: m[2], day: m[3] };
}

export function CompactDateSelect({ value, onChange, allowEmpty = false }: CompactDateSelectProps) {
  const today = new Date();
  const todayParts = {
    year: String(today.getFullYear()),
    month: String(today.getMonth() + 1).padStart(2, '0'),
    day: String(today.getDate()).padStart(2, '0')
  };

  const [parts, setParts] = useState(() => parseDate(value) || (allowEmpty ? { year: '', month: '', day: '' } : todayParts));

  useEffect(() => {
    const parsed = parseDate(value);
    if (parsed) setParts(parsed);
    else if (allowEmpty && !value) setParts({ year: '', month: '', day: '' });
  }, [value, allowEmpty]);

  const currentYear = today.getFullYear();
  const years = useMemo(() => {
    const items: string[] = [];
    for (let y = currentYear + 2; y >= currentYear - 8; y -= 1) {
      items.push(String(y));
    }
    return items;
  }, [currentYear]);

  const dayOptions = useMemo(() => {
    if (!parts.year || !parts.month) return [];
    const maxDays = daysInMonth(Number(parts.year), Number(parts.month));
    return Array.from({ length: maxDays }, (_, i) => String(i + 1).padStart(2, '0'));
  }, [parts.year, parts.month]);

  const apply = (next: { year: string; month: string; day: string }) => {
    let safe = { ...next };
    if (safe.year && safe.month && safe.day) {
      const maxDays = daysInMonth(Number(safe.year), Number(safe.month));
      if (Number(safe.day) > maxDays) {
        safe.day = String(maxDays).padStart(2, '0');
      }
    }
    setParts(safe);

    if (!safe.year || !safe.month || !safe.day) {
      onChange(allowEmpty ? '' : value);
      return;
    }
    onChange(`${safe.year}-${safe.month}-${safe.day}`);
  };

  return (
    <div className="date-selects">
      <select value={parts.day} onChange={(e) => apply({ ...parts, day: e.target.value })} disabled={!parts.month || !parts.year}>
        <option value="" disabled>
          Day
        </option>
        {dayOptions.map((day) => (
          <option key={day} value={day}>
            {day}
          </option>
        ))}
      </select>
      <select value={parts.month} onChange={(e) => apply({ ...parts, month: e.target.value })}>
        <option value="" disabled>
          Month
        </option>
        {MONTHS.map((m) => (
          <option key={m.value} value={m.value}>
            {m.label}
          </option>
        ))}
      </select>
      <select value={parts.year} onChange={(e) => apply({ ...parts, year: e.target.value })}>
        <option value="" disabled>
          Year
        </option>
        {years.map((year) => (
          <option key={year} value={year}>
            {year}
          </option>
        ))}
      </select>
      {allowEmpty ? (
        <button
          type="button"
          className="btn-outline date-clear"
          onClick={() => {
            setParts({ year: '', month: '', day: '' });
            onChange('');
          }}
        >
          No End Date
        </button>
      ) : null}
    </div>
  );
}
