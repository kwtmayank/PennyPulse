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
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState('');
  const [editName, setEditName] = useState('');
  const [editKind, setEditKind] = useState('expense');

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
    try {
      await api.del(`/api/categories/${id}`);
      await load();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const openEdit = (cat: Category) => {
    setEditingCategoryId(cat._id);
    setEditName(cat.name);
    setEditKind(cat.kind);
    setShowEditModal(true);
  };

  const update = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingCategoryId) return;
    try {
      await api.patch(`/api/categories/${editingCategoryId}`, { name: editName, kind: editKind });
      setShowEditModal(false);
      setEditingCategoryId('');
      setEditName('');
      setEditKind('expense');
      await load();
    } catch (err) {
      setError((err as Error).message);
    }
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

      <Modal title="Edit Category" open={showEditModal} onClose={() => setShowEditModal(false)}>
        <form className="form-grid" onSubmit={update}>
          <input placeholder="Category name" value={editName} onChange={(e) => setEditName(e.target.value)} required />
          <select value={editKind} onChange={(e) => setEditKind(e.target.value)}>
            <option value="expense">Expense</option>
            <option value="income">Income</option>
            <option value="both">Both</option>
          </select>
          <button type="submit">Update Category</button>
        </form>
      </Modal>
      {error && <p className="error">{error}</p>}

      {!categories.length ? <p>No categories yet. Create your first one.</p> : null}
      <ul className="list">
        {categories.map((cat) => (
          <li key={cat._id}>
            <span>
              {cat.name} ({cat.kind})
            </span>
            <div className="item-actions">
              <button
                type="button"
                className="icon-btn"
                aria-label={`Edit ${cat.name}`}
                title="Edit category"
                onClick={() => openEdit(cat)}
              >
                <i className="bi bi-pencil-square" aria-hidden="true" />
              </button>
              <button
                type="button"
                className="icon-btn icon-btn-danger"
                aria-label={`Archive ${cat.name}`}
                title="Archive category"
                onClick={() => archive(cat._id)}
              >
                <i className="bi bi-archive" aria-hidden="true" />
              </button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
