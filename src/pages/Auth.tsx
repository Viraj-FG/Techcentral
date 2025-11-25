import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import AuroraBackground from "@/components/AuroraBackground";
import { Mail, Lock, Loader2, WifiOff, AlertCircle } from "lucide-react";
import { kaevaTransition } from "@/hooks/useKaevaMotion";

import { consoleRecorder } from "@/lib/consoleRecorder";

const Auth = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { signIn, signUp, resetPassword, isAuthenticated, isLoading: authLoading, error: authError } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [resetEmail, setResetEmail] = useState("");
  const [isResetting, setIsResetting] = useState(false);
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail) return;
    
    setIsResetting(true);
    try {
      await resetPassword(resetEmail);
      toast({
        title: "Check your email",
        description: "We've sent you a password reset link.",
      });
      setIsResetDialogOpen(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsResetting(false);
    }
  };

  const authSchema = z.object({
    email: z.string().email("Please enter a valid email address"),
    password: isSignUp 
      ? z.string().min(8, "Password must be at least 8 characters")
      : z.string().min(1, "Password is required"),
    confirmPassword: isSignUp 
      ? z.string().min(1, "Please confirm your password")
      : z.string().optional(),
  }).refine((data) => {
    if (isSignUp) {
      return data.password === data.confirmPassword;
    }
    return true;
  }, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

  type AuthFormData = z.infer<typeof authSchema>;

  const { register, handleSubmit, formState: { errors }, reset } = useForm<AuthFormData>({
    resolver: zodResolver(authSchema),
  });

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      navigate('/');
    }

    // Listen for online/offline status
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => {
      setIsOffline(true);
      toast({
        title: "No Internet Connection",
        description: "Please check your connection and try again",
        variant: "destructive",
      });
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [isAuthenticated, authLoading, navigate, toast]);

  const onSubmit = async (data: AuthFormData) => {
    console.log('📝 Form submitted:', { email: data.email, isSignUp });
    
    if (isOffline) {
      console.log('❌ Offline - cannot submit');
      toast({
        title: "No Internet Connection",
        description: "Please check your connection and try again",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    console.log('⏳ Loading state set to true');

    try {
      if (isSignUp) {
        console.log('📝 Attempting sign up...');
        await signUp(data.email, data.password);
        toast({
          title: "Account Created!",
          description: "Please check your email to verify your account before signing in.",
        });
      } else {
        console.log('📝 Attempting sign in...');
        await signIn(data.email, data.password);
        console.log('✅ Sign in successful - auth state will trigger redirect');
        toast({
          title: "Welcome Back!",
          description: "Signed in successfully",
        });
        // Don't navigate here - let the auth state change in Index.tsx handle routing
      }
    } catch (error: any) {
      console.error('❌ Auth error in onSubmit:', error);
      toast({
        title: "Authentication Error",
        description: error.message || "An unexpected error occurred",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
      console.log('⏳ Loading state set to false');
    }
  };

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    reset();
  };

  return (
    <div className="min-h-screen bg-kaeva-void overflow-y-auto">
      <AuroraBackground vertical="food" />

      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={kaevaTransition}
          className="w-full max-w-md"
        >
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={kaevaTransition}
            className="text-center mb-8"
          >
          <div className="inline-block mb-4">
            <svg
              width="80"
              height="80"
              viewBox="0 0 100 100"
              className="w-16 h-16 sm:w-20 sm:h-20"
            >
              {/* K Shape with Viewfinder Aesthetic */}
              <motion.path
                d="M 20 20 L 20 80 M 20 50 L 60 20 M 20 50 L 60 80 M 15 15 L 15 25 M 15 15 L 25 15 M 15 85 L 15 75 M 15 85 L 25 85 M 85 15 L 85 25 M 85 15 L 75 15 M 85 85 L 85 75 M 85 85 L 75 85"
                stroke="hsl(var(--kaeva-sage))"
                strokeWidth="2.5"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1.5, ease: "easeInOut", repeat: Infinity, repeatDelay: 2 }}
              />
              
              {/* Focus Dot */}
              <motion.circle
                cx="50"
                cy="50"
                r="3"
                fill="hsl(var(--kaeva-sage))"
                initial={{ scale: 0 }}
                animate={{ scale: [0, 1, 1, 0] }}
                transition={{ 
                  duration: 3.5,
                  times: [0, 0.46, 0.92, 1],
                  repeat: Infinity,
                  repeatDelay: 0
                }}
              />
            </svg>
          </div>
            <h1 className="text-display text-4xl text-white mb-2">
              Kaeva
            </h1>
            <p className="text-body text-white/60">
              Your Multi-Vertical Digital Twin
            </p>
          </motion.div>

          {/* Offline Indicator */}
          {isOffline && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-3"
            >
              <WifiOff className="w-5 h-5 text-red-400" />
              <p className="text-red-400 text-sm">
                No internet connection. Please check your network.
              </p>
            </motion.div>
          )}

          {/* Auth Error Display */}
          {authError && !isOffline && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-3"
            >
              <AlertCircle className="w-5 h-5 text-red-400" />
              <p className="text-red-400 text-sm">{authError}</p>
            </motion.div>
          )}

          {/* Glass Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={kaevaTransition}
          className="glass-card p-8"
          >
            {/* Email/Password Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <Label htmlFor="email" className="text-white/90 flex items-center gap-2 mb-2">
                  <Mail size={20} strokeWidth={1.5} />
                  <span className="text-micro">Email</span>
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
                  <Lock size={20} strokeWidth={1.5} />
                  <span className="text-micro">Password</span>
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
                {!isSignUp && (
                  <div className="flex justify-end mt-2">
                    <button
                      type="button"
                      onClick={() => setIsResetDialogOpen(true)}
                      className="text-xs text-white/60 hover:text-white hover:underline transition-colors"
                    >
                      Forgot password?
                    </button>
                  </div>
                )}
              </div>

              {isSignUp && (
                <div>
                  <Label htmlFor="confirmPassword" className="text-white/90 flex items-center gap-2 mb-2">
                    <Lock size={20} strokeWidth={1.5} />
                    <span className="text-micro">Confirm Password</span>
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
                variant="primary"
                className="w-full py-6 shadow-lg shadow-kaeva-sage/20"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="animate-spin mr-2" size={20} strokeWidth={1.5} />
                    <span className="text-micro">
                      {isSignUp ? 'Creating Account...' : 'Signing In...'}
                    </span>
                  </>
                ) : (
                  <span className="text-micro">{isSignUp ? 'Create Account' : 'Sign In'}</span>
                )}
              </Button>
            </form>

            {/* Toggle Sign In/Sign Up */}
            <div className="mt-6 text-center">
              <button
                onClick={toggleMode}
                className="text-body text-white/60 hover:text-white transition-kaeva"
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
          <div className="text-center mt-6 space-y-4">
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={kaevaTransition}
              className="text-white/40 text-body"
            >
              By continuing, you agree to Kaeva's Terms of Service and Privacy Policy
            </motion.p>
            
            <button
              onClick={() => consoleRecorder.downloadLogs()}
              className="text-xs text-white/20 hover:text-white/40 transition-colors"
            >
              Download Debug Logs
            </button>
          </div>
        </motion.div>
      </div>

      {/* Password Reset Dialog */}
      <Dialog open={isResetDialogOpen} onOpenChange={setIsResetDialogOpen}>
        <DialogContent className="max-w-sm mx-auto p-6 glass-card">
          <DialogHeader>
            <DialogTitle className="text-center text-display text-2xl">
              Reset Password
            </DialogTitle>
            <DialogDescription className="text-center text-body text-white/70 mb-4">
              Enter your email to receive a password reset link.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handlePasswordReset} className="space-y-4">
            <div>
              <Label htmlFor="resetEmail" className="text-white/90 flex items-center gap-2 mb-2">
                <Mail size={20} strokeWidth={1.5} />
                <span className="text-micro">Email</span>
              </Label>
              <Input
                id="resetEmail"
                type="email"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-kaeva-sage"
                placeholder="you@example.com"
                required
              />
            </div>

            <Button
              type="submit"
              disabled={isResetting}
              variant="primary"
              className="w-full py-6 shadow-lg shadow-kaeva-sage/20"
            >
              {isResetting ? (
                <>
                  <Loader2 className="animate-spin mr-2" size={20} strokeWidth={1.5} />
                  <span className="text-micro">Sending Link...</span>
                </>
              ) : (
                <span className="text-micro">Send Reset Link</span>
              )}
            </Button>
          </form>

          <div className="mt-4 text-center">
            <button
              onClick={() => setIsResetDialogOpen(false)}
              className="text-body text-white/60 hover:text-white transition-kaeva"
            >
              Back to Sign In
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Auth;
