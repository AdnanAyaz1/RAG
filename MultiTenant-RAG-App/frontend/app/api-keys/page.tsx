'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Plus, Trash2, Copy, Key } from 'lucide-react';

export default function ApiKeysPage() {
  const [apiKeys] = useState([
    { id: '1', name: 'Production Key', key: 'rag_pk_live_abc123...', createdAt: '2026-01-15', lastUsed: '2 hours ago' },
    { id: '2', name: 'Staging Key', key: 'rag_pk_test_xyz789...', createdAt: '2026-02-01', lastUsed: '1 day ago' },
  ]);

  const handleCreate = () => {
    toast.success('API key created');
  };

  const handleRevoke = (id: string) => {
    toast.success('API key revoked');
  };

  return (
    <main className="container mx-auto p-6 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">API Keys</h1>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          New Key
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your Keys</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {apiKeys.map((key) => (
              <div key={key.id} className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center gap-3">
                  <Key className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{key.name}</p>
                    <p className="text-xs text-muted-foreground">Created {key.createdAt} — Last used {key.lastUsed}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={() => navigator.clipboard.writeText(key.key)}>
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleRevoke(key.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
            {apiKeys.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">No API keys yet</p>
            )}
          </div>
        </CardContent>
      </Card>
    </main>
  );
}