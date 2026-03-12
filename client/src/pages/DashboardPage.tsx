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

export function DashboardPage() {
  const [month, setMonth] = useState(currentMonth());
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState('');

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

  return (
    <section>
      <div className="row">
        <h2>Monthly Overview</h2>
        <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} />
      </div>
      {error && <p className="error">{error}</p>}
      {data ? (
        <div className="grid">
          <article className="card"><h3>Income</h3><p>INR {data.totals.income.toFixed(2)}</p></article>
          <article className="card"><h3>Expense</h3><p>INR {data.totals.expense.toFixed(2)}</p></article>
          <article className="card"><h3>Balance</h3><p>INR {data.totals.balance.toFixed(2)}</p></article>
          <article className="card"><h3>Transactions</h3><p>{data.transactionCount}</p></article>
        </div>
      ) : (
        <p>Loading dashboard...</p>
      )}

      <h3>By Category</h3>
      {categories.length ? (
        <ul className="list">
          {categories.map(([name, amount]) => (
            <li key={name}>{name}: INR {amount.toFixed(2)}</li>
          ))}
        </ul>
      ) : (
        <p>No transactions yet.</p>
      )}
    </section>
  );
}
