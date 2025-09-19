import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useLanguage } from "@/contexts/LanguageContext";
import { Menu, X, Home, Trophy, Building, Users, Newspaper, User, LogOut, ChevronDown, UserPlus, Medal, Search } from "lucide-react";
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
import mttaLogo from "@assets/logoweb_1754749015700.png";

const isActive = (current: string, href: string) =>
  href === "/" ? current === "/" : current.startsWith(href);

export default function Navigation() {
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [location] = useLocation();
  const { user, isAuthenticated } = useAuth();
  const { t } = useLanguage();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);

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

  const navigationLinks = [
    {
      href: "/about",
      label: t('nav.about'),
      icon: User,
      dropdown: [
        {
          label: t('nav.federation'),
          sublinks: [
            { href: "/about#history", label: t('nav.introduction') },
            { href: "/about#goals", label: t('nav.goals') },
            { href: "/about#management", label: t('nav.history') },
            { href: "/about#leadership", label: t('nav.members') },
          ],
        },
        { href: "/branches", label: t('nav.branches') },
        { href: "/national-team", label: t('nav.nationalTeam') },
        { href: "/judges", label: t('nav.judges') },
        { href: "/past-champions", label: t('nav.pastChampions') },
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
                <img src={mttaLogo} alt="MTTA Logo" className="h-10 w-auto" />
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
                        <div className={`nav-link flex items-center space-x-2 px-4 py-2 cursor-pointer text-sm font-medium transition-colors ${
                          active ? 'active-nav-link' : ''
                        }`}>
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
                    <button className="btn-green text-sm px-4 py-2">
                      {t('nav.register')}
                    </button>
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
                  className="h-9 w-9 text-white hover:text-green-300"
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
                  className="lg:hidden text-white hover:text-mtta-green p-2"
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
              <img src={mttaLogo} alt="MTTA" className="h-7 sm:h-8" />
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
        <CommandInput placeholder="Хайх..." />
        <CommandList>
          <CommandEmpty>Илэрц олдсонгүй.</CommandEmpty>
          <CommandGroup>
            <CommandItem onSelect={() => { setShowSearch(false); window.location.href = "/"; }}>
              <Home className="mr-2 h-4 w-4" />
              <span>Нүүр хуудас</span>
            </CommandItem>
            <CommandItem onSelect={() => { setShowSearch(false); window.location.href = "/about"; }}>
              <User className="mr-2 h-4 w-4" />
              <span>Тэнцэрийн холбоо</span>
            </CommandItem>
            <CommandItem onSelect={() => { setShowSearch(false); window.location.href = "/tournaments"; }}>
              <Trophy className="mr-2 h-4 w-4" />
              <span>Тэмцээнүүд</span>
            </CommandItem>
            <CommandItem onSelect={() => { setShowSearch(false); window.location.href = "/clubs"; }}>
              <Building className="mr-2 h-4 w-4" />
              <span>Клубууд</span>
            </CommandItem>
            <CommandItem onSelect={() => { setShowSearch(false); window.location.href = "/news"; }}>
              <Newspaper className="mr-2 h-4 w-4" />
              <span>Мэдээ</span>
            </CommandItem>
            <CommandItem onSelect={() => { setShowSearch(false); window.location.href = "/branches"; }}>
              <Building className="mr-2 h-4 w-4" />
              <span>Салбарууд</span>
            </CommandItem>
            <CommandItem onSelect={() => { setShowSearch(false); window.location.href = "/national-team"; }}>
              <Users className="mr-2 h-4 w-4" />
              <span>Үндэсний шигшээ баг</span>
            </CommandItem>
            <CommandItem onSelect={() => { setShowSearch(false); window.location.href = "/judges"; }}>
              <User className="mr-2 h-4 w-4" />
              <span>Шүүгчид</span>
            </CommandItem>
            <CommandItem onSelect={() => { setShowSearch(false); window.location.href = "/past-champions"; }}>
              <Medal className="mr-2 h-4 w-4" />
              <span>Өмнөх аварагчид</span>
            </CommandItem>
            <CommandItem onSelect={() => { setShowSearch(false); window.location.href = "/register"; }}>
              <UserPlus className="mr-2 h-4 w-4" />
              <span>Бүртгүүлэх</span>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}