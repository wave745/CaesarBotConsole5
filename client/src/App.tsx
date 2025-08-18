import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Layout } from "@/components/Layout";
import { Dashboard } from "@/pages/Dashboard";
import { Deploy } from "@/pages/Deploy";
import { Sniper } from "@/pages/Sniper";
import { WalletOps } from "@/pages/WalletOps";
import { Scanner } from "@/pages/Scanner";
import { Rewards } from "@/pages/Rewards";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/deploy" component={Deploy} />
        <Route path="/ai-trading" component={Dashboard} />
        <Route path="/sniper" component={Sniper} />
        <Route path="/wallet-ops" component={WalletOps} />
        <Route path="/scanner" component={Scanner} />
        <Route path="/rewards" component={Rewards} />
        <Route path="/tools" component={Dashboard} />
        <Route path="/settings" component={Dashboard} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
