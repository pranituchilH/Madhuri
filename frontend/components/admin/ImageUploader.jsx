'use client';

import { useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, ImagePlus, X } from 'lucide-react';
import { api, img } from '@/lib/api';
import { useToast } from '@/context/ToastContext';
import Spinner from '@/components/ui/Spinner';

/** Uploads files to /admin/uploads and returns the stored URLs. */
export async function uploadImages(files) {
  const fd = new FormData();
  for (const f of files) fd.append('images', f);
  const { urls } = await api('/admin/uploads', { method: 'POST', body: fd });
  return urls || [];
}

/**
 * Manages an ordered list of image URLs. The first image is the main one.
 * `multiple={false}` turns it into a single-image picker.
 */
export default function ImageUploader({ value = [], onChange, multiple = true }) {
  const toast = useToast();
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  async function handleFiles(fileList) {
    const files = [...(fileList || [])].filter((f) => f.type.startsWith('image/'));
    if (!files.length) return;
    setUploading(true);
    try {
      const urls = await uploadImages(multiple ? files : files.slice(0, 1));
      onChange(multiple ? [...value, ...urls] : urls.slice(0, 1));
      toast(`${urls.length} image${urls.length === 1 ? '' : 's'} uploaded`);
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  function move(i, dir) {
    const j = i + dir;
    if (j < 0 || j >= value.length) return;
    const next = [...value];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  }

  const remove = (i) => onChange(value.filter((_, k) => k !== i));
  const canAdd = multiple || value.length === 0;

  return (
    <div>
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-5">
        {value.map((url, i) => (
          <div key={`${url}-${i}`} className="group relative aspect-[3/4] overflow-hidden rounded-xl border border-gold-100 bg-cream">
            <img src={img(url)} alt="" className="h-full w-full object-cover" />
            {multiple && i === 0 && (
              <span className="absolute left-1.5 top-1.5 rounded-full bg-maroon-700 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-cream">Main</span>
            )}
            <button
              type="button"
              onClick={() => remove(i)}
              className="absolute right-1.5 top-1.5 rounded-full bg-white/90 p-1 text-rose-600 shadow hover:bg-white"
              aria-label="Remove image"
            >
              <X className="h-3.5 w-3.5" />
            </button>
            {multiple && value.length > 1 && (
              <div className="absolute inset-x-1.5 bottom-1.5 flex justify-between">
                <button
                  type="button"
                  onClick={() => move(i, -1)}
                  disabled={i === 0}
                  className="rounded-full bg-white/90 p-1 text-maroon-700 shadow hover:bg-white disabled:invisible"
                  aria-label="Move left"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => move(i, 1)}
                  disabled={i === value.length - 1}
                  className="rounded-full bg-white/90 p-1 text-maroon-700 shadow hover:bg-white disabled:invisible"
                  aria-label="Move right"
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </div>
        ))}

        {canAdd && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              handleFiles(e.dataTransfer.files);
            }}
            disabled={uploading}
            className={`flex aspect-[3/4] flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed text-xs transition ${
              dragOver ? 'border-maroon-500 bg-maroon-50 text-maroon-700' : 'border-gold-200 bg-cream-light text-ink-muted hover:border-maroon-300 hover:text-maroon-700'
            }`}
          >
            {uploading ? <Spinner className="h-5 w-5" /> : <ImagePlus className="h-6 w-6" />}
            {uploading ? 'Uploading…' : multiple ? 'Add images' : 'Upload image'}
          </button>
        )}
      </div>
      <input ref={inputRef} type="file" accept="image/*" multiple={multiple} hidden onChange={(e) => handleFiles(e.target.files)} />
      {multiple && <p className="mt-2 text-xs text-ink-muted">The first image is the main image. Use the arrows to reorder; drag & drop works too.</p>}
    </div>
  );
}
