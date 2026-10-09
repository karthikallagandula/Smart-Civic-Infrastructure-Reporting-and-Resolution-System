import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  CheckCircle2,
  Crosshair,
  Loader2,
  MapPin,
  Sparkles,
  Wand2,
} from 'lucide-react';
import { ImageUpload } from '../components/ImageUpload';
import { MapPicker } from '../components/MapView';
import { useGeolocation } from '../hooks/useGeolocation';
import { aiApi, ApiError, reportApi } from '../services/api';
import { Category, Report, Severity } from '../types';
import {
  CATEGORY_LABELS,
  CATEGORIES,
  SEVERITY_LABELS,
  SEVERITIES,
  formatCoords,
} from '../utils/constants';
import { useToast } from '../context/ToastContext';

interface FormErrors {
  category?: string;
  title?: string;
  description?: string;
  location?: string;
  general?: string;
}

export function ReportIssue() {
  const navigate = useNavigate();
  const { success } = useToast();
  const { position, loading: geoLoading, error: geoError, request } = useGeolocation();

  const [category, setCategory] = useState<Category | ''>('');
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState<Severity>('medium');
  const [address, setAddress] = useState('');
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [created, setCreated] = useState<Report | null>(null);

  const [aiCategoryBusy, setAiCategoryBusy] = useState(false);
  const [aiCategoryNote, setAiCategoryNote] = useState<string | null>(null);
  const [aiTextBusy, setAiTextBusy] = useState(false);
  const [aiTextNote, setAiTextNote] = useState<string | null>(null);

  const useMyLocation = async () => {
    const result = await request();
    if (result) {
      setCoords({ lat: result.lat, lng: result.lng });
      setErrors((e) => ({ ...e, location: undefined }));
    }
  };

  useEffect(() => {
    void useMyLocation();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const suggestFromImage = async () => {
    if (!file) {
      setAiCategoryNote('Upload a photo first, then CivicConnect can suggest a category.');
      return;
    }
    setAiCategoryBusy(true);
    setAiCategoryNote(null);
    try {
      const result = await aiApi.analyzeImage(file);
      setCategory(result.suggestedCategory);
      setAiCategoryNote(
        `${result.note}${result.confidence != null ? ` Confidence: ${Math.round(result.confidence * 100)}%.` : ''}`
      );
    } catch (err) {
      setAiCategoryNote(err instanceof ApiError ? err.message : 'Could not analyse the image.');
    } finally {
      setAiCategoryBusy(false);
    }
  };

  const assistDescription = async () => {
    if (description.trim().length < 10) {
      setAiTextNote('Write a short description first (at least 10 characters), then use this helper.');
      return;
    }
    setAiTextBusy(true);
    setAiTextNote(null);
    try {
      const result = await aiApi.assistText(description);
      if (result.description) setDescription(result.description);
      setAiTextNote(result.note);
    } catch (err) {
      setAiTextNote(err instanceof ApiError ? err.message : 'Could not tidy up the description.');
    } finally {
      setAiTextBusy(false);
    }
  };

  const validate = (): boolean => {
    const next: FormErrors = {};
    if (!category) next.category = 'Please choose an issue category.';
    if (description.trim().length < 10) next.description = 'Describe the issue in at least 10 characters.';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    setErrors({});
    try {
      const formData = new FormData();
      const autoTitle = description.trim().split(/[.?!]/)[0].slice(0, 110) + (description.trim().length > 110 ? '...' : '');
      formData.append('category', category);
      formData.append('title', autoTitle || 'Issue report');
      formData.append('description', description.trim());
      formData.append('severity', severity);
      formData.append('address', address.trim());
      if (coords) {
        formData.append('latitude', String(coords.lat));
        formData.append('longitude', String(coords.lng));
      }
      if (file) formData.append('image', file);

      const { report } = await reportApi.create(formData);
      setCreated(report);
      success(`Complaint ${report.complaintId} submitted successfully.`);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      if (err instanceof ApiError && err.details?.length) {
        const mapped: FormErrors = { general: err.message };
        err.details.forEach((d) => {
          if (d.path in mapped || ['category', 'title', 'description'].includes(d.path)) {
            mapped[d.path as keyof FormErrors] = d.message;
          }
        });
        setErrors(mapped);
      } else {
        setErrors({ general: err instanceof Error ? err.message : 'Could not submit your complaint.' });
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (created) {
    return (
      <div className="mx-auto max-w-2xl space-y-5">
        <div className="rounded-2xl border border-accent-500/30 bg-accent-100/50 p-6 text-center">
          <CheckCircle2 className="mx-auto h-12 w-12 text-accent-600" />
          <h1 className="mt-3 text-xl font-bold text-slate-900">Complaint submitted</h1>
          <p className="mt-1 text-sm text-slate-600">
            Your issue has been recorded and will be reviewed by the civic authority.
          </p>
          <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Complaint reference number
          </p>
          <p className="font-mono text-2xl font-bold text-navy-900">{created.complaintId}</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-slate-800">Reported issue</h2>
          <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-slate-400">Category</dt>
              <dd className="font-medium text-slate-700">{CATEGORY_LABELS[created.category]}</dd>
            </div>
            <div>
              <dt className="text-slate-400">Suggested priority</dt>
              <dd className="font-medium capitalize text-slate-700">
                {created.priority} {created.prioritySource === 'auto' ? '(auto-suggested)' : ''}
              </dd>
            </div>
            <div>
              <dt className="text-slate-400">Department</dt>
              <dd className="font-medium text-slate-700">{created.department}</dd>
            </div>
            <div>
              <dt className="text-slate-400">Location</dt>
              <dd className="font-medium text-slate-700">
                {formatCoords(created.latitude, created.longitude)}
              </dd>
            </div>
          </dl>
          <p className="mt-3 rounded-lg bg-navy-50 px-3 py-2 text-xs leading-relaxed text-navy-800">
            <strong>Why this priority?</strong> {created.priorityReason}
          </p>
          {created.imageStorage === 'local-demo' ? (
            <p className="mt-2 flex items-start gap-1.5 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              Photo saved to local demo storage — it is not permanently stored remotely. Configure Cloudinary
              for persistent image storage.
            </p>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            to={`/complaints/${created.id}`}
            className="inline-flex items-center gap-2 rounded-lg bg-navy-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-navy-800"
          >
            View complaint &amp; track status
          </Link>
          <button
            onClick={() => navigate('/dashboard')}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Back to dashboard
          </button>
          <button
            onClick={() => {
              setCreated(null);
              setCategory('');
              setDescription('');
              setAddress('');
              setCoords(null);
              setFile(null);
              setSeverity('medium');
              setAiCategoryNote(null);
              setAiTextNote(null);
            }}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Report another issue
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div>
        <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">Report an issue</h1>
        <p className="mt-1 text-sm text-slate-500">
          Provide as much detail as you can. Fields marked with <span className="text-rose-600">*</span> are
          required.
        </p>
      </div>

      {errors.general ? (
        <p className="rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700" role="alert">
          {errors.general}
        </p>
      ) : null}

      <form onSubmit={submit} className="space-y-6" noValidate>
        <section className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="mb-4 text-sm font-semibold text-slate-800">1. Issue details</h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="category" className="mb-1.5 block text-sm font-medium text-slate-700">
                Issue category <span className="text-rose-600">*</span>
              </label>
              <select
                id="category"
                value={category}
                onChange={(e) => {
                  setCategory(e.target.value as Category);
                  setErrors((prev) => ({ ...prev, category: undefined }));
                }}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-navy-600 focus:ring-2 focus:ring-navy-100"
              >
                <option value="">Select a category…</option>
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {CATEGORY_LABELS[cat]}
                  </option>
                ))}
              </select>
              {errors.category ? <p className="mt-1 text-sm text-rose-600">{errors.category}</p> : null}
            </div>
            <div>
              <label htmlFor="severity" className="mb-1.5 block text-sm font-medium text-slate-700">
                How severe does it look? <span className="text-slate-400">(optional)</span>
              </label>
              <select
                id="severity"
                value={severity}
                onChange={(e) => setSeverity(e.target.value as Severity)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-navy-600 focus:ring-2 focus:ring-navy-100"
              >
                {SEVERITIES.map((s) => (
                  <option key={s} value={s}>
                    {SEVERITY_LABELS[s]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-4">
            <div className="mb-1.5 flex items-center justify-between">
              <label htmlFor="description" className="block text-sm font-medium text-slate-700">
                Detailed description <span className="text-rose-600">*</span>
              </label>
              <button
                type="button"
                onClick={assistDescription}
                disabled={aiTextBusy}
                className="inline-flex items-center gap-1.5 rounded-md border border-navy-200 bg-navy-50 px-2.5 py-1 text-xs font-semibold text-navy-700 hover:bg-navy-100 disabled:opacity-60"
              >
                {aiTextBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Wand2 className="h-3.5 w-3.5" />}
                Assist with description
              </button>
            </div>
            <textarea
              id="description"
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                setErrors((prev) => ({ ...prev, description: undefined }));
              }}
              rows={4}
              maxLength={2000}
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-navy-600 focus:ring-2 focus:ring-navy-100"
              placeholder="Describe what is damaged, how long it has been like this, and any safety risk."
            />
            {errors.description ? <p className="mt-1 text-sm text-rose-600">{errors.description}</p> : null}
            {aiTextNote ? (
              <p className="mt-2 flex items-start gap-1.5 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">
                <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-navy-500" />
                {aiTextNote} Always review text before submitting.
              </p>
            ) : null}
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="mb-4 text-sm font-semibold text-slate-800">2. Photo evidence</h2>
          <ImageUpload file={file} onFile={setFile} />
          <div className="mt-3">
            <button
              type="button"
              onClick={suggestFromImage}
              disabled={aiCategoryBusy}
              className="inline-flex items-center gap-1.5 rounded-md border border-navy-200 bg-navy-50 px-2.5 py-1.5 text-xs font-semibold text-navy-700 hover:bg-navy-100 disabled:opacity-60"
            >
              {aiCategoryBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
              Suggest category from photo
            </button>
            {aiCategoryNote ? (
              <p className="mt-2 flex items-start gap-1.5 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">
                <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-navy-500" />
                {aiCategoryNote}
              </p>
            ) : null}
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="mb-1 text-sm font-semibold text-slate-800">3. Location</h2>
          <p className="mb-4 text-xs text-slate-500">
            Use your current GPS location, or select the exact spot on the map. Location is optional but helps
            authorities find the issue faster.
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={useMyLocation}
              disabled={geoLoading}
              className="inline-flex items-center gap-2 rounded-lg bg-navy-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-navy-800 disabled:opacity-60"
            >
              {geoLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Crosshair className="h-4 w-4" />}
              Use my current location
            </button>
            <span className="text-sm text-slate-500">
              {coords ? formatCoords(coords.lat, coords.lng) : 'No location selected yet'}
            </span>
            {coords ? (
              <button
                type="button"
                onClick={() => setCoords(null)}
                className="text-xs font-semibold text-rose-600 hover:text-rose-800"
              >
                Clear
              </button>
            ) : null}
          </div>
          {geoError ? (
            <p className="mt-2 flex items-start gap-1.5 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
              <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {geoError}
            </p>
          ) : null}

          <div className="mt-4">
            <MapPicker value={coords} onChange={(value) => setCoords(value)} />
          </div>

          <div className="mt-4">
            <label htmlFor="address" className="mb-1.5 block text-sm font-medium text-slate-700">
              Address or landmark <span className="text-slate-400">(optional)</span>
            </label>
            <input
              id="address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              maxLength={200}
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-navy-600 focus:ring-2 focus:ring-navy-100"
              placeholder="e.g. Opposite the city market, 2nd cross road"
            />
          </div>
        </section>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-2 rounded-lg bg-accent-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-accent-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
            {submitting ? 'Submitting…' : 'Submit report'}
          </button>
          <Link to="/dashboard" className="text-sm font-semibold text-slate-500 hover:text-slate-700">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
