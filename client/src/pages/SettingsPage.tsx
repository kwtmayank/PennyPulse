import { FormEvent, useEffect, useState } from 'react';
import { api } from '../api/http';

type Settings = { defaultCurrency: string; timezone: string };

export function SettingsPage() {
  const [settings, setSettings] = useState<Settings>({ defaultCurrency: 'INR', timezone: 'Asia/Kolkata' });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const load = async () => {
    try {
      const data = await api.get<Settings>('/api/settings');
      setSettings({
        defaultCurrency: data.defaultCurrency || 'INR',
        timezone: data.timezone || 'Asia/Kolkata'
      });
    } catch (err) {
      setError((err as Error).message);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const data = await api.patch<Settings>('/api/settings', settings);
      setSettings(data);
      setMessage('Settings saved');
      setError('');
    } catch (err) {
      setError((err as Error).message);
      setMessage('');
    }
  };

  return (
    <section>
      <h2>Settings</h2>
      <form className="card form-grid" onSubmit={onSubmit}>
        <label>
          Default currency
          <input value={settings.defaultCurrency} onChange={(e) => setSettings({ ...settings, defaultCurrency: e.target.value.toUpperCase() })} />
        </label>
        <label>
          Timezone
          <input value={settings.timezone} onChange={(e) => setSettings({ ...settings, timezone: e.target.value })} />
        </label>
        <button type="submit">Save settings</button>
      </form>
      {message && <p className="success">{message}</p>}
      {error && <p className="error">{error}</p>}
    </section>
  );
}
