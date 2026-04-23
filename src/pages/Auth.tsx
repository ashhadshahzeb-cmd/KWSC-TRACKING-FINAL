import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { LogIn, UserPlus, ShieldCheck, Mail, Lock, User as UserIcon, Loader2, Building2, ChevronDown } from 'lucide-react';
import { useAuth, DEPARTMENT_USERS } from '@/contexts/AuthContext';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showQuickAccess, setShowQuickAccess] = useState(false);
  const navigate = useNavigate();
  const { localSignIn } = useAuth();

  // CSS animations handle the entry effects now

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        // Try local department login first
        const localResult = await localSignIn(email, password);
        if (localResult.success) {
          toast.success('Welcome! Login successful.');
          navigate('/');
          return;
        }

        // Fallback to Supabase auth
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          // If Supabase also fails, show the local error
          toast.error(localResult.error || error.message);
          return;
        }
        toast.success('Welcome! Login successful.');
        navigate('/');
      } else {
        // Signup
        const { data, error } = await supabase.auth.signUp({ 
          email, 
          password,
          options: {
            data: {
              full_name: fullName,
            }
          }
        });
        
        if (error) throw error;

        if (data.user) {
          // Manual insert to 'users' table as requested
          const { error: dbError } = await supabase.from('users').insert({
            id: data.user.id,
            name: fullName,
            email: email,
            role: 'admin' // Defaulting to admin as per request
          });
          
          if (dbError) console.error('Error creating user profile:', dbError);
        }

        toast.success('Registration successful! Please check your email for verification.');
        setIsLogin(true);
      }
    } catch (error: any) {
      toast.error(error.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = (dept: typeof DEPARTMENT_USERS[0]) => {
    setEmail(dept.email);
    setPassword(dept.password);
    setShowQuickAccess(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0c] relative overflow-hidden p-4">
      {/* Background Decorative Elements */}
      <div className="auth-bg-blob absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[120px]" />
      <div className="auth-bg-blob absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[120px]" />

      <Card className="w-full max-w-md glass-card border-white/10 shadow-2xl relative z-10 animate-in fade-in zoom-in-95 duration-500">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-primary/20 rounded-2xl border border-primary/30">
              <ShieldCheck className="w-8 h-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold tracking-tight text-white italic">
            {isLogin ? 'Login to Portal' : 'Create Admin Account'}
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            {isLogin 
              ? 'Enter your department credentials to access the finance system' 
              : 'Register as an administrator for the KWSC system'}
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleAuth}>
          <CardContent className="space-y-4">
            {!isLogin && (
              <div className="space-y-2 auth-field">
                <Label htmlFor="name">Full Name</Label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input 
                    id="name" 
                    placeholder="Waseem Akram" 
                    className="pl-10 bg-white/5 border-white/10" 
                    required={!isLogin}
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </div>
              </div>
            )}
            <div className="space-y-2 auth-field">
              <Label htmlFor="email">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="name@kwsb.gov.pk" 
                  className="pl-10 bg-white/5 border-white/10" 
                  required 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2 auth-field">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input 
                  id="password" 
                  type="password" 
                  className="pl-10 bg-white/5 border-white/10" 
                  required 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            {/* Quick Access Panel Removed per request */}
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button className="w-full bg-primary hover:bg-primary/90 text-white font-bold h-11" disabled={loading}>
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
              ) : isLogin ? (
                <LogIn className="w-5 h-5 mr-2" />
              ) : (
                <UserPlus className="w-5 h-5 mr-2" />
              )}
              {isLogin ? 'Sign In' : 'Create Account'}
            </Button>
            <div className="text-sm text-center text-muted-foreground">
              {isLogin ? "Need a new account? " : "Already have an account? "}
              <button 
                type="button" 
                onClick={() => setIsLogin(!isLogin)}
                className="text-primary hover:underline font-semibold italic"
              >
                {isLogin ? 'Register' : 'Login'}
              </button>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
