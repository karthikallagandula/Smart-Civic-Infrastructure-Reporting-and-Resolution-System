import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCheck } from 'lucide-react';
import { notificationApi } from '../services/api';
import { Notification } from '../types';
import { NotificationBell } from '../components/NotificationBell';
import { EmptyState } from '../components/States';
import { Spinner } from '../components/Spinner';
import { timeAgo } from '../utils/constants';
import { useAuth } from '../context/AuthContext';
import { reportDetailPath } from '../utils/paths';

const TYPE_STYLES: Record<string, string> = {
  submitted: 'bg-accent-100 text-accent-700',
  assigned: 'bg-sky-100 text-sky-700',
  status: 'bg-indigo-100 text-indigo-700',
  resolved: 'bg-accent-100 text-accent-700',
  info: 'bg-navy-100 text-navy-700',
};

export function NotificationsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const data = await notificationApi.list();
      setItems(data.notifications);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const markRead = async (note: Notification) => {
    if (note.read) return;
    try {
      await notificationApi.markRead(note.id);
      setItems((prev) => prev.map((n) => (n.id === note.id ? { ...n, read: true } : n)));
    } catch {
      /* ignore */
    }
  };

  const markAll = async () => {
    try {
      await notificationApi.markAllRead();
      setItems((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">Notifications</h1>
          <p className="mt-1 text-sm text-slate-500">
            Updates about your complaints and authority actions.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <NotificationBell />
          <button
            onClick={markAll}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
          >
            <CheckCheck className="h-4 w-4" /> Mark all read
          </button>
        </div>
      </div>

      {loading ? (
        <Spinner label="Loading notifications…" />
      ) : items.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="No notifications"
          message="You will be notified when your complaints are assigned, updated or resolved."
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          {items.map((note) => (
            <button
              key={note.id}
              onClick={() => {
                void markRead(note);
                if (note.reportId) {
                  navigate(reportDetailPath(note.reportId, user?.role || 'citizen'));
                }
              }}
              className={`flex w-full items-start gap-3 border-b border-slate-100 p-4 text-left last:border-0 hover:bg-slate-50 ${
                note.read ? '' : 'bg-navy-50/60'
              }`}
            >
              <span className={`mt-0.5 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${TYPE_STYLES[note.type] || TYPE_STYLES.info}`}>
                {note.type}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm text-slate-700">{note.message}</p>
                {note.complaintId ? (
                  <p className="mt-0.5 font-mono text-xs font-semibold text-navy-700">{note.complaintId}</p>
                ) : null}
                <p className="mt-1 text-xs text-slate-400">{timeAgo(note.createdAt)}</p>
              </div>
              {!note.read ? (
                <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-accent-600" aria-label="Unread" />
              ) : null}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}