import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import Home from "@/pages/home";
import Login from "@/pages/login";
import Register from "@/pages/register";
import PlayerDashboard from "@/pages/player-dashboard";
import Tournaments from "@/pages/tournaments";
import Clubs from "@/pages/clubs";
import Leagues from "@/pages/leagues";
import News from "@/pages/news";
import AdminTournamentResults from "@/pages/admin-tournament-results";
import AdminTournamentCreate from "@/pages/admin-tournament-create";
import { useAuth } from "@/hooks/useAuth";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      {isLoading || !isAuthenticated ? (
        <Route path="/" component={Landing} />
      ) : (
        <>
          <Route path="/" component={Home} />
          <Route path="/dashboard" component={PlayerDashboard} />
          <Route path="/tournaments" component={Tournaments} />
          <Route path="/clubs" component={Clubs} />
          <Route path="/leagues" component={Leagues} />
          <Route path="/news" component={News} />
          <Route path="/admin/tournament-results" component={AdminTournamentResults} />
          <Route path="/admin/tournament-create" component={AdminTournamentCreate} />
        </>
      )}
      <Route component={NotFound} />
    </Switch>
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
