
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import {
  LayoutDashboard,
  Users,
  Target,
  CheckSquare,
  Calculator,
  LogOut,
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Clientes', href: '/clients', icon: Users },
  { name: 'Campanhas', href: '/campaigns', icon: Target },
  { name: 'Checklist', href: '/checklist', icon: CheckSquare },
  { name: 'ROI/CAC', href: '/roi', icon: Calculator },
];

export function Sidebar() {
  const location = useLocation();
  const { signOut } = useAuth();

  return (
    <div className="flex flex-col w-64 bg-card border-r border-border h-screen fixed left-0 top-0">
      <div className="flex items-center justify-center h-16 border-b border-border">
        <h1 className="text-xl font-bold text-primary">AdCentral</h1>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-2">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.name}
              to={item.href}
              className={`flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent'
              }`}
            >
              <item.icon className="mr-3 h-5 w-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-border">
        <Button
          onClick={signOut}
          variant="ghost"
          className="w-full justify-start text-muted-foreground hover:text-foreground"
        >
          <LogOut className="mr-3 h-5 w-5" />
          Sair
        </Button>
      </div>
    </div>
  );
}
