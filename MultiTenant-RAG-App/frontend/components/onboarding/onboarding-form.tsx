'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2, Building2 } from 'lucide-react';

interface OnboardingFormProps {
  onComplete: () => void;
}

export function OnboardingForm({ onComplete }: OnboardingFormProps) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    companyName: '',
    companySize: '',
    industry: '',
    useCase: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const res = await fetch('/auth/onboarding', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });

    if (!res.ok) {
      const data = await res.json();
      toast.error(data.error || 'Onboarding failed');
      setLoading(false);
      return;
    }

    toast.success('Setup complete!');
    onComplete();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" /> Company Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="companyName">Company name</Label>
            <Input
              id="companyName"
              name="companyName"
              placeholder="Your organization"
              value={form.companyName}
              onChange={(e) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="companySize">Company size</Label>
            <Select
              value={form.companySize}
              onValueChange={(value) => setForm((prev) => ({ ...prev, companySize: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select size" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1-10">1–10 employees</SelectItem>
                <SelectItem value="11-50">11–50 employees</SelectItem>
                <SelectItem value="51-200">51–200 employees</SelectItem>
                <SelectItem value="201-1000">201–1000 employees</SelectItem>
                <SelectItem value="1000+">1000+ employees</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="industry">Industry</Label>
            <Input
              id="industry"
              name="industry"
              placeholder="e.g. Healthcare, Finance, Legal"
              value={form.industry}
              onChange={(e) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="useCase">Primary use case</Label>
            <Input
              id="useCase"
              name="useCase"
              placeholder="e.g. Document search, Compliance"
              value={form.useCase}
              onChange={(e) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))}
            />
          </div>
          <Button type="submit" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Complete Setup
          </Button>
        </CardContent>
      </Card>
    </form>
  );
}