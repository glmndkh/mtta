import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/contexts/ThemeContext";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import Home from "@/pages/home";
import Login from "@/pages/login";
import Register from "@/pages/register";
import PlayerDashboard from "@/pages/player-dashboard";
import Tournaments from "@/pages/tournaments";
import Clubs from "@/pages/clubs";
import Leagues from "@/pages/leagues";
import LeagueDetails from "@/pages/league-details";
import News from "@/pages/news";
import NewsDetail from "@/pages/news-detail";
import Branches from "@/pages/branches";
import BranchDetails from "@/pages/branch-details";
import PastChampions from "@/pages/past-champions";
import JudgesPage from "@/pages/judges";
import AdminTournamentResults from "@/pages/admin-tournament-results";
import AdminTournaments from "@/pages/admin-tournaments";
import ExcelTournamentDemo from "@/pages/excel-tournament-demo";
import AdminTournamentCreate from "@/pages/admin-tournament-create";
import AdminTournamentGenerator from "@/pages/admin-tournament-generator";
import TournamentLanding from "@/pages/tournament-landing";
import TournamentPage from "@/pages/tournament-page";
import TournamentResults from "@/pages/tournament-results";
import TournamentFullInfo from "@/pages/tournament-full-info";
import Profile from "@/pages/profile";
import PlayerProfilePage from "@/pages/player-profile";
import AdminDashboard from "@/pages/admin-dashboard";
import TournamentManagement from "@/pages/tournament-management";
import AboutPage from "@/pages/about";
import { useAuth } from "@/hooks/useAuth";
import AdminPlayerDetailsPage from "@/pages/admin-player-details"; // Import the new page

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/tournament-landing" component={TournamentLanding} />
      <Route path="/tournament/:id" component={TournamentPage} />
      <Route path="/tournament/:id/results" component={TournamentResults} />
      <Route path="/tournament/:id/full" component={TournamentFullInfo} />
      <Route path="/player/:id" component={PlayerProfilePage} />
      <Route path="/tournaments" component={Tournaments} />
      <Route path="/clubs" component={Clubs} />
      <Route path="/leagues" component={Leagues} />
      <Route path="/leagues/:id" component={LeagueDetails} />
      <Route path="/branches" component={Branches} />
      <Route path="/branches/:id" component={BranchDetails} />
      <Route path="/past-champions" component={PastChampions} />
      <Route path="/judges" component={JudgesPage} />
      <Route path="/news/:id" component={NewsDetail} />
      <Route path="/news" component={News} />
      <Route path="/about" component={AboutPage} />
      <Route path="/" component={Home} />
      {!isLoading && isAuthenticated && (
        <>
          <Route path="/dashboard" component={PlayerDashboard} />
          <Route path="/profile" component={Profile} />
          <Route path="/admin/dashboard" component={AdminDashboard} />
          <Route path="/admin-dashboard" component={AdminDashboard} />
          <Route path="/admin" component={AdminDashboard} />
          <Route path="/admin/player/:id" component={AdminPlayerDetailsPage} />
          <Route path="/admin/tournament/:id/manage" component={TournamentManagement} />
          <Route path="/admin/tournament/:id/results" component={AdminTournamentResults} />
          <Route path="/admin/tournaments" component={AdminTournaments} />
          <Route path="/admin/league/:id/manage" component={TournamentManagement} />
          <Route path="/admin/generator" component={AdminTournamentGenerator} />
          <Route path="/admin/tournament-create" component={AdminTournamentGenerator} />
          <Route path="/excel-tournament-demo" component={ExcelTournamentDemo} />
        </>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <div className="glow-bg"></div>
          <div className="main-bg">
            <Toaster />
            <Router />
          </div>
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;