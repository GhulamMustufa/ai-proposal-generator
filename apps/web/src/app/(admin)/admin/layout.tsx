import { auth, currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { ReactNode } from 'react';

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const user = await currentUser();
  const { getToken } = await auth();
  const token = await getToken();
  
  if (!user || !token) {
    redirect('/sign-in');
  }

  const primaryEmail = user.emailAddresses.find(
    (email) => email.id === user.primaryEmailAddressId
  )?.emailAddress?.toLowerCase();

  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
    const res = await fetch(`${apiUrl}/api/admin/check`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store'
    });
    
    if (!res.ok) {
      redirect('/dashboard');
    }
  } catch (err) {
    redirect('/dashboard');
  }

  return <>{children}</>;
}
