
import { Home, Users, Megaphone, Calculator, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate, useLocation } from 'react-router-dom';

const navigation = [
  { name: 'Dashboard', href: '/', icon: Home },
  { name: 'Clientes', href: '/clients', icon: Users },
  { name: 'Campanhas', href: '/campaigns', icon: Megaphone },
  { name: 'ROI/CAC', href: '/roi', icon: Calculator },
];

export default function Sidebar() {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/auth');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <div className="flex flex-col h-full bg-background border-r">
      {/* Logo */}
      <div className="flex items-center justify-center p-6 border-b">
        <h2 className="text-2xl font-bold text-primary">AdCentral</h2>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-2">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Button
              key={item.name}
              variant={isActive ? "default" : "ghost"}
              className={`w-full justify-start ${
                isActive ? 'bg-primary text-primary-foreground' : ''
              }`}
              onClick={() => navigate(item.href)}
            >
              <item.icon className="w-4 h-4 mr-3" />
              {item.name}
            </Button>
          );
        })}
      </nav>

      {/* Sign Out */}
      <div className="p-4 border-t">
        <Button
          variant="ghost"
          onClick={handleSignOut}
          className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
        >
          <LogOut className="w-4 h-4 mr-3" />
          Sair
        </Button>
      </div>
    </div>
  );
}
