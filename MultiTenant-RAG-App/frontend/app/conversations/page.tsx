'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { apiClient } from '@/lib/query/api';
import { toast } from 'sonner';
import { Send, MessageSquare, Clock } from 'lucide-react';

export default function ConversationsPage() {
  const [conversations] = useState([
    { id: '1', title: 'What is hypertension?', time: '2 hours ago', messageCount: 5 },
    { id: '2', title: 'Diabetes treatment options', time: 'Yesterday', messageCount: 12 },
    { id: '3', title: 'Drug interactions', time: '3 days ago', messageCount: 3 },
  ]);
  const [activeConversation, setActiveConversation] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const res = await apiClient.post('/search/query', { question: query });
      toast.success('Search complete');
      setQuery('');
    } catch {
      toast.error('Search failed');
    }
    setLoading(false);
  };

  return (
    <main className="container mx-auto p-6 max-w-6xl">
      <h1 className="text-2xl font-bold mb-6">Conversations</h1>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {conversations.map((conv) => (
                <div
                  key={conv.id}
                  className="p-3 rounded-lg border cursor-pointer hover:bg-accent"
                  onClick={() => setActiveConversation(conv.id)}
                >
                  <p className="font-medium text-sm">{conv.title}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {conv.time} — {conv.messageCount} messages
                  </p>
                </div>
              ))}
              {conversations.length === 0 && (
                <p className="text-sm text-muted-foreground">No conversations yet</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>{activeConversation ? 'Chat' : 'Start a new search'}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSearch();
              }}
              className="flex gap-2"
            >
              <Input
                placeholder="Ask a question about your documents..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                disabled={loading}
              />
              <Button type="submit" disabled={loading}>
                <Send className="mr-2 h-4 w-4" />
                Search
              </Button>
            </form>
            <p className="text-sm text-muted-foreground">
              {activeConversation
                ? 'View conversation details here.'
                : 'Enter a question and search across your uploaded documents.'}
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}