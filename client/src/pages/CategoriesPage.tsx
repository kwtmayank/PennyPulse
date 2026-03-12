import { FormEvent, useEffect, useState } from 'react';
import { api } from '../api/http';
import { Modal } from '../components/Modal';

type Category = { _id: string; name: string; kind: string };

export function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [name, setName] = useState('');
  const [kind, setKind] = useState('expense');
  const [error, setError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const load = async () => {
    try {
      setError('');
      setCategories(await api.get<Category[]>('/api/categories'));
    } catch (err) {
      setError((err as Error).message);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const add = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/api/categories', { name, kind });
      setName('');
      setShowCreateModal(false);
      await load();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const archive = async (id: string) => {
    await api.del(`/api/categories/${id}`);
    await load();
  };

  return (
    <section className="page">
      <div className="hero-card">
        <div>
          <p className="eyebrow">Organize</p>
          <h2>Categories</h2>
          <p className="muted-copy">Keep your income and expense buckets tidy.</p>
        </div>
        <div className="hero-actions">
          <span className="pill">{categories.length} total</span>
          <button type="button" onClick={() => setShowCreateModal(true)}>
            Add Category
          </button>
        </div>
      </div>

      <Modal title="Add Category" open={showCreateModal} onClose={() => setShowCreateModal(false)}>
        <form className="form-grid" onSubmit={add}>
          <input placeholder="Category name" value={name} onChange={(e) => setName(e.target.value)} required />
          <select value={kind} onChange={(e) => setKind(e.target.value)}>
            <option value="expense">Expense</option>
            <option value="income">Income</option>
            <option value="both">Both</option>
          </select>
          <button type="submit">Save Category</button>
        </form>
      </Modal>
      {error && <p className="error">{error}</p>}

      {!categories.length ? <p>No categories yet. Create your first one.</p> : null}
      <ul className="list">
        {categories.map((cat) => (
          <li key={cat._id}>
            {cat.name} ({cat.kind})
            <button className="btn-outline" onClick={() => archive(cat._id)}>Archive</button>
          </li>
        ))}
      </ul>
    </section>
  );
}
