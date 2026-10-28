'use client';

import { useParams } from 'next/navigation';
import ProductForm from '@/components/admin/ProductForm';

export default function EditProductPage() {
  const { id } = useParams();
  return <ProductForm key={id} productId={id} />;
}
