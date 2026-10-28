'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ExternalLink, Save, Trash } from 'lucide-react';
import { api } from '@/lib/api';
import { discountPct, inr } from '@/lib/format';
import { useToast } from '@/context/ToastContext';
import Spinner from '@/components/ui/Spinner';
import ImageUploader from './ImageUploader';
import { EmptyState, Field, LoadingBlock, ToggleField } from './ui';

const slugify = (s) =>
  String(s || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const EMPTY = {
  name: '',
  slug: '',
  sku: '',
  category_id: '',
  price: '',
  mrp: '',
  stock: '0',
  color: '',
  color_hex: '#741331',
  fabric: '',
  occasion: '',
  work: '',
  saree_length: '5.5 m',
  blouse: 'Unstitched blouse piece (0.8 m)',
  wash_care: 'Dry clean only',
  short_description: '',
  description: '',
  is_active: true,
  is_featured: false,
  is_new: true,
};

const TEXT_FIELDS = ['name', 'slug', 'sku', 'color', 'color_hex', 'fabric', 'occasion', 'work', 'saree_length', 'blouse', 'wash_care', 'short_description', 'description'];

function fromProduct(p) {
  const f = { ...EMPTY };
  for (const k of TEXT_FIELDS) f[k] = p[k] ?? '';
  if (!f.color_hex) f.color_hex = '#741331';
  f.category_id = p.category_id ? String(p.category_id) : '';
  f.price = p.price != null ? String(Number(p.price)) : '';
  f.mrp = p.mrp != null ? String(Number(p.mrp)) : '';
  f.stock = String(p.stock ?? 0);
  f.is_active = !!p.is_active;
  f.is_featured = !!p.is_featured;
  f.is_new = !!p.is_new;
  return f;
}

function Section({ title, description, children }) {
  return (
    <section className="card p-5 sm:p-6">
      <div className="mb-5">
        <h2 className="font-display text-xl font-semibold text-maroon-900">{title}</h2>
        {description && <p className="text-xs text-ink-muted">{description}</p>}
      </div>
      {children}
    </section>
  );
}

export default function ProductForm({ productId }) {
  const router = useRouter();
  const toast = useToast();
  const isEdit = !!productId;
  const [form, setForm] = useState(EMPTY);
  const [images, setImages] = useState([]);
  const [categories, setCategories] = useState([]);
  const [slugTouched, setSlugTouched] = useState(false);
  const [loading, setLoading] = useState(isEdit);
  const [loadError, setLoadError] = useState('');
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    api('/admin/categories')
      .then((d) => setCategories(d.categories))
      .catch((err) => toast(err.message, 'error'));
  }, [toast]);

  useEffect(() => {
    if (!isEdit) return;
    api(`/admin/products/${productId}`)
      .then(({ product }) => {
        setForm(fromProduct(product));
        setImages(product.images.map((i) => i.url));
        setSlugTouched(true);
      })
      .catch((err) => setLoadError(err.message))
      .finally(() => setLoading(false));
  }, [isEdit, productId]);

  const set = (k) => (e) => {
    const v = e?.target ? (e.target.type === 'checkbox' ? e.target.checked : e.target.value) : e;
    setForm((f) => {
      const next = { ...f, [k]: v };
      if (k === 'name' && !slugTouched) next.slug = slugify(v);
      return next;
    });
    if (errors[k]) setErrors((x) => ({ ...x, [k]: undefined }));
  };

  function validate() {
    const e = {};
    if (!form.name.trim()) e.name = 'Name is required';
    if (!form.sku.trim()) e.sku = 'SKU is required';
    if (!(Number(form.price) > 0)) e.price = 'Enter a price greater than 0';
    if (form.mrp !== '' && Number(form.mrp) < Number(form.price)) e.mrp = 'MRP should be at least the selling price';
    if (form.stock === '' || Number(form.stock) < 0 || !Number.isInteger(Number(form.stock))) e.stock = 'Enter a whole number (0 or more)';
    if (form.color_hex && !/^#[0-9a-fA-F]{6}$/.test(form.color_hex)) e.color_hex = 'Use a hex colour like #741331';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function submit(e) {
    e.preventDefault();
    if (!validate()) {
      toast('Please fix the highlighted fields', 'error');
      return;
    }
    setSaving(true);
    const body = {
      ...form,
      name: form.name.trim(),
      sku: form.sku.trim(),
      slug: slugify(form.slug || form.name),
      category_id: form.category_id || null,
      price: Number(form.price),
      mrp: form.mrp === '' ? null : Number(form.mrp),
      stock: Number(form.stock),
      images,
    };
    try {
      if (isEdit) {
        await api(`/admin/products/${productId}`, { method: 'PUT', body });
        toast('Product saved');
      } else {
        await api('/admin/products', { method: 'POST', body });
        toast('Product created');
        router.push('/admin/products');
      }
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!window.confirm(`Delete "${form.name}"? This cannot be undone.`)) return;
    try {
      await api(`/admin/products/${productId}`, { method: 'DELETE' });
      toast('Product deleted');
      router.push('/admin/products');
    } catch (err) {
      toast(err.message, 'error');
    }
  }

  if (loading) return <LoadingBlock />;
  if (loadError) {
    return (
      <div className="card">
        <EmptyState title="Product not available">
          {loadError}{' '}
          <Link href="/admin/products" className="text-maroon-700 underline">
            Back to products
          </Link>
        </EmptyState>
      </div>
    );
  }

  const off = discountPct(Number(form.price), Number(form.mrp));
  const err = (k) => errors[k] && <p className="mt-1 text-xs text-rose-600">{errors[k]}</p>;
  const cls = (k) => `input ${errors[k] ? '!border-rose-400 focus:!ring-rose-100' : ''}`;

  return (
    <form onSubmit={submit} noValidate>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Link href="/admin/products" className="mb-2 inline-flex items-center gap-1 text-xs font-medium text-ink-muted hover:text-maroon-700">
            <ArrowLeft className="h-3.5 w-3.5" /> All products
          </Link>
          <h1 className="font-display text-3xl font-semibold text-maroon-900">{isEdit ? 'Edit product' : 'New product'}</h1>
          {isEdit && <p className="mt-1 text-sm text-ink-soft">{form.name}</p>}
        </div>
        <div className="flex flex-wrap gap-2">
          {isEdit && (
            <>
              <a href={`/product/${form.slug}`} target="_blank" rel="noreferrer" className="btn-ghost btn-sm">
                <ExternalLink className="h-4 w-4" /> View
              </a>
              <button type="button" onClick={remove} className="btn btn-sm text-rose-600 hover:bg-rose-50">
                <Trash className="h-4 w-4" /> Delete
              </button>
            </>
          )}
          <button type="submit" className="btn-primary btn-sm" disabled={saving}>
            {saving ? <Spinner className="h-4 w-4" /> : <Save className="h-4 w-4" />}
            {isEdit ? 'Save changes' : 'Create product'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Section title="Basics">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Name *" className="sm:col-span-2">
                <input className={cls('name')} value={form.name} onChange={set('name')} placeholder="e.g. Crimson Kadhua Banarasi Silk Saree" />
                {err('name')}
              </Field>
              <Field label="Slug" hint={`URL: /product/${slugify(form.slug || form.name) || '…'}`}>
                <input
                  className="input"
                  value={form.slug}
                  onChange={(e) => {
                    setSlugTouched(e.target.value !== '');
                    set('slug')(e);
                  }}
                  placeholder="auto-generated from name"
                />
              </Field>
              <Field label="SKU *">
                <input className={cls('sku')} value={form.sku} onChange={set('sku')} placeholder="MS-BNR-001" />
                {err('sku')}
              </Field>
              <Field label="Category" className="sm:col-span-2">
                <select className="input" value={form.category_id} onChange={set('category_id')}>
                  <option value="">— No category —</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                      {c.is_active ? '' : ' (inactive)'}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Short description" className="sm:col-span-2" hint={`${form.short_description.length}/300`}>
                <input className="input" maxLength={300} value={form.short_description} onChange={set('short_description')} placeholder="One line shown on product cards" />
              </Field>
              <Field label="Description" className="sm:col-span-2">
                <textarea className="input min-h-[160px]" value={form.description} onChange={set('description')} placeholder="Tell the story of this saree…" />
              </Field>
            </div>
          </Section>

          <Section title="Images" description="Upload high-quality portrait images (3:4 works best).">
            <ImageUploader value={images} onChange={setImages} />
          </Section>

          <Section title="Saree details">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Fabric">
                <input className="input" value={form.fabric} onChange={set('fabric')} placeholder="Pure Katan Silk" />
              </Field>
              <Field label="Occasion">
                <input className="input" value={form.occasion} onChange={set('occasion')} placeholder="Wedding, Festive" />
              </Field>
              <Field label="Work">
                <input className="input" value={form.work} onChange={set('work')} placeholder="Zari weaving" />
              </Field>
              <Field label="Saree length">
                <input className="input" value={form.saree_length} onChange={set('saree_length')} />
              </Field>
              <Field label="Blouse">
                <input className="input" value={form.blouse} onChange={set('blouse')} />
              </Field>
              <Field label="Wash care">
                <input className="input" value={form.wash_care} onChange={set('wash_care')} />
              </Field>
              <Field label="Colour name">
                <input className="input" value={form.color} onChange={set('color')} placeholder="Crimson Red" />
              </Field>
              <Field label="Colour swatch">
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={/^#[0-9a-fA-F]{6}$/.test(form.color_hex) ? form.color_hex : '#741331'}
                    onChange={set('color_hex')}
                    className="h-[46px] w-14 shrink-0 cursor-pointer rounded-xl border border-gold-200 bg-white p-1"
                    aria-label="Pick colour"
                  />
                  <input className={cls('color_hex')} value={form.color_hex} onChange={set('color_hex')} placeholder="#741331" />
                </div>
                {err('color_hex')}
              </Field>
            </div>
          </Section>
        </div>

        <div className="space-y-6">
          <Section title="Pricing & stock">
            <div className="space-y-4">
              <Field label="Selling price (₹) *">
                <input type="number" min="0" step="1" className={cls('price')} value={form.price} onChange={set('price')} />
                {err('price')}
              </Field>
              <Field label="MRP (₹)" hint="Leave empty if there is no discount">
                <input type="number" min="0" step="1" className={cls('mrp')} value={form.mrp} onChange={set('mrp')} />
                {err('mrp')}
              </Field>
              {Number(form.price) > 0 && (
                <div className="rounded-xl bg-cream px-4 py-3 text-sm">
                  <span className="font-semibold text-maroon-900">{inr(form.price)}</span>
                  {off > 0 && (
                    <>
                      <span className="ml-2 text-ink-muted line-through">{inr(form.mrp)}</span>
                      <span className="ml-2 font-medium text-emerald-700">{off}% off</span>
                    </>
                  )}
                </div>
              )}
              <Field label="Stock *">
                <input type="number" min="0" step="1" className={cls('stock')} value={form.stock} onChange={set('stock')} />
                {err('stock')}
                {!errors.stock && Number(form.stock) <= 5 && <p className="mt-1 text-xs text-amber-600">Low stock</p>}
              </Field>
            </div>
          </Section>

          <Section title="Visibility">
            <div className="space-y-3">
              <ToggleField label="Active" hint="Visible in the store" checked={form.is_active} onChange={set('is_active')} />
              <ToggleField label="Featured" hint="Show on the home page" checked={form.is_featured} onChange={set('is_featured')} />
              <ToggleField label="New arrival" hint="Adds a “New” badge" checked={form.is_new} onChange={set('is_new')} />
            </div>
          </Section>
        </div>
      </div>

      {/* Sticky save bar so the long form can be submitted without scrolling back up on small screens */}
      <div className="sticky bottom-0 z-10 -mx-4 mt-6 border-t border-gold-200 bg-cream-light/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 lg:hidden">
        <button type="submit" className="btn-primary w-full" disabled={saving}>
          {saving ? <Spinner className="h-4 w-4" /> : <Save className="h-4 w-4" />}
          {isEdit ? 'Save changes' : 'Create product'}
        </button>
      </div>
    </form>
  );
}
