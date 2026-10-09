import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Building2,
  Camera,
  Calendar,
  CheckCircle2,
  ClipboardList,
  Crosshair,
  Image as ImageIcon,
  Loader2,
  MapPin,
  ShieldAlert,
  Sparkles,
  Undo2,
  User as UserIcon,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { adminApi, ApiError, reportApi } from '../services/api';
import { DuplicateMatch, HistoryEntry, Priority, Report, Status } from '../types';
import { PriorityBadge, StatusBadge } from '../components/Badges';
import { StatusTimeline } from '../components/StatusTimeline';
import { MapView } from '../components/MapView';
import { ImageUpload } from '../components/ImageUpload';
import { Spinner } from '../components/Spinner';
import { EmptyState, ErrorState } from '../components/States';
import {
  CATEGORY_LABELS,
  DEPARTMENTS,
  PRIORITIES,
  PRIORITY_LABELS,
  STATUS_LABELS,
  formatCoords,
  formatDate,
  formatDateTime,
} from '../utils/constants';
import { reportDetailPath } from '../utils/paths';

export function ComplaintDetails() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { success, error } = useToast();
  const navigate = useNavigate();
  const isAdmin = user?.role === 'admin';

  const [report, setReport] = useState<Report | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [duplicates, setDuplicates] = useState<DuplicateMatch[]>([]);
  const [nextStatuses, setNextStatuses] = useState<Status[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // admin action state
  const [statusTarget, setStatusTarget] = useState<Status | ''>('');
  const [note, setNote] = useState('');
  const [resolutionNote, setResolutionNote] = useState('');
  const [resolutionFile, setResolutionFile] = useState<File | null>(null);
  const [department, setDepartment] = useState('');
  const [team, setTeam] = useState('');
  const [priority, setPriorityLocal] = useState<Priority | ''>('');
  const [priorityReason, setPriorityReason] = useState('');
  const [busy, setBusy] = useState(false);

  const load = async () => {
    if (!id) return;
    setLoading(true);
    setLoadError(null);
    try {
      if (isAdmin) {
        const data = await adminApi.get(id);
        setReport(data.report);
        setHistory(data.history);
        setDuplicates(data.duplicates);
        setNextStatuses(data.nextStatuses);
        setDepartment(data.report.department);
        setTeam(data.report.team);
      } else {
        const data = await reportApi.get(id);
        setReport(data.report);
        setHistory(data.history);
      }
    } catch (err) {
      setLoadError(err instanceof ApiError ? err.message : 'Could not load this complaint.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, isAdmin]);

  const changeStatus = async () => {
    if (!report || !statusTarget) return;
    if (statusTarget === 'resolved' && !resolutionNote.trim()) {
      error('Please add a resolution note before marking this as resolved.');
      return;
    }
    setBusy(true);
    try {
      const formData = new FormData();
      formData.append('status', statusTarget);
      if (note) formData.append('note', note);
      if (resolutionNote) formData.append('resolutionNote', resolutionNote);
      if (resolutionFile) formData.append('resolutionImage', resolutionFile);
      const { report: updated } = await adminApi.updateStatus(report.id, formData);
      setReport(updated);
      success(`Status updated to ${STATUS_LABELS[statusTarget]}.`);
      setStatusTarget('');
      setNote('');
      setResolutionNote('');
      setResolutionFile(null);
      void load();
    } catch (err) {
      error(err instanceof ApiError ? err.message : 'Could not update status.');
      setStatusTarget('');
      void load();
    } finally {
      setBusy(false);
    }
  };

  const saveAssignment = async () => {
    if (!report) return;
    setBusy(true);
    try {
      const { report: updated, statusChanged } = await adminApi.assign(report.id, { department, team });
      setReport(updated);
      success(statusChanged ? 'Complaint assigned — status moved to Assigned.' : 'Assignment updated.');
      void load();
    } catch (err) {
      error(err instanceof ApiError ? err.message : 'Could not assign this complaint.');
    } finally {
      setBusy(false);
    }
  };

  const savePriority = async () => {
    if (!report || !priority) return;
    setBusy(true);
    try {
      const { report: updated } = await adminApi.setPriority(report.id, { priority, reason: priorityReason });
      setReport(updated);
      success(`Priority updated to ${PRIORITY_LABELS[priority]}.`);
      setPriorityLocal('');
      setPriorityReason('');
      void load();
    } catch (err) {
      error(err instanceof ApiError ? err.message : 'Could not update priority.');
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return <Spinner label="Loading complaint…" />;
  }

  if (loadError || !report) {
    return <ErrorState message={loadError || 'Complaint not found'} onRetry={load} />;
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <Link
          to={isAdmin ? '/admin/complaints' : '/complaints'}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>
        <h1 className="font-mono text-lg font-bold text-slate-900">{report.complaintId}</h1>
        <StatusBadge status={report.status} />
        <PriorityBadge priority={report.priority} suggested={report.prioritySource === 'auto'} />
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        {/* --------------------------- Main column --------------------------- */}
        <div className="space-y-5 lg:col-span-2">
          <section className="rounded-xl border border-slate-200 bg-white p-5">
            <h2 className="text-sm font-semibold text-slate-800">{report.title}</h2>
            <p className="mt-1 text-xs font-medium text-slate-400">
              {CATEGORY_LABELS[report.category]} · reported {formatDate(report.createdAt)}
            </p>
            <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
              {report.description}
            </p>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-5">
            <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-800">
              <Camera className="h-4 w-4 text-navy-600" /> Photos
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Original report photo
                </p>
                {report.imageUrl ? (
                  <a href={report.imageUrl} target="_blank" rel="noreferrer">
                    <img
                      src={report.imageUrl}
                      alt="Original report"
                      className="h-56 w-full rounded-lg border border-slate-200 object-cover"
                    />
                  </a>
                ) : (
                  <div className="flex h-56 flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-slate-300 bg-slate-50 text-slate-400">
                    <ImageIcon className="h-6 w-6" />
                    <span className="text-xs">No photo uploaded</span>
                  </div>
                )}
              </div>
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Resolution photo (after repair)
                </p>
                {report.resolutionImageUrl ? (
                  <a href={report.resolutionImageUrl} target="_blank" rel="noreferrer">
                    <img
                      src={report.resolutionImageUrl}
                      alt="After repair"
                      className="h-56 w-full rounded-lg border border-accent-500/40 object-cover"
                    />
                  </a>
                ) : (
                  <div className="flex h-56 flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-slate-300 bg-slate-50 text-slate-400">
                    <ImageIcon className="h-6 w-6" />
                    <span className="text-xs">{report.status === 'resolved' ? 'Photo not attached' : 'Not available yet'}</span>
                  </div>
                )}
                {report.resolutionNote && report.status === 'resolved' ? (
                  <p className="mt-2 rounded-lg bg-accent-100/70 px-3 py-2 text-xs leading-relaxed text-accent-700">
                    {report.resolutionNote}
                  </p>
                ) : null}
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-5">
            <h2 className="mb-5 flex items-center gap-2 text-sm font-semibold text-slate-800">
              <ClipboardList className="h-4 w-4 text-navy-600" /> Status timeline
            </h2>
            <StatusTimeline history={history} currentStatus={report.status} />
          </section>
        </div>

        {/* --------------------------- Side column --------------------------- */}
        <div className="space-y-5">
          <section className="rounded-xl border border-slate-200 bg-white p-5">
            <h2 className="mb-4 text-sm font-semibold text-slate-800">Details</h2>
            <dl className="space-y-3 text-sm">
              <div className="flex items-start justify-between gap-2">
                <dt className="flex items-center gap-1.5 text-slate-400">
                  <UserIcon className="h-3.5 w-3.5" /> Reported by
                </dt>
                <dd className="text-right font-medium text-slate-700">{report.citizenName || 'Citizen'}</dd>
              </div>
              <div className="flex items-start justify-between gap-2">
                <dt className="flex items-center gap-1.5 text-slate-400">
                  <Building2 className="h-3.5 w-3.5" /> Department
                </dt>
                <dd className="text-right font-medium text-slate-700">
                  {report.department || 'Not assigned'}
                  {report.team ? <span className="block text-xs text-slate-400">{report.team}</span> : null}
                </dd>
              </div>
              <div className="flex items-start justify-between gap-2">
                <dt className="flex items-center gap-1.5 text-slate-400">
                  <Calendar className="h-3.5 w-3.5" /> Submitted
                </dt>
                <dd className="text-right font-medium text-slate-700">{formatDateTime(report.createdAt)}</dd>
              </div>
              {report.resolvedAt ? (
                <div className="flex items-start justify-between gap-2">
                  <dt className="flex items-center gap-1.5 text-slate-400">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Resolved
                  </dt>
                  <dd className="text-right font-medium text-slate-700">{formatDateTime(report.resolvedAt)}</dd>
                </div>
              ) : null}
            </dl>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-5">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-800">
              <MapPin className="h-4 w-4 text-navy-600" /> Location
            </h2>
            <p className="text-sm text-slate-600">
              {report.address || 'No address provided'}
            </p>
            <p className="mt-1 font-mono text-xs text-slate-400">{formatCoords(report.latitude, report.longitude)}</p>
            {report.latitude != null && report.longitude != null ? (
              <div className="mt-3">
                <MapView reports={[report]} height="220px" selectedId={report.id} />
              </div>
            ) : (
              <p className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-400">
                No coordinates were provided for this complaint.
              </p>
            )}
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-5">
            <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-800">
              <ShieldAlert className="h-4 w-4 text-navy-600" /> Priority
            </h2>
            <p className="flex items-center gap-2 text-2xl font-bold capitalize text-slate-900">
              {report.priority}
              {report.prioritySource === 'auto' ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-accent-100 px-2 py-0.5 text-[10px] font-semibold text-accent-700">
                  <Sparkles className="h-3 w-3" /> auto-suggested
                </span>
              ) : (
                <span className="rounded-full bg-navy-50 px-2 py-0.5 text-[10px] font-semibold text-navy-700">
                  set by admin
                </span>
              )}
            </p>
            <p className="mt-2 rounded-lg bg-slate-50 px-3 py-2 text-xs leading-relaxed text-slate-500">
              {report.priorityReason}
            </p>
          </section>

          {isAdmin ? (
            <>
              <section className="rounded-xl border border-slate-200 bg-white p-5">
                <h2 className="mb-4 text-sm font-semibold text-slate-800">Administrator actions</h2>

                <div className="space-y-4">
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Move to next stage
                    </label>
                    {nextStatuses.length === 0 ? (
                      <p className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">
                        No further transitions are allowed from this status.
                      </p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {nextStatuses.map((s) => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => {
                              setStatusTarget(s);
                              setNote(s === 'in_progress' ? 'Field team dispatched.' : '');
                            }}
                            className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
                              statusTarget === s
                                ? 'border-navy-800 bg-navy-900 text-white'
                                : 'border-slate-300 bg-white text-slate-600 hover:bg-slate-50'
                            }`}
                          >
                            {s === 'resolved' ? 'Mark resolved' : STATUS_LABELS[s]}
                          </button>
                        ))}
                      </div>
                    )}

                    {statusTarget === 'resolved' ? (
                      <div className="mt-3 space-y-3 rounded-lg bg-accent-100/40 p-3">
                        <label className="block text-xs font-medium text-slate-600">
                          Resolution note <span className="text-rose-600">*</span>
                        </label>
                        <textarea
                          value={resolutionNote}
                          onChange={(e) => setResolutionNote(e.target.value)}
                          rows={2}
                          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-accent-600 focus:ring-2 focus:ring-accent-100"
                          placeholder="What was done to fix this issue?"
                        />
                        <ImageUpload
                          file={resolutionFile}
                          onFile={setResolutionFile}
                          label="After-repair photo (optional)"
                        />
                      </div>
                    ) : null}

                    {statusTarget && statusTarget !== 'resolved' ? (
                      <div className="mt-3 space-y-3 rounded-lg bg-slate-50 p-3">
                        <label className="block text-xs font-medium text-slate-600">
                          Progress note <span className="text-slate-400">(optional)</span>
                        </label>
                        <input
                          value={note}
                          onChange={(e) => setNote(e.target.value)}
                          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-navy-600 focus:ring-2 focus:ring-navy-100"
                          placeholder="e.g. Crew dispatched to site"
                        />
                      </div>
                    ) : null}

                    {statusTarget ? (
                      <button
                        type="button"
                        onClick={changeStatus}
                        disabled={busy}
                        className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-navy-900 px-4 py-2 text-xs font-semibold text-white hover:bg-navy-800 disabled:opacity-60"
                      >
                        {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                        Confirm status change to {STATUS_LABELS[statusTarget]}
                      </button>
                    ) : null}
                  </div>

                  <div className="border-t border-slate-100 pt-4">
                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Assign department &amp; team
                    </label>
                    <select
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-navy-600 focus:ring-2 focus:ring-navy-100"
                    >
                      {DEPARTMENTS.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                    <input
                      value={team}
                      onChange={(e) => setTeam(e.target.value)}
                      placeholder="Team (optional)"
                      className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-navy-600 focus:ring-2 focus:ring-navy-100"
                    />
                    <button
                      type="button"
                      onClick={saveAssignment}
                      disabled={busy}
                      className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-navy-800 bg-white px-4 py-2 text-xs font-semibold text-navy-800 hover:bg-navy-50 disabled:opacity-60"
                    >
                      <Building2 className="h-3.5 w-3.5" /> Save assignment
                    </button>
                    {report.status === 'pending' ? (
                      <p className="mt-1.5 text-[11px] text-slate-400">
                        Assigning a department moves this complaint from Pending to Assigned.
                      </p>
                    ) : null}
                  </div>

                  <div className="border-t border-slate-100 pt-4">
                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Override suggested priority
                    </label>
                    <div className="flex gap-2">
                      {PRIORITIES.map((p) => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setPriorityLocal(p)}
                          className={`flex-1 rounded-lg border px-3 py-1.5 text-xs font-bold capitalize transition ${
                            priority === p
                              ? 'border-navy-800 bg-navy-900 text-white'
                              : 'border-slate-300 bg-white text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          {PRIORITY_LABELS[p]}
                        </button>
                      ))}
                    </div>
                    <input
                      value={priorityReason}
                      onChange={(e) => setPriorityReason(e.target.value)}
                      placeholder="Reason for override (optional)"
                      className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-navy-600 focus:ring-2 focus:ring-navy-100"
                    />
                    <button
                      type="button"
                      onClick={savePriority}
                      disabled={busy || !priority}
                      className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-accent-600 px-4 py-2 text-xs font-semibold text-white hover:bg-accent-700 disabled:opacity-50"
                    >
                      <ShieldAlert className="h-3.5 w-3.5" /> Apply priority
                    </button>
                  </div>
                </div>
              </section>

              {duplicates.length > 0 ? (
                <section className="rounded-xl border border-amber-200 bg-amber-50/60 p-5">
                  <h2 className="flex items-center gap-2 text-sm font-semibold text-amber-900">
                    <Crosshair className="h-4 w-4" /> Possible duplicate reports
                  </h2>
                  <p className="mt-1 text-xs text-amber-800">
                    These may describe the same physical issue. You decide whether to treat them as duplicates.
                  </p>
                  <ul className="mt-3 space-y-2">
                    {duplicates.map((dup) => (
                      <li key={dup.report.id} className="rounded-lg border border-amber-200 bg-white p-3">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-mono text-xs font-semibold text-amber-900">
                            {dup.report.complaintId}
                          </span>
                          <StatusBadge status={dup.report.status} />
                        </div>
                        <p className="mt-1 text-xs font-medium text-slate-700">{dup.report.title}</p>
                        <p className="mt-0.5 text-[11px] text-slate-500">
                          {dup.reason}
                          {dup.distanceMeters != null ? ` · ${dup.distanceMeters} m away` : ''} · {dup.score}%
                        </p>
                        <button
                          type="button"
                          onClick={() => navigate(reportDetailPath(dup.report.id, 'admin'))}
                          className="mt-1.5 text-xs font-semibold text-navy-700 hover:text-navy-900"
                        >
                          Open report →
                        </button>
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}
            </>
          ) : null}
        </div>
      </div>

      {!isAdmin && report.status === 'resolved' ? (
        <section className="flex items-start gap-3 rounded-xl border border-accent-500/30 bg-accent-100/40 p-4">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-accent-600" />
          <div>
            <p className="text-sm font-semibold text-accent-700">This complaint has been resolved</p>
            <p className="mt-0.5 text-sm text-slate-600">
              The authority marked it resolved on {formatDate(report.resolvedAt)}. Compare the original and
              resolution photos above.
            </p>
          </div>
        </section>
      ) : null}
      {!isAdmin && report.status === 'pending' ? (
        <section className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <Undo2 className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
          <div>
            <p className="text-sm font-semibold text-amber-800">Under review</p>
            <p className="mt-0.5 text-sm text-slate-600">
              Your complaint is pending review. It will be assigned to a department and updated here as work
              progresses.
            </p>
          </div>
        </section>
      ) : null}
    </div>
  );
}