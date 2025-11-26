import { useEffect, useState } from 'react';
import { PublicShell } from '@/components/layout/PublicShell';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Smartphone, Download, Share, MoreVertical, Home } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export default function Install() {
  const navigate = useNavigate();
  const [platform, setPlatform] = useState<'ios' | 'android' | 'desktop'>('desktop');
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    // Detect platform
    const userAgent = navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod/.test(userAgent)) {
      setPlatform('ios');
    } else if (/android/.test(userAgent)) {
      setPlatform('android');
    }

    // Listen for PWA install prompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  return (
    <PublicShell className="bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/')}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <Link to="/" className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent font-mono">
            KAEVA
          </Link>
          <div className="w-20" />
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-6 py-12 max-w-3xl">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <Download className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-4xl font-bold mb-4 font-display">Install KAEVA</h1>
          <p className="text-lg text-muted-foreground">
            Get the full app experience with offline access, faster loading, and home screen convenience.
          </p>
        </div>

        {/* Quick Install Button for Android */}
        {deferredPrompt && platform === 'android' && (
          <div className="mb-8 p-6 rounded-2xl border border-primary/20 bg-primary/5">
            <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
              <Smartphone className="h-5 w-5 text-primary" />
              Quick Install
            </h2>
            <p className="text-muted-foreground mb-4">
              Click the button below to install KAEVA directly to your device.
            </p>
            <Button onClick={handleInstallClick} className="w-full" size="lg">
              Install Now
            </Button>
          </div>
        )}

        {/* iOS Instructions */}
        {platform === 'ios' && (
          <div className="space-y-6">
            <div className="p-6 rounded-2xl border border-border bg-card">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <Smartphone className="h-6 w-6 text-primary" />
                Install on iPhone/iPad
              </h2>
              
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                    1
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Open Safari</h3>
                    <p className="text-muted-foreground text-sm">
                      Make sure you're viewing this page in Safari browser (not Chrome or other browsers).
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                    2
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      Tap the Share button
                      <Share className="h-4 w-4 text-accent" />
                    </h3>
                    <p className="text-muted-foreground text-sm">
                      Look for the share icon at the bottom of the screen (or top on iPad).
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                    3
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      Select "Add to Home Screen"
                      <Home className="h-4 w-4 text-secondary" />
                    </h3>
                    <p className="text-muted-foreground text-sm">
                      Scroll down in the share menu and tap "Add to Home Screen".
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                    4
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Tap "Add"</h3>
                    <p className="text-muted-foreground text-sm">
                      Confirm by tapping "Add" in the top right. KAEVA will appear on your home screen!
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Android Instructions */}
        {platform === 'android' && (
          <div className="space-y-6">
            <div className="p-6 rounded-2xl border border-border bg-card">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <Smartphone className="h-6 w-6 text-primary" />
                Install on Android
              </h2>
              
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                    1
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Open Chrome Browser</h3>
                    <p className="text-muted-foreground text-sm">
                      Make sure you're using Chrome, Edge, or Samsung Internet browser.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                    2
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      Tap the Menu button
                      <MoreVertical className="h-4 w-4 text-accent" />
                    </h3>
                    <p className="text-muted-foreground text-sm">
                      Tap the three dots in the top right corner of the browser.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                    3
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      Select "Install app" or "Add to Home screen"
                      <Download className="h-4 w-4 text-secondary" />
                    </h3>
                    <p className="text-muted-foreground text-sm">
                      Look for either option in the menu.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                    4
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Tap "Install"</h3>
                    <p className="text-muted-foreground text-sm">
                      Confirm the installation. KAEVA will be added to your app drawer!
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Desktop Instructions */}
        {platform === 'desktop' && (
          <div className="space-y-6">
            <div className="p-6 rounded-2xl border border-border bg-card">
              <h2 className="text-2xl font-bold mb-6">Install on Desktop</h2>
              
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                    1
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Look for the Install icon</h3>
                    <p className="text-muted-foreground text-sm">
                      In Chrome, Edge, or Brave, look for an install icon in the address bar (usually on the right side).
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                    2
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Click "Install"</h3>
                    <p className="text-muted-foreground text-sm">
                      Click the install button and confirm. KAEVA will open in its own window!
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Benefits */}
        <div className="mt-12 p-6 rounded-2xl border border-secondary/20 bg-secondary/5">
          <h2 className="text-xl font-bold mb-4">Why Install?</h2>
          <ul className="space-y-3 text-muted-foreground">
            <li className="flex items-start gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-secondary mt-2 flex-shrink-0" />
              <span><strong className="text-foreground">Offline Access:</strong> Use KAEVA even without internet connection</span>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-secondary mt-2 flex-shrink-0" />
              <span><strong className="text-foreground">Faster Loading:</strong> App resources are cached for instant access</span>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-secondary mt-2 flex-shrink-0" />
              <span><strong className="text-foreground">Home Screen Icon:</strong> Launch KAEVA directly from your device</span>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-secondary mt-2 flex-shrink-0" />
              <span><strong className="text-foreground">Full Screen:</strong> Enjoy a native app-like experience</span>
            </li>
          </ul>
        </div>

        {/* CTA */}
        <div className="mt-8 text-center">
          <Button
            onClick={() => navigate('/auth')}
            size="lg"
            className="gap-2"
          >
            Get Started with KAEVA
          </Button>
        </div>
      </main>
    </PublicShell>
  );
}
