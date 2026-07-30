'use client';

import { useAuthStore } from '@/lib/store/auth-store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const { user, tenant, logout } = useAuthStore();
  const router = useRouter();

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    logout();
    router.push('/auth/login');
  };

  return (
    <main className="container mx-auto p-6 max-w-6xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Welcome back, {user?.displayName || user?.email}
          </p>
        </div>
        <Button variant="outline" onClick={handleLogout}>
          Sign out
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Organization</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-semibold">{tenant?.name}</p>
            <p className="text-sm text-muted-foreground">{tenant?.slug}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Role</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-semibold capitalize">{user?.role}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Status</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-semibold text-green-600">Active</p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}