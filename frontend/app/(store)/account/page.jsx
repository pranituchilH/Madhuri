import { Suspense } from 'react';
import AccountView from '@/components/store/AccountView';

export const metadata = { title: 'My Account' };

export default function AccountPage() {
  return (
    <Suspense>
      <AccountView />
    </Suspense>
  );
}
