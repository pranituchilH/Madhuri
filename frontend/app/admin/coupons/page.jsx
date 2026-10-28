'use client';

import { useCallback, useEffect, useState } from 'react';
import { Pencil, Plus, Save, Ticket, Trash } from 'lucide-react';
import { api } from '@/lib/api';
import { dateTime, inr } from '@/lib/format';
import { useToast } from '@/context/ToastContext';
import Spinner from '@/components/ui/Spinner';
import Modal from '@/components/admin/Modal';
import { EmptyState, Field, fromLocalInput, IconButton, LoadingBlock, PageHeader, Pill, Table, Toggle, ToggleField, toLocalInput } from '@/components/admin/ui';

const EMPTY = { code: '', description: '', type: 'percent', value: '', min_order: '0', max_discount: '', usage_limit: '', expires_at: '', is_active: true };

const num = (v) => (v == null ? '' : String(Number(v)));

function describe(c) {
  const v = c.type === 'percent' ? `${Number(c.value)}% off` : `${inr(c.value)} off`;
  const extra = [];
  if (Number(c.min_order) > 0) extra.push(`min ${inr(c.min_order)}`);
  if (c.type === 'percent' && c.max_discount != null) extra.push(`up to ${inr(c.max_discount)}`);
  return { v, extra: extra.join(' · ') };
}

