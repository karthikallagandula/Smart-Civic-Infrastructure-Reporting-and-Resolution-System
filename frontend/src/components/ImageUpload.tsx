import { useEffect, useRef, useState } from 'react';
import { Camera, ImageOff, Upload, X } from 'lucide-react';

const MAX_BYTES = 5 * 1024 * 1024;
const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

export function ImageUpload({
  file,
  onFile,
  error,
  existingUrl,
  label = 'Photo of the issue',
}: {
  file: File | null;
  onFile: (file: File | null) => void;
  error?: string | null;
  existingUrl?: string | null;
  label?: string;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (!file) {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const handleFiles = (files: FileList | null) => {
    setLocalError(null);
    const picked = files?.[0];
    if (!picked) return;
    if (!ACCEPTED.includes(picked.type)) {
      setLocalError('Only JPEG, PNG, WebP or GIF images are accepted.');
      return;
    }
    if (picked.size > MAX_BYTES) {
      setLocalError('Image must be 5 MB or smaller.');
      return;
    }
    onFile(picked);
  };

  const shown = preview || existingUrl;
  const message = localError || error;

  return (
    <div>
      <span className="mb-1.5 block text-sm font-medium text-slate-700">{label}</span>
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          handleFiles(e.dataTransfer.files);
        }}
        className="flex cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center transition hover:border-navy-500 hover:bg-navy-50/50"
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click();
        }}
      >
        {shown ? (
          <img src={shown} alt="Selected" className="max-h-56 w-auto rounded-md object-contain" />
        ) : (
          <>
            <Upload className="h-6 w-6 text-navy-600" />
            <p className="text-sm font-medium text-slate-700">Click to upload or drag an image here</p>
            <p className="text-xs text-slate-400">JPEG, PNG, WebP · up to 5 MB</p>
          </>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>
      <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="inline-flex items-center gap-1 font-medium text-navy-700 hover:text-navy-900"
        >
          {shown ? <Camera className="h-3.5 w-3.5" /> : <Upload className="h-3.5 w-3.5" />}
          {shown ? 'Replace photo' : 'Choose photo'}
        </button>
        {file ? (
          <button
            type="button"
            onClick={() => onFile(null)}
            className="inline-flex items-center gap-1 font-medium text-rose-600 hover:text-rose-800"
          >
            <X className="h-3.5 w-3.5" /> Remove
          </button>
        ) : null}
        {!file && existingUrl ? (
          <span className="inline-flex items-center gap-1 text-slate-400">
            <ImageOff className="h-3.5 w-3.5" /> Existing photo shown
          </span>
        ) : null}
      </div>
      {message ? <p className="mt-1.5 text-sm text-rose-600">{message}</p> : null}
    </div>
  );
}
