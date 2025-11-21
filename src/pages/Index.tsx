import { useState } from "react";
import Splash from "@/components/Splash";

const Index = () => {
  const [showSplash, setShowSplash] = useState(true);

  if (showSplash) {
    return <Splash onComplete={() => setShowSplash(false)} />;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-kaeva-void">
      <div className="text-center">
        <h1 className="mb-4 text-4xl font-bold text-white tracking-premium">KAEVA Dashboard</h1>
        <p className="text-xl text-kaeva-slate-400 tracking-wide">AI Kitchen OS - System Online</p>
      </div>
    </div>
  );
};

export default Index;
