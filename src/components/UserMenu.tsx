import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { LogIn, LogOut, User, Shield, CreditCard, Crown } from 'lucide-react';
import { useSubscription } from '@/hooks/useSubscription';
import { toast } from 'sonner';

export function UserMenu() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, loading, isAdmin, signOut } = useAuth();
  const { tier, isTrialActive, isLoading: subLoading } = useSubscription();

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (error) {
      toast.error('Failed to sign out');
    } else {
      toast.success('Signed out successfully');
    }
  };

  if (loading) {
    return (
      <Button variant="ghost" size="icon" disabled>
        <User className="h-4 w-4" />
      </Button>
    );
  }

  if (!user) {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate('/auth')}
        className="gap-2 hover:bg-primary/10 hover:text-primary"
      >
        <LogIn className="h-4 w-4" />
        <span className="hidden sm:inline">{t('auth.signIn', 'Sign In')}</span>
      </Button>
    );
  }

  const initials = user.email?.slice(0, 2).toUpperCase() || 'U';
  const tierLabel = isAdmin ? 'Admin' : isTrialActive ? 'Trial' : tier === 'pro_plus' ? 'Pro+' : tier === 'pro' ? 'Pro' : 'Free';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative hover:bg-primary/10">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-primary/20 text-primary text-xs">
              {initials}
            </AvatarFallback>
          </Avatar>
          {isAdmin && (
            <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-primary border-2 border-background" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user.email}</p>
            <div className="flex items-center gap-1.5 mt-1">
              {isAdmin && (
                <Badge variant="outline" className="w-fit text-xs gap-1">
                  <Shield className="h-3 w-3" />
                  Admin
                </Badge>
              )}
              {!subLoading && (
                <Badge variant="secondary" className="w-fit text-xs gap-1">
                  <Crown className="h-3 w-3" />
                  {tierLabel}
                </Badge>
              )}
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => navigate('/profile')}>
          <User className="mr-2 h-4 w-4" />
          Profile
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate('/billing')}>
          <CreditCard className="mr-2 h-4 w-4" />
          Manage Billing
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive">
          <LogOut className="mr-2 h-4 w-4" />
          {t('auth.signOut', 'Sign Out')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
