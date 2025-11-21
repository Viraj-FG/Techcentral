interface DashboardProps {
  profile: any;
}

const Dashboard = ({ profile }: DashboardProps) => {
  return (
    <div className="min-h-screen bg-kaeva-void p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-4xl tracking-premium text-kaeva-sage">Welcome to KAEVA</h1>
        <div className="glass-card p-6">
          <h2 className="text-2xl tracking-wide text-kaeva-slate-200 mb-4">Your Profile</h2>
          <div className="space-y-2 text-kaeva-slate-400">
            <p><span className="text-kaeva-sage">Language:</span> {profile.language}</p>
            <p><span className="text-kaeva-sage">Household:</span> {profile.household.adults}A {profile.household.kids}K {profile.household.dogs}D {profile.household.cats}C</p>
            {profile.internalFlags.enableToxicFoodWarnings && (
              <p className="text-kaeva-teal">🛡️ Canine safety protocols active</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
