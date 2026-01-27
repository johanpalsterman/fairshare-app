import { useSubscription, useUpgradeSubscription, useOpenCustomerPortal } from "@/hooks/use-subscription";
import { Button } from "@/components/ui/button";
import { Check, Star, Loader2, ExternalLink, CheckCircle, XCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";
import { useLocation } from "wouter";

export default function Subscription() {
  const { data: sub, isLoading, refetch } = useSubscription();
  const { mutate, isPending } = useUpgradeSubscription();
  const { mutate: openPortal, isPending: isPortalPending } = useOpenCustomerPortal();
  const { toast } = useToast();
  const [location] = useLocation();

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('success') === 'true') {
      toast({ 
        title: "Betaling gelukt!", 
        description: "Je bent nu Pro abonnee. Welkom!" 
      });
      refetch();
      window.history.replaceState({}, '', '/subscription');
    } else if (urlParams.get('canceled') === 'true') {
      toast({ 
        title: "Betaling geannuleerd", 
        description: "Je kunt op elk moment opnieuw proberen.",
        variant: "destructive"
      });
      window.history.replaceState({}, '', '/subscription');
    }
  }, [location, toast, refetch]);

  const handleUpgrade = () => {
    mutate(undefined, {
      onError: () => {
        toast({ 
          title: "Fout", 
          description: "Kon de betaling niet starten. Probeer het later opnieuw.",
          variant: "destructive"
        });
      }
    });
  };

  const handleManageSubscription = () => {
    openPortal(undefined, {
      onError: () => {
        toast({ 
          title: "Fout", 
          description: "Kon het portaal niet openen. Probeer het later opnieuw.",
          variant: "destructive"
        });
      }
    });
  };

  if (isLoading) return <div className="flex items-center justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>;

  const isPro = sub?.plan === "pro" && sub?.status === "active";

  return (
    <div className="space-y-8 pb-10">
      <div className="text-center max-w-2xl mx-auto space-y-4">
        <h1 className="text-4xl font-bold font-display tracking-tight">Simple Pricing</h1>
        <p className="text-muted-foreground text-lg">
          Choose the plan that fits your needs. Our Market Conform Abonnement gives you the best value.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto pt-8">
        <Card className={`relative ${!isPro ? "border-primary/50 shadow-md" : ""}`}>
          <CardHeader>
            <CardTitle className="text-2xl font-display">Free</CardTitle>
            <CardDescription>Perfect for roommates and casual trips.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-4xl font-bold">€0 <span className="text-base font-normal text-muted-foreground">/mo</span></p>
            <ul className="space-y-2 pt-4">
              <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> Track up to 3 groups</li>
              <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> Basic split types</li>
              <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> 1 month history</li>
            </ul>
          </CardContent>
          <CardFooter>
            <Button className="w-full" variant="outline" disabled={true}>
              {!isPro ? "Current Plan" : "Downgrade"}
            </Button>
          </CardFooter>
        </Card>

        <Card className={`relative overflow-hidden ${isPro ? "border-primary shadow-xl scale-105" : "bg-card"}`}>
          <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-bl-lg">
            RECOMMENDED
          </div>
          <CardHeader>
            <CardTitle className="text-2xl font-display flex items-center gap-2">
              Pro <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
            </CardTitle>
            <CardDescription>Power users & complex expense management.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-4xl font-bold">€2.99 <span className="text-base font-normal text-muted-foreground">/mo</span></p>
            <ul className="space-y-2 pt-4">
              <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> Unlimited groups</li>
              <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> Receipt scanning (OCR)</li>
              <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> Export to CSV/PDF</li>
              <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> Priority Support</li>
              <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> Bank Integration (Beta)</li>
            </ul>
          </CardContent>
          <CardFooter className="flex flex-col gap-2">
            {isPro ? (
              <Button 
                data-testid="button-manage-subscription"
                className="w-full"
                variant="outline"
                onClick={handleManageSubscription}
                disabled={isPortalPending}
              >
                {isPortalPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <ExternalLink className="mr-2 h-4 w-4" />
                Beheer abonnement
              </Button>
            ) : (
              <Button 
                data-testid="button-upgrade-pro"
                className="w-full"
                onClick={handleUpgrade}
                disabled={isPending}
              >
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Upgrade naar Pro
              </Button>
            )}
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
