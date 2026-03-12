import { FormEvent, useEffect, useState } from 'react';
import { api } from '../api/http';
import { Modal } from '../components/Modal';
import { CompactDateSelect } from '../components/CompactDateSelect';

type Category = { _id: string; name: string };
type Rule = {
  _id: string;
  name: string;
  frequency: string;
  amount: number;
  nextRunAt: string;
  isActive: boolean;
  category?: { name: string };
};

export function RecurringRulesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [rules, setRules] = useState<Rule[]>([]);
  const [error, setError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [form, setForm] = useState({
    name: '',
    type: 'expense',
    amount: '',
    category: '',
    frequency: 'monthly',
    startDate: new Date().toISOString().slice(0, 10),
    endDate: '',
    note: ''
  });

  const load = async () => {
    try {
      setError('');
      const [cats, data] = await Promise.all([
        api.get<Category[]>('/api/categories'),
        api.get<Rule[]>('/api/recurring-rules')
      ]);
      setCategories(cats);
      setRules(data);
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
      await api.post('/api/recurring-rules', {
        ...form,
        amount: Number(form.amount),
        startDate: new Date(form.startDate).toISOString(),
        endDate: form.endDate ? new Date(form.endDate).toISOString() : null
      });
      setForm((prev) => ({ ...prev, name: '', amount: '', note: '' }));
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
          <p className="eyebrow">Automation</p>
          <h2>Scheduled Rules</h2>
          <p className="muted-copy">Automate repeated transactions and never miss entries.</p>
        </div>
        <div className="hero-actions">
          <span className="pill">{rules.length} active rules</span>
          <button type="button" onClick={() => setShowCreateModal(true)}>
            Add Schedule
          </button>
        </div>
      </div>
      <Modal title="Add Scheduled Rule" open={showCreateModal} onClose={() => setShowCreateModal(false)}>
        <form className="form-grid" onSubmit={onSubmit}>
          <input placeholder="Rule name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
            <option value="expense">Expense</option>
            <option value="income">Income</option>
          </select>
          <input placeholder="Amount" type="number" min="0" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required />
          <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} required>
            <option value="">Select category</option>
            {categories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
          </select>
          <select value={form.frequency} onChange={(e) => setForm({ ...form, frequency: e.target.value })}>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
          </select>
          <CompactDateSelect value={form.startDate} onChange={(next) => setForm({ ...form, startDate: next })} />
          <CompactDateSelect value={form.endDate} allowEmpty onChange={(next) => setForm({ ...form, endDate: next })} />
          <input placeholder="Note" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
          <button type="submit">Save Rule</button>
        </form>
      </Modal>

      {error && <p className="error">{error}</p>}

      <ul className="list">
        {rules.map((rule) => (
          <li key={rule._id}>
            <div>
              <strong>{rule.name}</strong>
              <p className="txn-meta">{rule.frequency} | Next run: {new Date(rule.nextRunAt).toLocaleDateString()}</p>
            </div>
            <strong>INR {rule.amount.toFixed(2)}</strong>
          </li>
        ))}
      </ul>
    </section>
  );
}
