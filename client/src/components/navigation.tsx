import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { Menu, X, Home, Trophy, Building, Users, Newspaper, User, LogOut } from "lucide-react";
import mttaLogo from "@assets/logo.svg";

export default function Navigation() {
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [location] = useLocation();
  const { user, isAuthenticated } = useAuth();

  const navigationLinks = [
    { href: "/", label: "Нүүр хуудас", icon: Home },
    { href: "/tournaments", label: "Тэмцээн", icon: Trophy },
    { href: "/clubs", label: "Клубууд", icon: Building },
    { href: "/leagues", label: "Лиг", icon: Users },
    { href: "/news", label: "Мэдээ", icon: Newspaper },
  ];

  return (
    <nav className="nav-dark">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/">
            <div className="flex items-center cursor-pointer logo-glow">
              <img src={mttaLogo} alt="MTTA Logo" className="h-12 w-auto" />
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            {navigationLinks.map((link) => {
              const Icon = link.icon;
              const isActive = location === link.href;
              return (
                <Link key={link.href} href={link.href}>
                  <div className={`nav-link flex items-center space-x-1 px-3 py-2 cursor-pointer ${
                    isActive ? 'active-nav-link' : ''
                  }`}>
                    <Icon className="h-4 w-4" />
                    <span>{link.label}</span>
                  </div>
                </Link>
              );
            })}
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
                        (user as any).role === 'club_owner' ? 'Клубын эзэн' :
                        (user as any).role === 'score_recorder' ? 'Оноо бүртгэгч' : 'Хэрэглэгч'
                      })</span>
                    </div>
                  </Link>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => window.location.href = '/api/logout'}
                  className="nav-link hover:text-red-400"
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

            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden text-gray-600"
              onClick={() => setShowMobileMenu(!showMobileMenu)}
            >
              {showMobileMenu ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {showMobileMenu && (
        <div className="md:hidden bg-white border-t">
          <div className="px-4 py-3 space-y-2">
            {navigationLinks.map((link) => {
              const Icon = link.icon;
              const isActive = location === link.href;
              return (
                <Link key={link.href} href={link.href}>
                  <div 
                    className={`flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer ${
                      isActive 
                        ? 'text-mtta-green bg-green-50' 
                        : 'text-gray-700 hover:text-mtta-green hover:bg-gray-50'
                    }`}
                    onClick={() => setShowMobileMenu(false)}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{link.label}</span>
                  </div>
                </Link>
              );
            })}

            {isAuthenticated && user ? (
              <>
                {(user as any).role === 'player' && (
                  <Link href="/dashboard">
                    <div 
                      className="flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-mtta-green hover:bg-gray-50 cursor-pointer"
                      onClick={() => setShowMobileMenu(false)}
                    >
                      <User className="h-4 w-4" />
                      <span>Миний профайл</span>
                    </div>
                  </Link>
                )}

                {/* Admin-only mobile menu items */}
                {(user as any)?.role === 'admin' && (
                  <>
                    <Link href="/admin/generator">
                      <div 
                        className="flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-mtta-green hover:bg-gray-50 cursor-pointer"
                        onClick={() => setShowMobileMenu(false)}
                      >
                        <Trophy className="h-4 w-4" />
                        <span>Тэмцээн Үүсгэх</span>
                      </div>
                    </Link>
                    <Link href="/admin/tournament-results">
                      <div 
                        className="flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-mtta-green hover:bg-gray-50 cursor-pointer"
                        onClick={() => setShowMobileMenu(false)}
                      >
                        <Trophy className="h-4 w-4" />
                        <span>Тэмцээний Үр Дүн</span>
                      </div>
                    </Link>
                  </>
                )}
                <button
                  onClick={() => {
                    setShowMobileMenu(false);
                    window.location.href = '/api/logout';
                  }}
                  className="flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-red-600 hover:bg-gray-50 w-full"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Гарах</span>
                </button>
              </>
            ) : (
              <div className="space-y-2">
                <Link href="/register">
                  <button
                    onClick={() => setShowMobileMenu(false)}
                    className="flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium border border-mtta-green text-mtta-green hover:bg-mtta-green hover:text-white w-full"
                  >
                    <span>Бүртгүүлэх</span>
                  </button>
                </Link>
                <Link href="/login">
                  <button
                    onClick={() => setShowMobileMenu(false)}
                    className="flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium text-white bg-mtta-green hover:bg-mtta-green-dark w-full"
                  >
                    <span>Нэвтрэх</span>
                  </button>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}