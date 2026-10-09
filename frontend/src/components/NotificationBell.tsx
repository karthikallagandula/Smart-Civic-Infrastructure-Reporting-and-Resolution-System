import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCheck } from 'lucide-react';
import { notificationApi } from '../services/api';
import { Notification } from '../types';
import { timeAgo } from '../utils/constants';
import { useAuth } from '../context/AuthContext';

export function NotificationBell() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    try {
      const data = await notificationApi.list();
      setItems(data.notifications);
      setUnread(data.unread);
    } catch {
      /* silent — the bell should never break the page */
    }
  }, [user]);

  useEffect(() => {
    void load();
    const timer = setInterval(load, 45000);
    return () => clearInterval(timer);
  }, [load]);

  useEffect(() => {
    function onClick(event: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const markRead = async (note: Notification) => {
    if (!note.read) {
      try {
        await notificationApi.markRead(note.id);
        setItems((prev) => prev.map((n) => (n.id === note.id ? { ...n, read: true } : n)));
        setUnread((u) => Math.max(0, u - 1));
      } catch {
        /* ignore */
      }
    }
  };

  const markAll = async () => {
    try {
      await notificationApi.markAllRead();
      setItems((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnread(0);
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="relative" ref={boxRef}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-navy-800"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        {unread > 0 ? (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
            {unread > 9 ? '9+' : unread}
          </span>
        ) : null}
      </button>
      {open ? (
        <div className="absolute right-0 z-[1100] mt-2 w-[min(92vw,360px)] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-100 px-3 py-2">
            <p className="text-sm font-semibold text-slate-800">Notifications</p>
            <button
              onClick={markAll}
              className="inline-flex items-center gap-1 text-xs font-medium text-navy-700 hover:text-navy-900"
            >
              <CheckCheck className="h-3.5 w-3.5" /> Mark all read
            </button>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {items.length === 0 ? (
              <p className="px-3 py-6 text-center text-sm text-slate-400">No notifications yet</p>
            ) : (
              items.slice(0, 8).map((note) => (
                <button
                  key={note.id}
                  onClick={() => {
                    void markRead(note);
                    if (note.reportId) {
                      navigate(user?.role === 'admin' ? `/admin/reports/${note.reportId}` : `/complaints/${note.reportId}`);
                      setOpen(false);
                    }
                  }}
                  className={`block w-full border-b border-slate-50 px-3 py-2.5 text-left hover:bg-slate-50 ${
                    note.read ? '' : 'bg-navy-50/60'
                  }`}
                >
                  <p className="text-sm text-slate-700">{note.message}</p>
                  <p className="mt-0.5 text-xs text-slate-400">{timeAgo(note.createdAt)}</p>
                </button>
              ))
            )}
          </div>
          <button
            onClick={() => {
              navigate('/notifications');
              setOpen(false);
            }}
            className="block w-full bg-slate-50 px-3 py-2 text-center text-xs font-semibold text-navy-700 hover:bg-slate-100"
          >
            View all notifications
          </button>
        </div>
      ) : null}
    </div>
  );
}
