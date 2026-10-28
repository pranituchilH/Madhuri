'use client';

import { useCallback, useEffect, useState } from 'react';
import { FolderTree, Pencil, Plus, Save, Trash } from 'lucide-react';
import { api, img } from '@/lib/api';
import { useToast } from '@/context/ToastContext';
import Spinner from '@/components/ui/Spinner';
import Modal from '@/components/admin/Modal';
import ImageUploader from '@/components/admin/ImageUploader';
import { EmptyState, Field, IconButton, LoadingBlock, PageHeader, Pill, Table, Toggle, ToggleField } from '@/components/admin/ui';

const EMPTY = { name: '', slug: '', description: '', image: '', sort_order: 0, is_active: true };

export default function CategoriesPage() {
  const toast = useToast();
  const [categories, setCategories] = useState(null);
  const [editing, setEditing] = useState(null); // null | { id?, ...fields }
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(
    () =>
      api('/admin/categories')
        .then((d) => setCategories(d.categories))
        .catch((err) => {
          toast(err.message, 'error');
          setCategories([]);
        }),
    [toast],
  );

  useEffect(() => {
    load();
  }, [load]);

  const openNew = () => setEditing({ ...EMPTY, sort_order: (categories?.length || 0) + 1 });
  const openEdit = (c) =>
    setEditing({
      id: c.id,
      name: c.name,
      slug: c.slug,
      description: c.description || '',
      image: c.image || '',
      sort_order: c.sort_order,
      is_active: !!c.is_active,
    });
  const close = useCallback(() => setEditing(null), []);
  const setField = (k, v) => setEditing((e) => ({ ...e, [k]: v }));

  async function save(e) {
    e?.preventDefault();
    if (!editing.name.trim()) {
      toast('Category name is required', 'error');
      return;
    }
    setSaving(true);
    const { id, ...body } = editing;
    body.name = body.name.trim();
    try {
      await api(id ? `/admin/categories/${id}` : '/admin/categories', { method: id ? 'PUT' : 'POST', body });
      toast(id ? 'Category updated' : 'Category created');
      setEditing(null);
      await load();
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(c) {
    setBusyId(c.id);
    try {
      await api(`/admin/categories/${c.id}`, { method: 'PUT', body: { is_active: !c.is_active } });
      setCategories((list) => list.map((x) => (x.id === c.id ? { ...x, is_active: c.is_active ? 0 : 1 } : x)));
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setBusyId(null);
    }
  }

  async function remove(c) {
    const warn = Number(c.product_count) > 0 ? `\n\n${c.product_count} product(s) in this category will become uncategorised.` : '';
    if (!window.confirm(`Delete the "${c.name}" category?${warn}`)) return;
    setBusyId(c.id);
    try {
      await api(`/admin/categories/${c.id}`, { method: 'DELETE' });
      toast('Category deleted');
      await load();
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <>
      <PageHeader title="Categories" description="Organise sarees into collections shown in the store">
        <button className="btn-primary btn-sm" onClick={openNew}>
          <Plus className="h-4 w-4" /> Add category
        </button>
      </PageHeader>

      <div className="card overflow-hidden">
        {!categories ? (
          <LoadingBlock />
        ) : categories.length === 0 ? (
          <EmptyState icon={FolderTree} title="No categories yet">
            <button className="text-maroon-700 underline" onClick={openNew}>
              Create your first category
            </button>
          </EmptyState>
        ) : (
          <Table head={['Category', 'Slug', 'Products', 'Order', 'Active', { label: 'Actions', className: 'text-right' }]}>
            {categories.map((c) => (
              <tr key={c.id} className="transition hover:bg-cream/50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <img src={img(c.image)} alt="" className="h-12 w-12 shrink-0 rounded-lg bg-cream object-cover" />
                    <div className="min-w-0">
                      <p className="font-medium text-ink">{c.name}</p>
                      {c.description && <p className="line-clamp-1 max-w-xs text-xs text-ink-muted">{c.description}</p>}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 font-mono text-xs text-ink-soft">{c.slug}</td>
                <td className="px-4 py-3">
                  <Pill tone={Number(c.product_count) ? 'maroon' : 'slate'}>{c.product_count}</Pill>
                </td>
                <td className="px-4 py-3 text-ink-soft">{c.sort_order}</td>
                <td className="px-4 py-3">
                  <Toggle checked={!!c.is_active} disabled={busyId === c.id} onChange={() => toggleActive(c)} label="Active" />
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-1">
                    <IconButton icon={Pencil} label="Edit" onClick={() => openEdit(c)} />
                    <IconButton icon={Trash} label="Delete" tone="danger" disabled={busyId === c.id} onClick={() => remove(c)} />
                  </div>
                </td>
              </tr>
            ))}
          </Table>
        )}
      </div>

      <Modal
        open={!!editing}
        onClose={close}
        title={editing?.id ? 'Edit category' : 'New category'}
        footer={
          <>
            <button className="btn-ghost btn-sm" onClick={close}>
              Cancel
            </button>
            <button className="btn-primary btn-sm" onClick={save} disabled={saving}>
              {saving ? <Spinner className="h-4 w-4" /> : <Save className="h-4 w-4" />}
              Save
            </button>
          </>
        }
      >
        {editing && (
          <form onSubmit={save} className="space-y-4">
            <Field label="Name *">
              <input className="input" autoFocus value={editing.name} onChange={(e) => setField('name', e.target.value)} placeholder="Banarasi Silk" />
            </Field>
            <Field label="Slug" hint="Leave empty to generate from the name">
              <input className="input" value={editing.slug} onChange={(e) => setField('slug', e.target.value)} placeholder="banarasi-silk" />
            </Field>
            <Field label="Description">
              <textarea className="input min-h-[90px]" value={editing.description} onChange={(e) => setField('description', e.target.value)} />
            </Field>
            <Field label="Image">
              <div className="max-w-[160px]">
                <ImageUploader multiple={false} value={editing.image ? [editing.image] : []} onChange={(urls) => setField('image', urls[0] || '')} />
              </div>
              <input
                className="input mt-3"
                value={editing.image}
                onChange={(e) => setField('image', e.target.value)}
                placeholder="…or paste an image URL / path (e.g. /brand/cat-banarasi.jpg)"
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Sort order">
                <input type="number" className="input" value={editing.sort_order} onChange={(e) => setField('sort_order', e.target.value)} />
              </Field>
              <div className="sm:pt-6">
                <ToggleField label="Active" checked={editing.is_active} onChange={(v) => setField('is_active', v)} />
              </div>
            </div>
            <button type="submit" hidden />
          </form>
        )}
      </Modal>
    </>
  );
}
