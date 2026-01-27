import { Button } from "@/components/ui/button";
import { ArrowRight, PieChart, ShieldCheck, Zap } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background font-sans">
      {/* Navigation */}
      <nav className="border-b border-border/50 sticky top-0 bg-background/80 backdrop-blur-md z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-primary text-white rounded-lg p-1 px-2 font-bold font-display">€</div>
            <span className="text-xl font-bold font-display tracking-tight">FairShare</span>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" asChild className="hidden sm:inline-flex" data-testid="button-login">
              <a href="/api/login">Log in</a>
            </Button>
            <Button asChild className="rounded-full shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all" data-testid="button-signin">
              <a href="/api/login">Get Started</a>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative overflow-hidden pt-16 pb-24 lg:pt-32 lg:pb-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary text-secondary-foreground text-sm font-medium mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            New: Market Conform Abonnements Available
          </div>
          
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold font-display tracking-tight text-foreground mb-6 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100">
            Split bills <span className="text-primary relative whitespace-nowrap">
              stress-free
              <svg className="absolute -bottom-2 left-0 w-full h-3 text-primary/30 -z-10" viewBox="0 0 100 10" preserveAspectRatio="none">
                <path d="M0 5 Q 50 10 100 5" stroke="currentColor" strokeWidth="8" fill="none" />
              </svg>
            </span>
            <br className="hidden sm:block" /> with coworkers & friends.
          </h1>
          
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
            Track shared expenses, settle debts, and manage subscriptions in one premium, cloud-based platform. Integrated with Payconiq support.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300">
            <Button size="lg" className="w-full sm:w-auto rounded-full text-lg px-8 py-6 h-auto shadow-xl shadow-primary/25" asChild data-testid="button-start-free">
              <a href="/api/login">
                Start for free <ArrowRight className="ml-2 h-5 w-5" />
              </a>
            </Button>
            <Button variant="outline" size="lg" className="w-full sm:w-auto rounded-full text-lg px-8 py-6 h-auto" asChild>
              <a href="#features">View features</a>
            </Button>
          </div>
        </div>

        {/* Abstract Background Shapes */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full overflow-hidden -z-10 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-3xl" />
        </div>
      </div>

      {/* Features Grid */}
      <section id="features" className="py-24 bg-secondary/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-card p-8 rounded-2xl shadow-sm border border-border/50 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-6">
                <PieChart className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold font-display mb-3">Smart Expense Splitting</h3>
              <p className="text-muted-foreground">Automatically calculate who owes what. Split equally, by percentage, or exact amounts effortlessly.</p>
            </div>
            
            <div className="bg-card p-8 rounded-2xl shadow-sm border border-border/50 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center mb-6">
                <ShieldCheck className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold font-display mb-3">Secure Cloud Storage</h3>
              <p className="text-muted-foreground">Your financial data is encrypted and stored safely in the cloud. Access from any device, anywhere.</p>
            </div>
            
            <div className="bg-card p-8 rounded-2xl shadow-sm border border-border/50 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-amber-500/10 rounded-xl flex items-center justify-center mb-6">
                <Zap className="h-6 w-6 text-amber-600" />
              </div>
              <h3 className="text-xl font-bold font-display mb-3">Instant Settlements</h3>
              <p className="text-muted-foreground">Record payments quickly. Integrate with your banking flow to settle debts in seconds.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-background border-t border-border py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="font-display font-bold text-lg">FairShare</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © 2024 FairShare Inc. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
