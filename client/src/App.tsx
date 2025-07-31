import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import AuthLanding from "@/pages/auth-landing";
import Landing from "@/pages/landing";
import Home from "@/pages/home";
import PlayerDashboard from "@/pages/player-dashboard";
import Tournaments from "@/pages/tournaments";
import Clubs from "@/pages/clubs";
import Leagues from "@/pages/leagues";
import News from "@/pages/news";
import AdminTournamentResults from "@/pages/admin-tournament-results";
import AdminTournamentCreate from "@/pages/admin-tournament-create";
import AdminTournamentGenerator from "@/pages/admin-tournament-generator";
import TournamentLanding from "@/pages/tournament-landing";
import TournamentPage from "@/pages/tournament-page";
import { useAuth } from "@/hooks/useAuth";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <Switch>
      <Route path="/tournament-landing" component={TournamentLanding} />
      <Route path="/tournament/:id" component={TournamentPage} />
      <Route path="/admin/generator" component={AdminTournamentGenerator} />
      {isLoading ? (
        <Route path="/" component={() => (
          <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Ачааллаж байна...</p>
            </div>
          </div>
        )} />
      ) : !isAuthenticated ? (
        <>
          <Route path="/" component={Landing} />
          <Route path="/auth" component={AuthLanding} />
        </>
      ) : (
        <>
          <Route path="/" component={Home} />
          <Route path="/home" component={Home} />
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
