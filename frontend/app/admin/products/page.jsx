'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ExternalLink, Package, Pencil, Plus, Trash } from 'lucide-react';
import { api, img } from '@/lib/api';
import { inr } from '@/lib/format';
import { useToast } from '@/context/ToastContext';
import useListQuery from '@/components/admin/useListQuery';
import { EmptyState, IconButton, LoadingBlock, PageHeader, Pagination, Pill, SearchInput, Select, Table, Toggle } from '@/components/admin/ui';

const STATUS_OPTIONS = [
  { value: '', label: 'All products' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'low', label: 'Low stock (≤ 5)' },
];

function ProductsList() {
  const router = useRouter();
  const toast = useToast();
  const { params, set, qs } = useListQuery(['q', 'status', 'category']);
  const [data, setData] = useState(null);
  const [categories, setCategories] = useState([]);
  const [busyId, setBusyId] = useState(null);

  useEffect(() => {
    api('/admin/categories')
      .then((d) => setCategories(d.categories))
      .catch(() => {});
  }, []);

  const load = useCallback(() => {
    return api(`/admin/products?${qs}`)
      .then(setData)
      .catch((err) => {
        toast(err.message, 'error');
        setData({ products: [], total: 0, page: 1, pages: 0 });
      });
  }, [qs, toast]);

  useEffect(() => {
    setData(null);
    load();
  }, [load]);

  async function toggleActive(p) {
    setBusyId(p.id);
    try {
      await api(`/admin/products/${p.id}`, { method: 'PUT', body: { is_active: !p.is_active } });
      setData((d) => ({ ...d, products: d.products.map((x) => (x.id === p.id ? { ...x, is_active: p.is_active ? 0 : 1 } : x)) }));
      toast(p.is_active ? 'Product hidden from store' : 'Product is now live');
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setBusyId(null);
    }
  }

  async function remove(p) {
    if (!window.confirm(`Delete "${p.name}"? This cannot be undone.`)) return;
    setBusyId(p.id);
    try {
      await api(`/admin/products/${p.id}`, { method: 'DELETE' });
      toast('Product deleted');
      await load();
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setBusyId(null);
    }
  }

  const categoryOptions = [{ value: '', label: 'All categories' }, ...categories.map((c) => ({ value: String(c.id), label: c.name }))];

  return (
    <>
      <PageHeader title="Products" description="Manage your saree catalogue">
        <Link href="/admin/products/new" className="btn-primary btn-sm">
          <Plus className="h-4 w-4" /> Add product
        </Link>
      </PageHeader>

      <div className="card overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-gold-100 p-4 md:flex-row md:items-center">
          <SearchInput className="md:flex-1" value={params.q} onChange={(q) => set({ q })} placeholder="Search name, SKU or colour" />
          <div className="flex gap-2">
            <Select value={params.status} onChange={(status) => set({ status })} options={STATUS_OPTIONS} />
            <Select value={params.category} onChange={(category) => set({ category })} options={categoryOptions} />
          </div>
        </div>

        {!data ? (
          <LoadingBlock />
        ) : data.products.length === 0 ? (
          <EmptyState icon={Package} title="No products found">
            {params.q || params.status || params.category ? (
              'Try changing the filters.'
            ) : (
              <Link href="/admin/products/new" className="text-maroon-700 underline">
                Add your first product
              </Link>
            )}
          </EmptyState>
        ) : (
          <>
            <Table head={['Product', 'Category', 'Price', 'Stock', 'Tags', 'Active', { label: 'Actions', className: 'text-right' }]}>
              {data.products.map((p) => (
                <tr key={p.id} onClick={() => router.push(`/admin/products/${p.id}`)} className="cursor-pointer transition hover:bg-cream/50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <img src={img(p.image)} alt="" className="h-14 w-11 shrink-0 rounded-md bg-cream object-cover" />
                      <div className="min-w-0">
                        <p className="line-clamp-1 font-medium text-ink">{p.name}</p>
                        <p className="text-xs text-ink-muted">
                          {p.sku}
                          {p.color ? ` · ${p.color}` : ''}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-ink-soft">{p.category_name || '—'}</td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <p className="font-medium">{inr(p.price)}</p>
                    {p.mrp && Number(p.mrp) > Number(p.price) && <p className="text-xs text-ink-muted line-through">{inr(p.mrp)}</p>}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`font-semibold ${p.stock <= 5 ? 'text-rose-600' : 'text-ink'}`}>{p.stock}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {p.is_featured ? <Pill tone="gold">Featured</Pill> : null}
                      {p.is_new ? <Pill tone="teal">New</Pill> : null}
                      {!p.is_active ? <Pill>Hidden</Pill> : null}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Toggle checked={!!p.is_active} disabled={busyId === p.id} onChange={() => toggleActive(p)} label="Active" />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <IconButton icon={ExternalLink} label="View in store" href={`/product/${p.slug}`} target="_blank" />
                      <IconButton icon={Pencil} label="Edit" onClick={() => router.push(`/admin/products/${p.id}`)} />
                      <IconButton icon={Trash} label="Delete" tone="danger" disabled={busyId === p.id} onClick={() => remove(p)} />
                    </div>
                  </td>
                </tr>
              ))}
            </Table>
            <Pagination page={data.page} pages={data.pages} total={data.total} onChange={(page) => set({ page })} />
          </>
        )}
      </div>
    </>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<LoadingBlock />}>
      <ProductsList />
    </Suspense>
  );
}
