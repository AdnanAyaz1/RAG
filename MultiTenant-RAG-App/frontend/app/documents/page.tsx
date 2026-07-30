'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { apiClient } from '@/lib/query/api';
import { toast } from 'sonner';
import { Upload, FileText, Trash2, RefreshCw } from 'lucide-react';

export default function DocumentsPage() {
  const [documents, setDocuments] = useState([
    { id: '1', title: 'Policy Document.pdf', status: 'indexed', size: '2.4 MB' },
    { id: '2', title: 'Research Paper.docx', status: 'indexed', size: '1.1 MB' },
    { id: '3', title: 'Meeting Notes.txt', status: 'processing', size: '12 KB' },
  ]);
  const [file, setFile] = useState<File | null>(null);

  const handleUpload = async () => {
    if (!file) return;
    toast.info('Uploading...');
    try {
      const formData = new FormData();
      formData.append('file', file);
      await apiClient.post('/documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success('Document uploaded');
      setDocuments((prev) => [
        ...prev,
        { id: String(Date.now()), title: file.name, status: 'processing', size: `${(file.size / 1024 / 1024).toFixed(1)} MB` },
      ]);
      setFile(null);
    } catch {
      toast.error('Upload failed');
    }
  };

  return (
    <main className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">Documents</h1>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Upload Document</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-end">
            <div className="flex-1 space-y-2">
              <label className="text-sm font-medium">File (PDF, DOCX, TXT — max 50MB)</label>
              <Input type="file" accept=".pdf,.docx,.txt" onChange={(e) => setFile(e.target.files?.[0] || null)} />
            </div>
            <Button onClick={handleUpload}>
              <Upload className="mr-2 h-4 w-4" />
              Upload
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Documents ({documents.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {documents.map((doc) => (
              <div key={doc.id} className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{doc.title}</p>
                    <p className="text-sm text-muted-foreground">{doc.size}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-1 rounded ${doc.status === 'indexed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                    {doc.status}
                  </span>
                  <Button variant="ghost" size="sm">
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Trash2 className="h-4 w-4" />
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