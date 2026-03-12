import { FormEvent, useEffect, useState } from 'react';
import { api } from '../api/http';

type Category = { _id: string; name: string; kind: 'income' | 'expense' | 'both' };
type Txn = {
  _id: string;
  type: 'income' | 'expense';
  amount: number;
  txnDate: string;
  note: string;
  category?: { name: string };
  source: 'manual' | 'recurring';
};

export function TransactionsPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<Txn[]>([]);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    type: 'expense',
    amount: '',
    category: '',
    note: '',
    txnDate: new Date().toISOString().slice(0, 10)
  });

  const load = async () => {
    try {
      setError('');
      const [cats, txns] = await Promise.all([
        api.get<Category[]>('/api/categories'),
        api.get<Txn[]>('/api/transactions')
      ]);
      setCategories(cats);
      setTransactions(txns);
      if (!form.category && cats.length) {
        setForm((prev) => ({ ...prev, category: cats[0]._id }));
      }
    } catch (err) {
      setError((err as Error).message);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.category) {
      setError('Create a category first.');
      return;
    }

    try {
      await api.post('/api/transactions', {
        ...form,
        amount: Number(form.amount),
        txnDate: new Date(form.txnDate).toISOString()
      });
      setForm((prev) => ({ ...prev, amount: '', note: '' }));
      await load();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <section>
      <h2>Transactions</h2>
      <form className="card form-grid" onSubmit={onSubmit}>
        <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
          <option value="expense">Expense</option>
          <option value="income">Income</option>
        </select>
        <input placeholder="Amount" type="number" min="0" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required />
        <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} required>
          <option value="">Select category</option>
          {categories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
        </select>
        <input type="date" value={form.txnDate} onChange={(e) => setForm({ ...form, txnDate: e.target.value })} required />
        <input placeholder="Note" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
        <button type="submit">Add transaction</button>
      </form>

      {error && <p className="error">{error}</p>}

      <ul className="list">
        {transactions.map((t) => (
          <li key={t._id}>
            <strong>{t.type.toUpperCase()}</strong> INR {t.amount.toFixed(2)} - {t.category?.name || 'Uncategorized'} ({new Date(t.txnDate).toLocaleDateString()})
            {t.source === 'recurring' ? ' [Recurring]' : ''}
          </li>
        ))}
      </ul>
    </section>
  );
}
