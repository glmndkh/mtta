import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useLanguage } from "@/contexts/LanguageContext";
import { Menu, X, Home, Trophy, Building, Users, Newspaper, User, LogOut, ChevronDown, UserPlus, Medal, Search, Loader2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
const isActive = (current: string, href: string) =>
  href === "/" ? current === "/" : current.startsWith(href);

const mttaLogo = "/mtta-logo.png";


type PlayerSearchResult = {
  id: string;
  userId: string;

  firstName: string | null;
  lastName: string | null;
  rank: string | null;
  clubName: string | null;
};

type TournamentSearchResult = {
  id: string;
  name: string;
  location: string | null;
  startDate: string | null;
  status: string | null;
};

type NewsSearchResult = {
  id: string;
  title: string;
  category: string | null;
  excerpt: string | null;
  publishedAt: string | null;
};

type ClubSearchResult = {
  id: string;
  name: string;
  province: string | null;
  city: string | null;
  district: string | null;
};

type BranchSearchResult = {
  id: string;
  name: string;
  leader: string | null;
  location: string | null;
};

type FederationMemberSearchResult = {
  id: string;
  name: string;
  position: string | null;
};

type JudgeSearchResult = {
  id: string;
  firstName: string;
  lastName: string;
  judgeType: string;
};

type NationalTeamPlayerSearchResult = {
  id: string;
  firstName: string;
  lastName: string;
  age: number | null;
};

type GlobalSearchResults = {
  players: PlayerSearchResult[];
  tournaments: TournamentSearchResult[];
  news: NewsSearchResult[];
  clubs: ClubSearchResult[];
  branches: BranchSearchResult[];
  federationMembers: FederationMemberSearchResult[];
  judges: JudgeSearchResult[];
  nationalTeamPlayers: NationalTeamPlayerSearchResult[];
};

const createEmptyResults = (): GlobalSearchResults => ({
  players: [],
  tournaments: [],
  news: [],
  clubs: [],
  branches: [],
  federationMembers: [],
  judges: [],
  nationalTeamPlayers: [],
});

export default function Navigation() {
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [location] = useLocation();
  const { user, isAuthenticated } = useAuth();
  const { t } = useLanguage();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<GlobalSearchResults>(() => createEmptyResults());
  const [searchLoading, setSearchLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  useEffect(() => {
    if (!showMobileMenu) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setShowMobileMenu(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [showMobileMenu]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setShowSearch((open) => !open);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);


  useEffect(() => {
    const prev = document.body.style.overflow;
    if (showMobileMenu) document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [showMobileMenu]);

  useEffect(() => {
    if (!showSearch) {
      setSearchQuery("");
      setSearchResults(createEmptyResults());
      setSearchError(null);
      setHasSearched(false);
      setSearchLoading(false);
    }
  }, [showSearch]);

  useEffect(() => {
    if (!showSearch) return;
    const trimmed = searchQuery.trim();

    if (trimmed.length < 2) {
      setHasSearched(false);
      setSearchResults(createEmptyResults());
      setSearchError(null);
      return;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => {
      setSearchLoading(true);
      fetch(`/api/search?q=${encodeURIComponent(trimmed)}`, {
        signal: controller.signal,
      })
        .then((response) => {
          if (!response.ok) {
            throw new Error(`Search failed with status ${response.status}`);
          }
          return response.json();
        })
        .then((data) => {
          setSearchResults({
            players: Array.isArray(data.players) ? data.players : [],
            tournaments: Array.isArray(data.tournaments) ? data.tournaments : [],
            news: Array.isArray(data.news) ? data.news : [],
            clubs: Array.isArray(data.clubs) ? data.clubs : [],
            branches: Array.isArray(data.branches) ? data.branches : [],
            federationMembers: Array.isArray(data.federationMembers) ? data.federationMembers : [],
            judges: Array.isArray(data.judges) ? data.judges : [],
            nationalTeamPlayers: Array.isArray(data.nationalTeamPlayers) ? data.nationalTeamPlayers : [],
          });
          setSearchError(null);
          setHasSearched(true);
        })
        .catch((error) => {
          if (error.name === "AbortError") return;
          console.error("Global search error:", error);
          setSearchError("Хайлт амжилтгүй боллоо. Дахин оролдоно уу.");
          setSearchResults(createEmptyResults());
          setHasSearched(true);
        })
        .finally(() => {
          setSearchLoading(false);
        });
    }, 250);

    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [searchQuery, showSearch]);

  const formatFullName = (firstName?: string | null, lastName?: string | null) =>
    `${firstName || ""} ${lastName || ""}`.trim() || "Нэр тодорхойгүй";

  const formatDate = (value?: string | null) => {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return date.toLocaleDateString("mn-MN");
  };

  const trimmedQuery = searchQuery.trim();
  const isQueryTooShort = trimmedQuery.length > 0 && trimmedQuery.length < 2;
  const showQuickLinks = trimmedQuery.length === 0;

  const navigationLinks = [
    {
      href: "/about",
      label: t('nav.about'),
      icon: User,
      dropdown: [
        { href: "/about/branches", label: "Салбар холбоо" },
        { href: "/about/intro", label: "Танилцуулга" },
        { href: "/history", label: "Бидний түүх" },
        { href: "/national-team", label: "Үндэсний шигшээ" },
        {
          label: "Зөвлөлүүд",
          sublinks: [
            { href: "/councils/coaches", label: "Дасгалжуулагчдын зөвлөл" },
            { href: "/councils/athletes", label: "Тамирчдын зөвлөл" },
            { href: "/councils/veterans", label: "Ахмадын зөвлөл" },
            { href: "/councils/referees", label: "Шүүгчдийн зөвлөл" },
            { href: "/councils/women", label: "Эмэгтэйчүүдийн зөвлөл" },
          ],
        },
      ],
    },
    { href: "/tournaments", label: t('nav.tournaments'), icon: Trophy },
    { href: "/clubs", label: t('nav.clubs'), icon: Building },
    { href: "/news", label: t('nav.news'), icon: Newspaper },
  ];

  // Drawer animation classes
  const drawerBase =
    "fixed top-0 right-0 h-full w-[280px] sm:w-[300px] bg-gray-900 shadow-xl overflow-y-auto z-[60] transition-transform duration-300 ease-in-out";
  const drawerState = showMobileMenu ? "translate-x-0" : "translate-x-full";

  return (
    <>
      <nav className="nav-dark sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link href="/">
              <div className="flex items-center cursor-pointer logo-glow flex-shrink-0">
                <img
                  src={mttaLogo}
                  alt="MTTA Logo"
                  className="h-16 w-auto object-contain"
                />
              </div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center space-x-8 flex-1 justify-center">
              {navigationLinks.map((link) => {
                const Icon = link.icon;
                const active = isActive(location, link.href);

                if (link.dropdown) {
                  return (
                    <DropdownMenu key={link.href}>
                      <DropdownMenuTrigger asChild>
                        <div 
                          className={`nav-link flex items-center space-x-2 px-4 py-2 cursor-pointer text-sm font-medium transition-colors ${
                            active ? 'active-nav-link' : ''
                          }`}
                          onMouseEnter={(e) => {
                            const trigger = e.currentTarget;
                            trigger.click();
                          }}
                        >
                          <Icon className="h-4 w-4" />
                          <span>{link.label}</span>
                          <ChevronDown className="h-3 w-3" />
                        </div>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="bg-gray-800 border-gray-700 min-w-[200px]">
                        {link.dropdown.map((subLink) => (
                          subLink.sublinks ? (
                            <DropdownMenuSub key={subLink.label}>
                              <DropdownMenuSubTrigger className="text-white hover:text-green-400 px-3 py-2.5 text-sm">
                                {subLink.label}
                              </DropdownMenuSubTrigger>
                              <DropdownMenuSubContent className="bg-gray-800 border-gray-700 min-w-[180px]">
                                {subLink.sublinks.map((item) => (
                                  <DropdownMenuItem key={item.href} asChild>
                                    <Link href={item.href}>
                                      <div className="text-white hover:text-green-400 w-full px-3 py-2.5 text-sm">
                                        {item.label}
                                      </div>
                                    </Link>
                                  </DropdownMenuItem>
                                ))}
                              </DropdownMenuSubContent>
                            </DropdownMenuSub>
                          ) : (
                            <DropdownMenuItem key={subLink.href} asChild>
                              <Link href={subLink.href}>
                                <div className="text-white hover:text-green-400 w-full px-3 py-2.5 text-sm">
                                  {subLink.label}
                                </div>
                              </Link>
                            </DropdownMenuItem>
                          )
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  );
                }

                return (
                  <Link key={link.href} href={link.href}>
                    <div className={`nav-link flex items-center space-x-2 px-4 py-2 cursor-pointer text-sm font-medium transition-colors ${
                      active ? 'active-nav-link' : ''
                    }`}>
                      <Icon className="h-4 w-4" />
                      <span>{link.label}</span>
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* Right side - User Menu & Controls */}
            <div className="flex items-center space-x-4 flex-shrink-0">
              {/* Desktop User Menu */}
              {isAuthenticated && user ? (
                <div className="hidden lg:flex items-center space-x-4">
                  {(user as any).role === 'admin' && (
                    <Link href="/admin/dashboard">
                      <div className="nav-link flex items-center space-x-2 px-3 py-2 cursor-pointer text-sm">
                        <User className="h-4 w-4" />
                        <span>{t('nav.admin')}</span>
                      </div>
                    </Link>
                  )}
                  <Link href="/profile">
                    <div className="nav-link flex items-center space-x-2 px-3 py-2 cursor-pointer text-sm">
                      <User className="h-4 w-4" />
                      <span>{(user as any).firstName}</span>
                    </div>
                  </Link>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => window.location.href = '/api/logout'}
                    className="nav-link hover:text-red-400 text-sm px-3 py-2"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    {t('nav.logout')}
                  </Button>
                </div>
              ) : (
                <div className="hidden lg:flex items-center space-x-3">
                  <Link href="/register">
                    <Button className="bg-green-600 hover:bg-green-700 text-white text-sm px-4 py-2">
                      {t('nav.register')}
                    </Button>
                  </Link>
                  <Link href="/login">
                    <button className="btn-green text-sm px-4 py-2">
                      {t('nav.login')}
                    </button>
                  </Link>
                </div>
              )}

              {/* Controls */}
              <div className="flex items-center space-x-2">
                <LanguageSwitcher />
                <ThemeToggle />

                {/* Search button */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowSearch(true)}
                  className="h-9 w-9 text-slate-900 hover:text-green-600 dark:text-white dark:hover:text-green-300"
                  data-testid="search-toggle"
                  title="Search"
                >
                  <Search className="h-4 w-4" />
                </Button>

                {/* Mobile menu button */}
                <Button
                  ref={triggerRef}
                  variant="ghost"
                  size="sm"
                  className="lg:hidden p-2 text-slate-900 hover:text-mtta-green dark:text-white"
                  onClick={() => setShowMobileMenu((v) => !v)}
                  data-testid="mobile-menu-toggle"
                >
                  {showMobileMenu ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile menu overlay - moved outside nav to cover entire viewport */}
      {showMobileMenu && (
        <div
          className="fixed inset-0 bg-black/75 z-50 md:hidden"
          onClick={() => setShowMobileMenu(false)}
        >
          <div
            ref={drawerRef}
            role="dialog"
            aria-modal="true"
            aria-label="Навигацийн цэс"
            className={`${drawerBase} ${drawerState}`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header with logo and close button */}
            <div className="flex items-center justify-between p-3 sm:p-4 bg-gray-800 border-b border-gray-700">
              <img 
                src={mttaLogo} 
                alt="MTTA" 
                className="h-12 sm:h-16 w-auto object-contain"
              />
              <button
                onClick={() => setShowMobileMenu(false)}
                className="text-white p-2 hover:bg-gray-700 rounded min-w-[44px] min-h-[44px] flex items-center justify-center"
                data-testid="mobile-menu-close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Navigation menu items */}
            <div className="py-4">
              {navigationLinks.map((link) => {
                const Icon = link.icon;
                const active = isActive(location, link.href);

                if (link.dropdown) {
                  return (
                    <div key={link.href}>
                      <Link href={link.href}>
                        <div
                          onClick={() => setShowMobileMenu(false)}
                          className={`flex items-center px-4 sm:px-6 py-4 text-white border-b border-gray-800 hover:bg-gray-800 min-h-[48px] ${
                            active ? 'bg-green-900 text-green-400' : ''
                          }`}
                        >
                          <Icon className="h-5 w-5 mr-3" />
                          <span className="text-base">{link.label}</span>
                        </div>
                      </Link>
                      {/* Mobile submenu */}
                      <div className="bg-gray-800">
                        {link.dropdown.map((subLink) => (
                          subLink.sublinks ? (
                            <div key={subLink.label} className="border-b border-gray-700">
                              <div className="flex items-center px-8 sm:px-12 py-3 text-gray-300 min-h-[44px]">
                                <span className="text-sm font-medium">{subLink.label}</span>
                              </div>
                              <div className="bg-gray-700">
                                {subLink.sublinks.map((item) => (
                                  <Link key={item.href} href={item.href}>
                                    <div
                                      onClick={() => setShowMobileMenu(false)}
                                      className="flex items-center px-10 sm:px-16 py-3 text-gray-300 hover:bg-gray-600 hover:text-white border-t border-gray-600 min-h-[44px]"
                                    >
                                      <span className="text-sm">{item.label}</span>
                                    </div>
                                  </Link>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <Link key={subLink.href} href={subLink.href}>
                              <div
                                onClick={() => setShowMobileMenu(false)}
                                className="flex items-center px-8 sm:px-12 py-3 text-gray-300 hover:bg-gray-700 hover:text-white border-b border-gray-700 min-h-[44px]"
                              >
                                <span className="text-sm">{subLink.label}</span>
                              </div>
                            </Link>
                          )
                        ))}
                      </div>
                    </div>
                  );
                }

                return (
                  <Link key={link.href} href={link.href}>
                    <div
                      onClick={() => setShowMobileMenu(false)}
                      className={`flex items-center px-6 py-4 text-white border-b border-gray-800 hover:bg-gray-800 ${
                        active ? 'bg-green-900 text-green-400' : ''
                      }`}
                    >
                      <Icon className="h-5 w-5 mr-3" />
                      <span className="text-base">{link.label}</span>
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* User section at bottom */}
            <div className="mt-4 sm:mt-8 border-t border-gray-700 bg-gray-800">
              {isAuthenticated && user ? (
                <div className="p-3 sm:p-4 space-y-2 sm:space-y-3">
                  {(user as any).role === 'player' && (
                    <Link href="/profile">
                      <div
                        onClick={() => setShowMobileMenu(false)}
                        className="flex items-center text-white p-3 rounded hover:bg-gray-700 min-h-[48px]"
                      >
                        <User className="h-4 w-4 mr-3" />
                        <span className="text-base">{t('nav.profile')}</span>
                      </div>
                    </Link>
                  )}

                  {(user as any)?.role === 'admin' && (
                    <>
                      <Link href="/admin/dashboard">
                        <div
                          onClick={() => setShowMobileMenu(false)}
                          className="flex items-center text-white p-3 rounded hover:bg-gray-700 min-h-[48px]"
                        >
                          <User className="h-4 w-4 mr-3" />
                          <span className="text-base">{t('nav.admin')}</span>
                        </div>
                      </Link>
                      <Link href="/admin/generator">
                        <div
                          onClick={() => setShowMobileMenu(false)}
                          className="flex items-center text-white p-3 rounded hover:bg-gray-700 min-h-[48px]"
                        >
                          <Trophy className="h-4 w-4 mr-3" />
                          <span className="text-base">{t('nav.createTournament')}</span>
                        </div>
                      </Link>
                    </>
                  )}

                  <button
                    onClick={() => {
                      setShowMobileMenu(false);
                      window.location.href = '/api/logout';
                    }}
                    className="flex items-center text-red-400 p-3 rounded hover:bg-red-900 hover:bg-opacity-20 w-full min-h-[48px]"
                    data-testid="mobile-logout-button"
                  >
                    <LogOut className="h-4 w-4 mr-3" />
                    <span className="text-base">{t('nav.logout')}</span>
                  </button>
                </div>
              ) : (
                <div className="p-4 space-y-3">
                  <Link href="/register">
                    <button
                      onClick={() => setShowMobileMenu(false)}
                      className="w-full py-3 text-green-400 border border-green-400 rounded hover:bg-green-400 hover:text-black"
                    >
                      {t('nav.register')}
                    </button>
                  </Link>
                  <Link href="/login">
                    <button
                      onClick={() => setShowMobileMenu(false)}
                      className="w-full py-3 bg-green-400 text-black rounded hover:bg-green-500"
                    >
                      {t('nav.login')}
                    </button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Global Search Dialog */}
      <CommandDialog open={showSearch} onOpenChange={setShowSearch}>
        <CommandInput
          placeholder="Хайх..."
          value={searchQuery}
          onValueChange={setSearchQuery}
        />
        <CommandList>
          <CommandEmpty>
            {searchLoading
              ? "Хайлтыг ачааллаж байна..."
              : isQueryTooShort
                ? "Хайлт хийхийн тулд дор хаяж 2 тэмдэгт оруулна уу."
                : "Илэрц олдсонгүй."}
          </CommandEmpty>

          {searchLoading && (
            <CommandGroup heading="Хайлт">
              <CommandItem value="loading" disabled>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                <span>Хайлтыг ачааллаж байна...</span>
              </CommandItem>
            </CommandGroup>
          )}

          {searchError && (
            <CommandGroup heading="Алдаа">
              <CommandItem value="error" disabled>
                <span className="text-red-400">{searchError}</span>
              </CommandItem>
            </CommandGroup>
          )}

          {hasSearched && !searchLoading && !searchError && (
            <>
              {searchResults.players.length > 0 && (
                <CommandGroup heading="Тоглогчид">
                  {searchResults.players.map((player) => {
                    const fullName = formatFullName(player.firstName, player.lastName);
                    const meta = [player.rank, player.clubName].filter(Boolean).join(" • ");
                    return (
                      <CommandItem
                        key={`player-${player.id}`}
                        value={`player ${fullName} ${meta}`}
                        onSelect={() => {
                          setShowSearch(false);
                          window.location.href = `/player/${player.id}`;
                        }}
                      >
                        <User className="mr-2 h-4 w-4" />
                        <div className="flex flex-col">
                          <span>{fullName}</span>
                          {meta && (
                            <span className="text-xs text-muted-foreground">{meta}</span>
                          )}
                        </div>
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              )}

              {searchResults.tournaments.length > 0 && (
                <CommandGroup heading="Тэмцээнүүд">
                  {searchResults.tournaments.map((tournament) => {
                    const info = [tournament.location, formatDate(tournament.startDate)].filter(Boolean).join(" • ");
                    return (
                      <CommandItem
                        key={`tournament-${tournament.id}`}
                        value={`tournament ${tournament.name} ${info}`}
                        onSelect={() => {
                          setShowSearch(false);
                          window.location.href = `/tournament/${tournament.id}`;
                        }}
                      >
                        <Trophy className="mr-2 h-4 w-4" />
                        <div className="flex flex-col">
                          <span>{tournament.name}</span>
                          {info && (
                            <span className="text-xs text-muted-foreground">{info}</span>
                          )}
                        </div>
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              )}

              {searchResults.news.length > 0 && (
                <CommandGroup heading="Мэдээ">
                  {searchResults.news.map((item) => {
                    const info = [item.category, formatDate(item.publishedAt)].filter(Boolean).join(" • ");
                    return (
                      <CommandItem
                        key={`news-${item.id}`}
                        value={`news ${item.title} ${info}`}
                        onSelect={() => {
                          setShowSearch(false);
                          window.location.href = `/news/${item.id}`;
                        }}
                      >
                        <Newspaper className="mr-2 h-4 w-4" />
                        <div className="flex flex-col">
                          <span>{item.title}</span>
                          {info && (
                            <span className="text-xs text-muted-foreground">{info}</span>
                          )}
                        </div>
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              )}

              {searchResults.clubs.length > 0 && (
                <CommandGroup heading="Клубууд">
                  {searchResults.clubs.map((club) => {
                    const locationLabel = [club.province, club.city].filter(Boolean).join(", ");
                    return (
                      <CommandItem
                        key={`club-${club.id}`}
                        value={`club ${club.name} ${locationLabel}`}
                        onSelect={() => {
                          setShowSearch(false);
                          const params = new URLSearchParams();
                          params.set("q", club.name);
                          window.location.href = `/clubs?${params.toString()}`;
                        }}
                      >
                        <Building className="mr-2 h-4 w-4" />
                        <div className="flex flex-col">
                          <span>{club.name}</span>
                          {locationLabel && (
                            <span className="text-xs text-muted-foreground">{locationLabel}</span>
                          )}
                        </div>
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              )}

              {searchResults.branches.length > 0 && (
                <CommandGroup heading="Салбарууд">
                  {searchResults.branches.map((branch) => {
                    const info = [branch.leader, branch.location].filter(Boolean).join(" • ");
                    return (
                      <CommandItem
                        key={`branch-${branch.id}`}
                        value={`branch ${branch.name} ${info}`}
                        onSelect={() => {
                          setShowSearch(false);
                          window.location.href = `/branch-details/${branch.id}`;
                        }}
                      >
                        <Building className="mr-2 h-4 w-4" />
                        <div className="flex flex-col">
                          <span>{branch.name}</span>
                          {info && (
                            <span className="text-xs text-muted-foreground">{info}</span>
                          )}
                        </div>
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              )}

              {searchResults.federationMembers.length > 0 && (
                <CommandGroup heading="Холбооны гишүүд">
                  {searchResults.federationMembers.map((member) => {
                    const info = member.position || "";
                    return (
                      <CommandItem
                        key={`federation-${member.id}`}
                        value={`federation ${member.name} ${info}`}
                        onSelect={() => {
                          setShowSearch(false);
                          window.location.href = "/about#leadership";
                        }}
                      >
                        <Users className="mr-2 h-4 w-4" />
                        <div className="flex flex-col">
                          <span>{member.name}</span>
                          {info && (
                            <span className="text-xs text-muted-foreground">{info}</span>
                          )}
                        </div>
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              )}

              {searchResults.judges.length > 0 && (
                <CommandGroup heading="Шүүгчид">
                  {searchResults.judges.map((judge) => {
                    const fullName = formatFullName(judge.firstName, judge.lastName);
                    const typeLabel = judge.judgeType === "international" ? "Олон улсын шүүгч" : "Дотоодын шүүгч";
                    return (
                      <CommandItem
                        key={`judge-${judge.id}`}
                        value={`judge ${fullName} ${typeLabel}`}
                        onSelect={() => {
                          setShowSearch(false);
                          const params = new URLSearchParams();
                          params.set("type", judge.judgeType);
                          window.location.href = `/judges?${params.toString()}`;
                        }}
                      >
                        <User className="mr-2 h-4 w-4" />
                        <div className="flex flex-col">
                          <span>{fullName}</span>
                          {typeLabel && (
                            <span className="text-xs text-muted-foreground">{typeLabel}</span>
                          )}
                        </div>
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              )}

              {searchResults.nationalTeamPlayers.length > 0 && (
                <CommandGroup heading="Үндэсний шигшээ баг">
                  {searchResults.nationalTeamPlayers.map((player) => {
                    const fullName = formatFullName(player.firstName, player.lastName);
                    const info = typeof player.age === "number" && player.age > 0 ? `${player.age} нас` : "";
                    return (
                      <CommandItem
                        key={`national-${player.id}`}
                        value={`national ${fullName} ${info}`}
                        onSelect={() => {
                          setShowSearch(false);
                          window.location.href = "/national-team";
                        }}
                      >
                        <Users className="mr-2 h-4 w-4" />
                        <div className="flex flex-col">
                          <span>{fullName}</span>
                          {info && (
                            <span className="text-xs text-muted-foreground">{info}</span>
                          )}
                        </div>
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              )}

            </>
          )}

          {showQuickLinks && (
            <>
              <CommandGroup heading="Шуурхай холбоос">
                <CommandItem value="home" onSelect={() => { setShowSearch(false); window.location.href = "/"; }}>
                  <Home className="mr-2 h-4 w-4" />
                  <span>Нүүр хуудас</span>
                </CommandItem>
                <CommandItem value="about" onSelect={() => { setShowSearch(false); window.location.href = "/about"; }}>
                  <User className="mr-2 h-4 w-4" />
                  <span>Тэнцэрийн холбоо</span>
                </CommandItem>
                <CommandItem value="tournaments" onSelect={() => { setShowSearch(false); window.location.href = "/tournaments"; }}>
                  <Trophy className="mr-2 h-4 w-4" />
                  <span>Тэмцээнүүд</span>
                </CommandItem>
                <CommandItem value="clubs" onSelect={() => { setShowSearch(false); window.location.href = "/clubs"; }}>
                  <Building className="mr-2 h-4 w-4" />
                  <span>Клубууд</span>
                </CommandItem>
                <CommandItem value="news" onSelect={() => { setShowSearch(false); window.location.href = "/news"; }}>
                  <Newspaper className="mr-2 h-4 w-4" />
                  <span>Мэдээ</span>
                </CommandItem>
                <CommandItem value="branches" onSelect={() => { setShowSearch(false); window.location.href = "/branches"; }}>
                  <Building className="mr-2 h-4 w-4" />
                  <span>Салбарууд</span>
                </CommandItem>
                <CommandItem value="national-team" onSelect={() => { setShowSearch(false); window.location.href = "/national-team"; }}>
                  <Users className="mr-2 h-4 w-4" />
                  <span>Үндэсний шигшээ баг</span>
                </CommandItem>
                <CommandItem value="judges" onSelect={() => { setShowSearch(false); window.location.href = "/judges"; }}>
                  <User className="mr-2 h-4 w-4" />
                  <span>Шүүгчид</span>
                </CommandItem>
                <CommandItem value="past-champions" onSelect={() => { setShowSearch(false); window.location.href = "/past-champions"; }}>
                  <Medal className="mr-2 h-4 w-4" />
                  <span>Өмнөх аварагчид</span>
                </CommandItem>
                <CommandItem value="register" onSelect={() => { setShowSearch(false); window.location.href = "/register"; }}>
                  <UserPlus className="mr-2 h-4 w-4" />
                  <span>Бүртгүүлэх</span>
                </CommandItem>
              </CommandGroup>
            </>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
}