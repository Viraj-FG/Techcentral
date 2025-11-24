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
import AuroraBackground from "@/components/AuroraBackground";
import { Mail, Lock, Loader2, WifiOff, AlertCircle } from "lucide-react";
import { kaevaTransition } from "@/hooks/useKaevaMotion";

const Auth = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { signIn, signUp, isAuthenticated, isLoading: authLoading, error: authError } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

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

  // Listen for online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const onSubmit = async (data: AuthFormData) => {
    if (isOffline) {
      toast({
        title: "No Internet Connection",
        description: "Please check your connection and try again",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      if (isSignUp) {
        await signUp(data.email, data.password);
        toast({
          title: "Account Created!",
          description: "Welcome to Kaeva. Let's build your digital twin.",
        });
      } else {
        await signIn(data.email, data.password);
        toast({
          title: "Welcome Back!",
          description: "Signed in successfully",
        });
      }
    } catch (error: any) {
      toast({
        title: "Authentication Error",
        description: error.message || "An unexpected error occurred",
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
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={kaevaTransition}
            className="text-center text-white/40 text-body mt-6"
          >
            By continuing, you agree to Kaeva's Terms of Service and Privacy Policy
          </motion.p>
        </motion.div>
      </div>
    </div>
  );
};

export default Auth;
