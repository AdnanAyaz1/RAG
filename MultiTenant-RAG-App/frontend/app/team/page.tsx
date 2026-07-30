'use client';

import { useState } from 'react';
import { useAuthStore } from '@/lib/store/auth-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Plus, Trash2 } from 'lucide-react';

export default function TeamPage() {
  const { user, tenant } = useAuthStore();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const members = [
    { id: '1', email: user?.email || '', role: 'tenant_admin', status: 'active' },
    { id: '2', email: 'member@example.com', role: 'end_user', status: 'active' },
  ];

  const handleInvite = async () => {
    if (!email) return;
    setLoading(true);
    const res = await fetch('/tenants/me/invitations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, role: 'end_user' }),
    });
    if (res.ok) {
      toast.success('Invitation sent');
      setEmail('');
    } else {
      toast.error('Failed to send invitation');
    }
    setLoading(false);
  };

  const handleRemove = async (memberId: string) => {
    const res = await fetch(`/tenants/me/members/${memberId}`, { method: 'DELETE' });
    if (res.ok) {
      toast.success('Member removed');
    } else {
      toast.error('Failed to remove member');
    }
  };

  return (
    <main className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">Team — {tenant?.name}</h1>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Invite Member</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleInvite();
            }}
            className="flex gap-2"
          >
            <div className="flex-1 space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="colleague@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <Button type="submit" disabled={loading}>
              <Plus className="mr-2 h-4 w-4" />
              Invite
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Members ({members.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {members.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between p-3 rounded-lg border"
              >
                <div>
                  <p className="font-medium">{member.email}</p>
                  <p className="text-sm text-muted-foreground capitalize">{member.role}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                    {member.status}
                  </span>
                  {member.role !== 'tenant_admin' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemove(member.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </main>
  );
}