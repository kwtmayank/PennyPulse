import { useEffect, useMemo, useState } from 'react';
import { api } from '../api/http';

type DashboardData = {
  month: string;
  totals: { income: number; expense: number; balance: number };
  categoryBreakdown: Record<string, number>;
  transactionCount: number;
};

function currentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

const MONTH_OPTIONS = [
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

export function DashboardPage() {
  const [month, setMonth] = useState(currentMonth());
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState('');
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonthNumber = now.getMonth() + 1;
  const [selectedYear, selectedMonth] = month.split('-');
  const yearOptions = useMemo(() => {
    return [currentYear - 2, currentYear - 1, currentYear, currentYear + 1];
  }, [currentYear]);
  const allowedMonthOptions = useMemo(() => {
    if (Number(selectedYear) === currentYear) {
      return MONTH_OPTIONS.filter((option) => Number(option.value) <= currentMonthNumber);
    }
    if (Number(selectedYear) > currentYear) {
      return [];
    }
    return MONTH_OPTIONS;
  }, [selectedYear, currentYear, currentMonthNumber]);

  useEffect(() => {
    const load = async () => {
      try {
        setError('');
        const res = await api.get<DashboardData>(`/api/dashboard/monthly?month=${month}`);
        setData(res);
      } catch (err) {
        setError((err as Error).message);
      }
    };
    load();
  }, [month]);

  const categories = useMemo(() => Object.entries(data?.categoryBreakdown || {}), [data]);
  const updateMonthPart = (nextYear: string, nextMonth: string) => {
    const nextYearNumber = Number(nextYear);
    const nextMonthNumber = Number(nextMonth);
    if (
      nextYearNumber > currentYear ||
      (nextYearNumber === currentYear && nextMonthNumber > currentMonthNumber)
    ) {
      return;
    }
    setMonth(`${nextYear}-${nextMonth}`);
  };

  return (
    <section className="page">
      <div className="hero-card">
        <div>
          <p className="eyebrow">Insights</p>
          <h2>Monthly Overview</h2>
          <p className="muted-copy">Track your totals and category spend for {month}.</p>
        </div>
        <label className="field-inline month-picker">
          Month
          <div className="month-selects">
            <select value={selectedMonth} onChange={(e) => updateMonthPart(selectedYear, e.target.value)}>
              {allowedMonthOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <select
              value={selectedYear}
              onChange={(e) => {
                const nextYear = e.target.value;
                const clampedMonth =
                  Number(nextYear) === currentYear && Number(selectedMonth) > currentMonthNumber
                    ? String(currentMonthNumber).padStart(2, '0')
                    : selectedMonth;
                updateMonthPart(nextYear, clampedMonth);
              }}
            >
              {yearOptions
                .filter((year) => year <= currentYear)
                .map((year) => (
                <option key={year} value={String(year)}>
                  {year}
                </option>
                ))}
            </select>
          </div>
        </label>
      </div>
      {error && <p className="error">{error}</p>}
      {data ? (
        <div className="grid">
          <article className="card stat-card income"><h3>Income</h3><p>INR {data.totals.income.toFixed(2)}</p></article>
          <article className="card stat-card expense"><h3>Expense</h3><p>INR {data.totals.expense.toFixed(2)}</p></article>
          <article className="card stat-card balance"><h3>Balance</h3><p>INR {data.totals.balance.toFixed(2)}</p></article>
          <article className="card stat-card volume"><h3>Transactions</h3><p>{data.transactionCount}</p></article>
        </div>
      ) : (
        <p className="card loading-card">Loading dashboard...</p>
      )}

      <div className="row">
        <h3>By Category</h3>
        <span className="summary-pill">{categories.length} categories</span>
      </div>
      {categories.length ? (
        <ul className="list">
          {categories.map(([name, amount]) => (
            <li key={name}>
              <span className="list-title">{name}</span>
              <strong>INR {amount.toFixed(2)}</strong>
            </li>
          ))}
        </ul>
      ) : (
        <p>No transactions yet.</p>
      )}
    </section>
  );
}
