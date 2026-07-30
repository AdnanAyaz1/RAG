'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Check, X } from 'lucide-react';

export default function InvitationsPage() {
  const [loading, setLoading] = useState(false);

  const invitations = [
    { id: '1', email: 'alice@example.com', role: 'end_user', sentBy: 'Admin', status: 'pending' },
    { id: '2', email: 'bob@example.com', role: 'tenant_admin', sentBy: 'Admin', status: 'accepted' },
  ];

  const handleAccept = async (id: string) => {
    setLoading(true);
    const res = await fetch(`/tenants/me/invitations/${id}/accept`, { method: 'POST' });
    if (res.ok) {
      toast.success('Invitation accepted');
    } else {
      toast.error('Failed to accept invitation');
    }
    setLoading(false);
  };

  const handleDecline = async (id: string) => {
    setLoading(true);
    const res = await fetch(`/tenants/me/invitations/${id}`, { method: 'DELETE' });
    if (res.ok) {
      toast.success('Invitation declined');
    } else {
      toast.error('Failed to decline invitation');
    }
    setLoading(false);
  };

  return (
    <main className="container mx-auto p-6 max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Invitations</h1>

      <Card>
        <CardHeader>
          <CardTitle>Pending ({invitations.filter((i) => i.status === 'pending').length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {invitations
              .filter((i) => i.status === 'pending')
              .map((inv) => (
                <div
                  key={inv.id}
                  className="flex items-center justify-between p-3 rounded-lg border"
                >
                  <div>
                    <p className="font-medium">{inv.email}</p>
                    <p className="text-sm text-muted-foreground">
                      Invited by {inv.sentBy} as {inv.role}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="default" onClick={() => handleAccept(inv.id)}>
                      <Check className="mr-1 h-4 w-4" /> Accept
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleDecline(inv.id)}>
                      <X className="mr-1 h-4 w-4" /> Decline
                    </Button>
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    </main>
  );
}