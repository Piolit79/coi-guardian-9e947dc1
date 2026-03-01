import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Shield } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type Mode = 'login' | 'signup' | 'forgot';

export default function Auth() {
  const { session, loading } = useAuth();
  const { toast } = useToast();
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (loading) return null;
  if (session) return <Navigate to="/" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (mode === 'forgot') {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        toast({ title: 'Check your email', description: 'Password reset link sent.' });
        setMode('login');
      } else if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        toast({ title: 'Check your email', description: 'Confirm your account to sign in.' });
        setMode('login');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm border border-border p-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="flex h-10 w-10 items-center justify-center rounded bg-primary/10">
            <Shield className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">COI Tracker</h1>
            <p className="text-xs text-muted-foreground">Insurance Management</p>
          </div>
        </div>

        <h2 className="text-lg font-semibold text-foreground mb-1">
          {mode === 'login' ? 'Sign in' : mode === 'signup' ? 'Create account' : 'Reset password'}
        </h2>
        <p className="text-sm text-muted-foreground mb-6">
          {mode === 'forgot' ? 'Enter your email to receive a reset link.' : 'Enter your credentials below.'}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          {mode !== 'forgot' && (
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} />
            </div>
          )}
          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? '...' : mode === 'login' ? 'Sign in' : mode === 'signup' ? 'Create account' : 'Send reset link'}
          </Button>
        </form>

        <div className="mt-6 space-y-2 text-center text-sm">
          {mode === 'login' && (
            <>
              <button onClick={() => setMode('forgot')} className="text-primary hover:underline block mx-auto">Forgot password?</button>
              <p className="text-muted-foreground">
                No account? <button onClick={() => setMode('signup')} className="text-primary hover:underline">Sign up</button>
              </p>
            </>
          )}
          {mode !== 'login' && (
            <button onClick={() => setMode('login')} className="text-primary hover:underline">Back to sign in</button>
          )}
        </div>
      </Card>
    </div>
  );
}
