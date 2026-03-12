import { FormEvent, useEffect, useState } from 'react';
import { api } from '../api/http';
import { Modal } from '../components/Modal';
import { CompactDateSelect } from '../components/CompactDateSelect';

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
  const [showCreateModal, setShowCreateModal] = useState(false);
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
      setShowCreateModal(false);
      await load();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <section className="page">
      <div className="hero-card">
        <div>
          <p className="eyebrow">Ledger</p>
          <h2>Transactions</h2>
          <p className="muted-copy">Capture income and expenses in one place.</p>
        </div>
        <div className="hero-actions">
          <span className="pill">{transactions.length} entries</span>
          <button type="button" onClick={() => setShowCreateModal(true)}>
            Add Transaction
          </button>
        </div>
      </div>

      <Modal title="Add Transaction" open={showCreateModal} onClose={() => setShowCreateModal(false)}>
        <form className="form-grid" onSubmit={onSubmit}>
          <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
            <option value="expense">Expense</option>
            <option value="income">Income</option>
          </select>
          <input placeholder="Amount" type="number" min="0" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required />
          <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} required>
            <option value="">Select category</option>
            {categories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
          </select>
          <CompactDateSelect value={form.txnDate} onChange={(next) => setForm({ ...form, txnDate: next })} />
          <input placeholder="Note" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
          <button type="submit">Save Transaction</button>
        </form>
      </Modal>

      {error && <p className="error">{error}</p>}

      <ul className="list">
        {transactions.map((t) => (
          <li key={t._id}>
            <div>
              <span className={`txn-badge ${t.type === 'income' ? 'income' : 'expense'}`}>{t.type.toUpperCase()}</span>
              <p className="txn-main">INR {t.amount.toFixed(2)} - {t.category?.name || 'Uncategorized'}</p>
              <p className="txn-meta">{new Date(t.txnDate).toLocaleDateString()}</p>
            </div>
            {t.source === 'recurring' ? <span className="pill">Scheduled</span> : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
