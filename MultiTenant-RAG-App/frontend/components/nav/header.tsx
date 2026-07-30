'use client';

import { useAuthStore } from '@/lib/store/auth-store';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { Building2, LogOut, User, Settings, Users, FileText, Search, Mail } from 'lucide-react';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import Link from 'next/link';

export function Header() {
  const { user, tenant, logout } = useAuthStore();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/auth/login');
  };

  return (
    <header className="border-b bg-background">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/dashboard" className="flex items-center gap-2 font-bold text-xl">
          <Building2 className="h-6 w-6 text-primary" />
          <span>RAG SaaS</span>
        </Link>

        <nav className="flex items-center gap-1">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm">
              <Search className="mr-2 h-4 w-4" />
              Search
            </Button>
          </Link>
          <Link href="/documents">
            <Button variant="ghost" size="sm">
              <FileText className="mr-2 h-4 w-4" />
              Documents
            </Button>
          </Link>
          <Link href="/conversations">
            <Button variant="ghost" size="sm">
              <Mail className="mr-2 h-4 w-4" />
              Conversations
            </Button>
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">{tenant?.name}</span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                {user?.displayName || user?.email}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href="/settings">Settings</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/team">Team</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}