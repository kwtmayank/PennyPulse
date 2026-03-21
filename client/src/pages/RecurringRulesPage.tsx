import { FormEvent, useEffect, useState } from 'react';
import { api } from '../api/http';
import { Modal } from '../components/Modal';
import { CompactDateSelect } from '../components/CompactDateSelect';

type Category = { _id: string; name: string };
type Rule = {
  _id: string;
  name: string;
  type: 'income' | 'expense';
  frequency: string;
  amount: number;
  startDate: string;
  endDate?: string | null;
  note?: string;
  nextRunAt: string;
  isActive: boolean;
  category?: { _id: string; name: string };
};

export function RecurringRulesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [rules, setRules] = useState<Rule[]>([]);
  const [error, setError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingRuleId, setEditingRuleId] = useState('');
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
  const [editForm, setEditForm] = useState({
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

  const openEdit = (rule: Rule) => {
    setEditingRuleId(rule._id);
    setEditForm({
      name: rule.name || '',
      type: rule.type || 'expense',
      amount: String(rule.amount),
      category: rule.category?._id || '',
      frequency: rule.frequency || 'monthly',
      startDate: rule.startDate ? new Date(rule.startDate).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
      endDate: rule.endDate ? new Date(rule.endDate).toISOString().slice(0, 10) : '',
      note: rule.note || ''
    });
    setShowEditModal(true);
  };

  const onEditSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingRuleId) return;
    if (!editForm.category) {
      setError('Category is required.');
      return;
    }
    try {
      await api.patch(`/api/recurring-rules/${editingRuleId}`, {
        ...editForm,
        amount: Number(editForm.amount),
        startDate: new Date(editForm.startDate).toISOString(),
        endDate: editForm.endDate ? new Date(editForm.endDate).toISOString() : null
      });
      setShowEditModal(false);
      setEditingRuleId('');
      await load();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const activeRules = rules.filter((rule) => rule.isActive);
  const totalScheduledAmount = activeRules.reduce((sum, rule) => sum + rule.amount, 0);
  const formattedScheduledAmount = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2
  }).format(totalScheduledAmount);

  return (
    <section className="page">
      <div className="hero-card hero-card-stacked">
        <div className="hero-metrics">
          <span className="pill">{activeRules.length} active rules</span>
          <span className="pill">{formattedScheduledAmount} scheduled total</span>
        </div>
        <div className="hero-main">
          <div>
            <p className="eyebrow">Automation</p>
            <h2>Scheduled Rules</h2>
            <p className="muted-copy">Automate repeated transactions and never miss entries.</p>
          </div>
          <div className="hero-actions hero-actions-stacked">
            <button type="button" onClick={() => setShowCreateModal(true)}>
              Add Schedule
            </button>
          </div>
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
      <Modal title="Edit Scheduled Rule" open={showEditModal} onClose={() => setShowEditModal(false)}>
        <form className="form-grid" onSubmit={onEditSubmit}>
          <input placeholder="Rule name" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} required />
          <select value={editForm.type} onChange={(e) => setEditForm({ ...editForm, type: e.target.value })}>
            <option value="expense">Expense</option>
            <option value="income">Income</option>
          </select>
          <input placeholder="Amount" type="number" min="0" step="0.01" value={editForm.amount} onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })} required />
          <select value={editForm.category} onChange={(e) => setEditForm({ ...editForm, category: e.target.value })} required>
            <option value="">Select category</option>
            {categories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
          </select>
          <select value={editForm.frequency} onChange={(e) => setEditForm({ ...editForm, frequency: e.target.value })}>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
          </select>
          <CompactDateSelect value={editForm.startDate} onChange={(next) => setEditForm({ ...editForm, startDate: next })} />
          <CompactDateSelect value={editForm.endDate} allowEmpty onChange={(next) => setEditForm({ ...editForm, endDate: next })} />
          <input placeholder="Note" value={editForm.note} onChange={(e) => setEditForm({ ...editForm, note: e.target.value })} />
          <button type="submit">Update Rule</button>
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
            <div className="item-actions">
              <strong className="amount-label">INR {rule.amount.toFixed(2)}</strong>
              <button
                type="button"
                className="icon-btn"
                aria-label={`Edit ${rule.name}`}
                title="Edit rule"
                onClick={() => openEdit(rule)}
              >
                <i className="bi bi-pencil-square" aria-hidden="true" />
              </button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
