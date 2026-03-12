import { useEffect, useMemo, useState } from 'react';
import { api } from '../api/http';
import {
  Bar,
  BarChart,
  Cell,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';

type DashboardData = {
  month: string;
  totals: { income: number; expense: number; balance: number };
  categoryBreakdown: Record<string, number>;
  expenseCategoryBreakdown?: Record<string, number>;
  transactionCount: number;
};

const CHART_COLORS = ['#2e7dff', '#00b4d8', '#7b61ff', '#5db075', '#ff9f43', '#f06595', '#8a99b5'];
const TREND_MONTHS = 6;

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
  const [trendData, setTrendData] = useState<Array<{ label: string; income: number; expense: number; balance: number }>>([]);
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

  useEffect(() => {
    const parseMonth = (value: string) => {
      const [y, m] = value.split('-').map(Number);
      return new Date(y, m - 1, 1);
    };
    const fmtMonthKey = (d: Date) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = (key: string) => {
      const [y, m] = key.split('-').map(Number);
      return new Date(y, m - 1, 1).toLocaleString('en-US', { month: 'short', year: '2-digit' });
    };

    const loadTrend = async () => {
      const base = parseMonth(month);
      const keys: string[] = [];
      for (let i = TREND_MONTHS - 1; i >= 0; i -= 1) {
        const d = new Date(base.getFullYear(), base.getMonth() - i, 1);
        keys.push(fmtMonthKey(d));
      }

      const points = await Promise.all(
        keys.map(async (key) => {
          try {
            const res = await api.get<DashboardData>(`/api/dashboard/monthly?month=${key}`);
            return {
              label: label(key),
              income: res.totals.income,
              expense: res.totals.expense,
              balance: res.totals.balance
            };
          } catch (_err) {
            return { label: label(key), income: 0, expense: 0, balance: 0 };
          }
        })
      );

      setTrendData(points);
    };

    loadTrend();
  }, [month]);

  const expenseCategories = useMemo(
    () => Object.entries(data?.expenseCategoryBreakdown || {}),
    [data]
  );
  const expenseDonutData = useMemo(
    () => expenseCategories.map(([name, amount]) => ({ name, value: amount })),
    [expenseCategories]
  );

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

      {data ? (
        <div className="chart-grid chart-grid-duo">
          <article className="card chart-card trend-card">
            <div className="chart-head">
              <h3>Balance Trend (Last 6 Months)</h3>
              <span className="summary-pill">Balance</span>
            </div>
            <div className="trend-chart-wrap">
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={trendData} margin={{ top: 8, right: 10, left: 0, bottom: 2 }}>
                  <CartesianGrid stroke="#e2ecfa" strokeDasharray="3 3" />
                  <XAxis dataKey="label" tick={{ fill: '#556b8f', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis
                    tick={{ fill: '#556b8f', fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => `${Math.round(v / 1000)}k`}
                  />
                  <Tooltip
                    formatter={(value) => [`INR ${Number(value || 0).toLocaleString('en-IN')}`, 'Balance']}
                    labelFormatter={(v) => `Month: ${v}`}
                  />
                  <Line
                    type="monotone"
                    dataKey="balance"
                    name="Balance"
                    stroke="#7b61ff"
                    strokeWidth={3}
                    dot={{ r: 4, fill: '#7b61ff' }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </article>

          <article className="card chart-card">
            <div className="chart-head">
              <h3>Expense by Category</h3>
              <span className="summary-pill">{expenseDonutData.length} categories</span>
            </div>
            {expenseDonutData.length ? (
              <div className="donut-chart-wrap">
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={expenseDonutData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={66}
                      outerRadius={102}
                      paddingAngle={2}
                    >
                      {expenseDonutData.map((entry, index) => (
                        <Cell
                          key={`${entry.name}-${index}`}
                          fill={CHART_COLORS[index % CHART_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) => `INR ${Number(value || 0).toLocaleString('en-IN')}`}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="loading-card">No expense category data yet.</p>
            )}
          </article>
        </div>
      ) : null}

      {trendData.length ? (
        <>
          <article className="card chart-card trend-card">
            <div className="chart-head">
              <h3>Monthly Trend (Last 6 Months)</h3>
              <span className="summary-pill">Income vs Expense</span>
            </div>
            <div className="trend-chart-wrap">
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={trendData} margin={{ top: 8, right: 10, left: 0, bottom: 2 }}>
                  <CartesianGrid stroke="#e2ecfa" strokeDasharray="3 3" />
                  <XAxis dataKey="label" tick={{ fill: '#556b8f', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis
                    tick={{ fill: '#556b8f', fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => `${Math.round(v / 1000)}k`}
                  />
                  <Tooltip
                    cursor={{ fill: 'rgba(46, 125, 255, 0.08)' }}
                    formatter={(value) => [`INR ${Number(value || 0).toLocaleString('en-IN')}`, '']}
                    labelFormatter={(v) => `Month: ${v}`}
                  />
                  <Legend />
                  <Bar dataKey="income" name="Income" fill="#1a7f4a" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="expense" name="Expense" fill="#2e7dff" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </article>

        </>
      ) : null}
    </section>
  );
}
