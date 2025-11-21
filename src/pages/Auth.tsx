import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import AuroraBackground from "@/components/AuroraBackground";
import { Mail, Lock, Loader2, Sparkles } from "lucide-react";

const authSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string().optional(),
}).refine((data) => {
  if (data.confirmPassword !== undefined) {
    return data.password === data.confirmPassword;
  }
  return true;
}, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type AuthFormData = z.infer<typeof authSchema>;

const Auth = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isSignUp, setIsSignUp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const { register, handleSubmit, formState: { errors }, reset } = useForm<AuthFormData>({
    resolver: zodResolver(authSchema),
  });

  // Check if user is already authenticated
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate('/');
      }
    };
    checkAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        navigate('/');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    try {
      const redirectUrl = `${window.location.origin}/`;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl
        }
      });

      if (error) throw error;
    } catch (error: any) {
      toast({
        title: "Authentication Error",
        description: error.message || "Failed to sign in with Google",
        variant: "destructive"
      });
      setIsGoogleLoading(false);
    }
  };

  const onSubmit = async (data: AuthFormData) => {
    setIsLoading(true);

    try {
      if (isSignUp) {
        // Sign up
        const redirectUrl = `${window.location.origin}/`;
        const { error } = await supabase.auth.signUp({
          email: data.email,
          password: data.password,
          options: {
            emailRedirectTo: redirectUrl
          }
        });

        if (error) throw error;

        toast({
          title: "Account Created!",
          description: "Welcome to Kaeva. Let's build your digital twin.",
        });
      } else {
        // Sign in
        const { error } = await supabase.auth.signInWithPassword({
          email: data.email,
          password: data.password,
        });

        if (error) throw error;

        toast({
          title: "Welcome Back!",
          description: "Signed in successfully",
        });
      }
    } catch (error: any) {
      toast({
        title: "Authentication Error",
        description: error.message || `Failed to ${isSignUp ? 'sign up' : 'sign in'}`,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    reset();
  };

  return (
    <div className="min-h-screen bg-kaeva-void overflow-auto">
      <AuroraBackground vertical="food" />

      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-md"
        >
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-center mb-8"
          >
            <motion.div
              animate={{
                scale: [1, 1.1, 1],
                rotate: [0, 5, -5, 0]
              }}
              transition={{ duration: 4, repeat: Infinity }}
              className="inline-block mb-4"
            >
              <Sparkles className="w-16 h-16 text-kaeva-sage" strokeWidth={1.5} />
            </motion.div>
            <h1 className="text-4xl font-light tracking-wider text-white mb-2">
              Kaeva
            </h1>
            <p className="text-white/60 text-sm">
              Your Multi-Vertical Digital Twin
            </p>
          </motion.div>

          {/* Glass Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-8 shadow-2xl"
          >
            {/* Google Sign In */}
            <Button
              onClick={handleGoogleSignIn}
              disabled={isGoogleLoading}
              className="w-full bg-white hover:bg-white/90 text-kaeva-void font-semibold py-6 mb-6 shadow-lg"
            >
              {isGoogleLoading ? (
                <>
                  <Loader2 className="animate-spin mr-2" size={18} />
                  Connecting...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Sign in with Google
                </>
              )}
            </Button>

            {/* Divider */}
            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-kaeva-void px-4 text-white/50">
                  or continue with email
                </span>
              </div>
            </div>

            {/* Email/Password Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <Label htmlFor="email" className="text-white/90 flex items-center gap-2 mb-2">
                  <Mail className="w-4 h-4" />
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  {...register("email")}
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-kaeva-sage"
                  placeholder="you@example.com"
                />
                {errors.email && (
                  <p className="text-red-400 text-sm mt-1">{errors.email.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="password" className="text-white/90 flex items-center gap-2 mb-2">
                  <Lock className="w-4 h-4" />
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  {...register("password")}
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-kaeva-sage"
                  placeholder="••••••••"
                />
                {errors.password && (
                  <p className="text-red-400 text-sm mt-1">{errors.password.message}</p>
                )}
              </div>

              {isSignUp && (
                <div>
                  <Label htmlFor="confirmPassword" className="text-white/90 flex items-center gap-2 mb-2">
                    <Lock className="w-4 h-4" />
                    Confirm Password
                  </Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    {...register("confirmPassword")}
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-kaeva-sage"
                    placeholder="••••••••"
                  />
                  {errors.confirmPassword && (
                    <p className="text-red-400 text-sm mt-1">{errors.confirmPassword.message}</p>
                  )}
                </div>
              )}

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-kaeva-sage hover:bg-kaeva-sage/90 text-kaeva-void font-semibold py-6 shadow-[0_0_20px_rgba(112,224,152,0.3)]"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="animate-spin mr-2" size={18} />
                    {isSignUp ? 'Creating Account...' : 'Signing In...'}
                  </>
                ) : (
                  isSignUp ? 'Create Account' : 'Sign In'
                )}
              </Button>
            </form>

            {/* Toggle Sign In/Sign Up */}
            <div className="mt-6 text-center">
              <button
                onClick={toggleMode}
                className="text-white/60 hover:text-white text-sm transition-colors"
              >
                {isSignUp ? (
                  <>
                    Already have an account? <span className="text-kaeva-sage font-semibold">Sign In</span>
                  </>
                ) : (
                  <>
                    Don't have an account? <span className="text-kaeva-sage font-semibold">Sign Up</span>
                  </>
                )}
              </button>
            </div>
          </motion.div>

          {/* Footer */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="text-center text-white/40 text-xs mt-6"
          >
            By continuing, you agree to Kaeva's Terms of Service and Privacy Policy
          </motion.p>
        </motion.div>
      </div>
    </div>
  );
};

export default Auth;
