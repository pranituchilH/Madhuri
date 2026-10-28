import { Suspense } from 'react';
import AuthForm from '@/components/store/AuthForm';

export const metadata = { title: 'Create Account' };

export default function RegisterPage() {
  return (
    <Suspense>
      <AuthForm mode="register" />
    </Suspense>
  );
}
