import { AlertTriangle, Inbox, RefreshCw } from 'lucide-react';

export function EmptyState({
  title,
  message,
  action,
  icon: Icon = Inbox,
}: {
  title: string;
  message: string;
  action?: React.ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
      <div className="rounded-full bg-navy-50 p-3">
        <Icon className="h-6 w-6 text-navy-600" />
      </div>
      <div>
        <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
        <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">{message}</p>
      </div>
      {action}
    </div>
  );
}

export function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-rose-200 bg-rose-50/60 px-6 py-8 text-center">
      <AlertTriangle className="h-6 w-6 text-rose-600" />
      <p className="max-w-md text-sm text-rose-800">{message}</p>
      {onRetry ? (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-2 rounded-lg bg-white px-3 py-1.5 text-sm font-semibold text-rose-700 ring-1 ring-rose-200 hover:bg-rose-50"
        >
          <RefreshCw className="h-4 w-4" /> Retry
        </button>
      ) : null}
    </div>
  );
}
