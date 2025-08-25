import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Menu, X, Home, Trophy, Building, Users, Newspaper, User, LogOut, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu";
import mttaLogo from "@assets/logoweb_1754749015700.png";

const isActive = (current: string, href: string) =>
  href === "/" ? current === "/" : current.startsWith(href);

export default function Navigation() {
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [location] = useLocation();
  const { user, isAuthenticated } = useAuth();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showMobileMenu) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setShowMobileMenu(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [showMobileMenu]);

  useEffect(() => {
    const prev = document.body.style.overflow;
    if (showMobileMenu) document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [showMobileMenu]);

  const navigationLinks = [
    {
      href: "/about",
      label: "Бидний тухай",
      icon: User,
      dropdown: [
        {
          label: "Холбоо",
          sublinks: [
            { href: "/about#history", label: "Танилцуулга" },
            { href: "/about#goals", label: "Бидний зорилго" },
            { href: "/about#management", label: "Түүхэн замнал" },
            { href: "/about#leadership", label: "Холбооны гишүүд" },
          ],
        },
        { href: "/branches", label: "Салбар холбоод" },
        { href: "/national-team", label: "Үндэсний шигшээ" },
        { href: "/judges", label: "Шүүгчид" },
        { href: "/past-champions", label: "Үе үеийн аваргууд" },
      ],
    },
    { href: "/tournaments", label: "Тэмцээн", icon: Trophy },
    { href: "/clubs", label: "Клубууд", icon: Building },
    { href: "/leagues", label: "Лиг", icon: Users },
    { href: "/news", label: "Мэдээ", icon: Newspaper },
  ];

  // Drawer animation classes
  const drawerBase =
    "fixed top-0 right-0 h-full w-[300px] bg-gray-900 shadow-xl overflow-y-auto z-[60] transition-transform duration-200";
  const drawerState = showMobileMenu ? "translate-x-0" : "translate-x-full";

  return (
    <>
      <nav className="nav-dark sticky top-0 z-50">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/">
            <div className="flex items-center cursor-pointer logo-glow">
              <img src={mttaLogo} alt="MTTA Logo" className="h-10 w-auto max-w-[120px]" />
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            {navigationLinks.map((link) => {
              const Icon = link.icon;
              const active = isActive(location, link.href);

              if (link.dropdown) {
                return (
                  <DropdownMenu key={link.href}>
                    <DropdownMenuTrigger asChild>
                      <div className={`nav-link flex items-center space-x-1 px-3 py-2 cursor-pointer ${
                        active ? 'active-nav-link' : ''
                      }`}>
                        <Icon className="h-4 w-4" />
                        <span>{link.label}</span>
                        <ChevronDown className="h-3 w-3 ml-1" />
                      </div>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="bg-gray-800 border-gray-700">
                      {link.dropdown.map((subLink) => (
                        subLink.sublinks ? (
                          <DropdownMenuSub key={subLink.label}>
                            <DropdownMenuSubTrigger className="text-white hover:text-green-400 px-2 py-1">
                              {subLink.label}
                            </DropdownMenuSubTrigger>
                            <DropdownMenuSubContent className="bg-gray-800 border-gray-700">
                              {subLink.sublinks.map((item) => (
                                <DropdownMenuItem key={item.href} asChild>
                                  <Link href={item.href}>
                                    <div className="text-white hover:text-green-400 w-full px-2 py-1">
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
                              <div className="text-white hover:text-green-400 w-full px-2 py-1">
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
                  <div className={`nav-link flex items-center space-x-1 px-3 py-2 cursor-pointer ${
                    active ? 'active-nav-link' : ''
                  }`}>
                    <Icon className="h-4 w-4" />
                    <span>{link.label}</span>
                  </div>
                </Link>
              );
            })}
            {/* Add branch map navigation link */}
            <Link href="/branch-map" className="text-sm font-medium transition-colors hover:text-primary">
              🗺️ Салбарын газрын зураг
            </Link>
          </div>

          {/* User Menu & Mobile Toggle */}
          <div className="flex items-center space-x-4">
            {isAuthenticated && user ? (
              <div className="hidden md:flex items-center space-x-4">
                {(user as any).role === 'player' ? (
                  <>
                    <Link href="/profile">
                      <div className="nav-link flex items-center space-x-2 px-3 py-2 cursor-pointer">
                        <User className="h-4 w-4" />
                        <span>{(user as any).firstName}</span>
                      </div>
                    </Link>
                  </>
                ) : (user as any).role === 'admin' ? (
                  <>
                    <Link href="/admin/dashboard">
                      <div className="nav-link flex items-center space-x-2 px-3 py-2 cursor-pointer">
                        <User className="h-4 w-4" />
                        <span>Админ самбар</span>
                      </div>
                    </Link>
                    <Link href="/profile">
                      <div className="nav-link flex items-center space-x-2 px-3 py-2 cursor-pointer">
                        <User className="h-4 w-4" />
                        <span>{(user as any).firstName} (Админ)</span>
                      </div>
                    </Link>
                  </>
                ) : (
                  <Link href="/profile">
                    <div className="nav-link flex items-center space-x-2 px-3 py-2 cursor-pointer">
                      <User className="h-4 w-4" />
                      <span>{(user as any).firstName} ({
                        (user as any).role === 'score_recorder' ? 'Оноо бүртгэгч' : 'Хэрэглэгч'
                      })</span>
                    </div>
                  </Link>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => window.location.href = '/api/logout'}
                  className="nav-link hover:text-red-400 text-sm px-2 py-1"
                >
                  <LogOut className="h-4 w-4 mr-1" />
                  Гарах
                </Button>
              </div>
            ) : (
              <div className="hidden md:flex items-center space-x-2">
                <Link href="/register">
                  <button className="btn-green">
                    Бүртгүүлэх
                  </button>
                </Link>
                <Link href="/login">
                  <button className="btn-green">
                    Нэвтрэх
                  </button>
                </Link>
              </div>
            )}

            {/* Theme Toggle */}
            <ThemeToggle />

            {/* Mobile menu button */}
            <Button
              ref={triggerRef}
              variant="ghost"
              size="sm"
              className="md:hidden text-white hover:text-mtta-green"
              onClick={() => setShowMobileMenu((v) => !v)}
            >
              {showMobileMenu ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
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
            <div className="flex items-center justify-between p-4 bg-gray-800 border-b border-gray-700">
              <img src={mttaLogo} alt="MTTA" className="h-8" />
              <button
                onClick={() => setShowMobileMenu(false)}
                className="text-white p-2 hover:bg-gray-700 rounded"
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
                          className={`flex items-center px-6 py-4 text-white border-b border-gray-800 hover:bg-gray-800 ${
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
                              <div className="flex items-center px-12 py-3 text-gray-300">
                                <span className="text-sm">{subLink.label}</span>
                              </div>
                              <div className="bg-gray-700">
                                {subLink.sublinks.map((item) => (
                                  <Link key={item.href} href={item.href}>
                                    <div
                                      onClick={() => setShowMobileMenu(false)}
                                      className="flex items-center px-16 py-3 text-gray-300 hover:bg-gray-600 hover:text-white border-t border-gray-600"
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
                                className="flex items-center px-12 py-3 text-gray-300 hover:bg-gray-700 hover:text-white border-b border-gray-700"
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
            <div className="mt-8 border-t border-gray-700 bg-gray-800">
              {isAuthenticated && user ? (
                <div className="p-4 space-y-3">
                  {(user as any).role === 'player' && (
                    <Link href="/profile">
                      <div
                        onClick={() => setShowMobileMenu(false)}
                        className="flex items-center text-white p-3 rounded hover:bg-gray-700"
                      >
                        <User className="h-4 w-4 mr-3" />
                        <span>Миний профайл</span>
                      </div>
                    </Link>
                  )}

                  {(user as any)?.role === 'admin' && (
                    <>
                      <Link href="/admin/dashboard">
                        <div
                          onClick={() => setShowMobileMenu(false)}
                          className="flex items-center text-white p-3 rounded hover:bg-gray-700"
                        >
                          <User className="h-4 w-4 mr-3" />
                          <span>Админ самбар</span>
                        </div>
                      </Link>
                      <Link href="/admin/generator">
                        <div
                          onClick={() => setShowMobileMenu(false)}
                          className="flex items-center text-white p-3 rounded hover:bg-gray-700"
                        >
                          <Trophy className="h-4 w-4 mr-3" />
                          <span>Тэмцээн үүсгэх</span>
                        </div>
                      </Link>
                    </>
                  )}

                  <button
                    onClick={() => {
                      setShowMobileMenu(false);
                      window.location.href = '/api/logout';
                    }}
                    className="flex items-center text-red-400 p-3 rounded hover:bg-red-900 hover:bg-opacity-20 w-full"
                  >
                    <LogOut className="h-4 w-4 mr-3" />
                    <span>Гарах</span>
                  </button>
                </div>
              ) : (
                <div className="p-4 space-y-3">
                  <Link href="/register">
                    <button
                      onClick={() => setShowMobileMenu(false)}
                      className="w-full py-3 text-green-400 border border-green-400 rounded hover:bg-green-400 hover:text-black"
                    >
                      Бүртгүүлэх
                    </button>
                  </Link>
                  <Link href="/login">
                    <button
                      onClick={() => setShowMobileMenu(false)}
                      className="w-full py-3 bg-green-400 text-black rounded hover:bg-green-500"
                    >
                      Нэвтрэх
                    </button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}