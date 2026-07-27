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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black text-gray-900 dark:text-white selection:bg-purple-500/30">
      <div className="border-b border-gray-200 dark:border-white/10 bg-white/80 dark:bg-black/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-600/20 flex items-center justify-center border border-purple-200 dark:border-purple-500/30">
              <span className="text-purple-600 dark:text-purple-400 font-bold text-sm">A</span>
            </div>
            <span className="font-semibold text-lg tracking-tight">Admin Console</span>
          </div>
          <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
            <span>{primaryEmail}</span>
            <a href="/dashboard" className="hover:text-gray-900 dark:hover:text-white transition-colors text-purple-600 dark:text-purple-400">
              Exit Admin
            </a>
          </div>
        </div>
      </div>
      <main className="max-w-7xl mx-auto px-6 py-8">
        {children}
      </main>
    </div>
  );
}
