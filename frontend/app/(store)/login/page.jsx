import { Suspense } from 'react';
import AuthForm from '@/components/store/AuthForm';

export const metadata = { title: 'Log In' };

export default function LoginPage() {
  return (
    <Suspense>
      <AuthForm mode="login" />
    </Suspense>
  );
}