export default function CouponsPage() {
  const toast = useToast();
  const [coupons, setCoupons] = useState(null);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(
    () =>
      api('/admin/coupons')
        .then((d) => setCoupons(d.coupons))
        .catch((err) => {
          toast(err.message, 'error');
          setCoupons([]);
        }),
    [toast],
  );

  useEffect(() => {
    load();
  }, [load]);

  const close = useCallback(() => setEditing(null), []);
  const setField = (k, v) => setEditing((e) => ({ ...e, [k]: v }));
  const openEdit = (c) =>
    setEditing({
      id: c.id,
      code: c.code,
      description: c.description || '',
      type: c.type,
      value: num(c.value),
      min_order: num(c.min_order),
      max_discount: num(c.max_discount),
      usage_limit: c.usage_limit == null ? '' : String(c.usage_limit),
      expires_at: toLocalInput(c.expires_at),
      is_active: !!c.is_active,
    });

  async function save(e) {
    e?.preventDefault();
    const { id, ...f } = editing;
    if (!f.code.trim()) return toast('Coupon code is required', 'error');
    if (!(Number(f.value) > 0)) return toast('Enter a discount value greater than 0', 'error');
    if (f.type === 'percent' && Number(f.value) > 100) return toast('A percentage cannot exceed 100', 'error');
    setSaving(true);
    const body = {
      ...f,
      code: f.code.trim().toUpperCase(),
      value: Number(f.value),
      min_order: Number(f.min_order) || 0,
      max_discount: f.type === 'percent' && f.max_discount !== '' ? Number(f.max_discount) : '',
      usage_limit: f.usage_limit === '' ? '' : Math.max(0, parseInt(f.usage_limit, 10) || 0),
      expires_at: fromLocalInput(f.expires_at),
    };
    try {
      await api(id ? `/admin/coupons/${id}` : '/admin/coupons', { method: id ? 'PUT' : 'POST', body });
      toast(id ? 'Coupon updated' : 'Coupon created');
      setEditing(null);
      await load();
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setSaving(false);
    }
    return undefined;
  }

  async function toggleActive(c) {
    setBusyId(c.id);
    try {
      await api(`/admin/coupons/${c.id}`, { method: 'PUT', body: { is_active: !c.is_active } });
      setCoupons((list) => list.map((x) => (x.id === c.id ? { ...x, is_active: c.is_active ? 0 : 1 } : x)));
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setBusyId(null);
    }
  }

  async function remove(c) {
    if (!window.confirm(`Delete coupon ${c.code}?`)) return;
    setBusyId(c.id);
    try {
      await api(`/admin/coupons/${c.id}`, { method: 'DELETE' });
      toast('Coupon deleted');
      await load();
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setBusyId(null);
    }
  }

  const now = Date.now();

  return (
    <>
      <PageHeader title="Coupons" description="Discount codes customers can apply at checkout">
        <button className="btn-primary btn-sm" onClick={() => setEditing({ ...EMPTY })}>
          <Plus className="h-4 w-4" /> Add coupon
        </button>
      </PageHeader>

      <div className="card overflow-hidden">
        {!coupons ? (
          <LoadingBlock />
        ) : coupons.length === 0 ? (
          <EmptyState icon={Ticket} title="No coupons yet">
            Create a code like <span className="font-mono">WELCOME10</span> to reward new shoppers.
          </EmptyState>
        ) : (
          <Table head={['Code', 'Discount', 'Usage', 'Expires', 'Active', { label: 'Actions', className: 'text-right' }]}>
            {coupons.map((c) => {
              const { v, extra } = describe(c);
              const expired = c.expires_at && new Date(c.expires_at).getTime() < now;
              const exhausted = c.usage_limit != null && c.used_count >= c.usage_limit;
              return (
                <tr key={c.id} className="transition hover:bg-cream/50">
                  <td className="px-4 py-3">
                    <p className="font-mono font-semibold tracking-wider text-maroon-700">{c.code}</p>
                    {c.description && <p className="line-clamp-1 max-w-xs text-xs text-ink-muted">{c.description}</p>}
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-ink">{v}</p>
                    {extra && <p className="text-xs text-ink-muted">{extra}</p>}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <span className="text-ink">{c.used_count}</span>
                    <span className="text-ink-muted"> / {c.usage_limit ?? '∞'}</span>
                    {exhausted && (
                      <span className="ml-2">
                        <Pill tone="red">Used up</Pill>
                      </span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-xs">
                    {c.expires_at ? (
                      <span className={expired ? 'text-rose-600' : 'text-ink-soft'}>
                        {dateTime(c.expires_at)}
                        {expired && ' (expired)'}
                      </span>
                    ) : (
                      <span className="text-ink-muted">Never</span>
                    )}
                  </td>
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
              );
            })}
          </Table>
        )}
      </div>

      <Modal
        open={!!editing}
        onClose={close}
        title={editing?.id ? 'Edit coupon' : 'New coupon'}
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
          <form onSubmit={save} className="grid gap-4 sm:grid-cols-2">
            <Field label="Code *">
              <input
                className="input font-mono uppercase tracking-wider"
                autoFocus
                value={editing.code}
                onChange={(e) => setField('code', e.target.value.toUpperCase().replace(/\s/g, ''))}
                placeholder="FESTIVE15"
              />
            </Field>
            <Field label="Type">
              <select className="input" value={editing.type} onChange={(e) => setField('type', e.target.value)}>
                <option value="percent">Percentage (%)</option>
                <option value="flat">Flat amount (₹)</option>
              </select>
            </Field>
            <Field label="Description" className="sm:col-span-2">
              <input className="input" value={editing.description} onChange={(e) => setField('description', e.target.value)} placeholder="15% off on festive collection" />
            </Field>
            <Field label={editing.type === 'percent' ? 'Discount (%) *' : 'Discount (₹) *'}>
              <input type="number" min="0" className="input" value={editing.value} onChange={(e) => setField('value', e.target.value)} />
            </Field>
            <Field label="Minimum order (₹)">
              <input type="number" min="0" className="input" value={editing.min_order} onChange={(e) => setField('min_order', e.target.value)} />
            </Field>
            {editing.type === 'percent' && (
              <Field label="Max discount (₹)" hint="Leave empty for no cap">
                <input type="number" min="0" className="input" value={editing.max_discount} onChange={(e) => setField('max_discount', e.target.value)} />
              </Field>
            )}
            <Field label="Usage limit" hint="Leave empty for unlimited">
              <input type="number" min="0" step="1" className="input" value={editing.usage_limit} onChange={(e) => setField('usage_limit', e.target.value)} />
            </Field>
            <Field label="Expires at" hint="Leave empty to never expire">
              <input type="datetime-local" className="input" value={editing.expires_at} onChange={(e) => setField('expires_at', e.target.value)} />
            </Field>
            <div className="sm:col-span-2">
              <ToggleField label="Active" hint="Customers can apply this code" checked={editing.is_active} onChange={(v) => setField('is_active', v)} />
            </div>
            <button type="submit" hidden />
          </form>
        )}
      </Modal>
    </>
  );
}
