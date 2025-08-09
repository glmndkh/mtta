import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { Menu, X, Home, Trophy, Building, Users, Newspaper, User, LogOut } from "lucide-react";
import mttaLogo from "@assets/logoweb_1754749015700.png";

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
              <img src={mttaLogo} alt="MTTA Logo" className="h-10 w-auto max-w-[120px]" />
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
              className="md:hidden text-white hover:text-mtta-green"
              onClick={() => setShowMobileMenu(!showMobileMenu)}
            >
              {showMobileMenu ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {showMobileMenu && (
        <div className="mobile-menu md:hidden" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 9999,
          background: 'linear-gradient(135deg, rgba(15, 20, 25, 0.98) 0%, rgba(25, 30, 38, 0.96) 100%)',
          color: '#ffffff',
          display: 'block'
        }}>
          <div className="mobile-menu-header" style={{
            background: 'rgba(26, 26, 26, 0.9)',
            borderBottom: '1px solid rgba(0, 200, 150, 0.3)',
            padding: '1rem'
          }}>
            <div className="flex items-center justify-between">
              <img src={mttaLogo} alt="MTTA Logo" className="h-8 w-auto" />
              <Button
                variant="ghost"
                size="sm"
                className="mobile-close-btn"
                onClick={() => setShowMobileMenu(false)}
                style={{ color: '#ffffff' }}
              >
                <X className="h-6 w-6" />
              </Button>
            </div>
          </div>
          <div className="px-0 py-0 space-y-0">
            {navigationLinks.map((link) => {
              const Icon = link.icon;
              const isActive = location === link.href;
              return (
                <Link key={link.href} href={link.href}>
                  <div 
                    className={`mobile-menu-link flex items-center space-x-3 cursor-pointer ${
                      isActive ? 'active' : ''
                    }`}
                    onClick={() => setShowMobileMenu(false)}
                    style={{
                      color: '#ffffff',
                      padding: '1rem',
                      borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      minHeight: '60px'
                    }}
                  >
                    <Icon className="h-4 w-4" style={{ color: '#ffffff' }} />
                    <span style={{ color: '#ffffff', marginLeft: '0.75rem' }}>{link.label}</span>
                  </div>
                </Link>
              );
            })}

            {isAuthenticated && user ? (
              <>
                {(user as any).role === 'player' && (
                  <Link href="/dashboard">
                    <div 
                      className="mobile-menu-link flex items-center space-x-3 cursor-pointer"
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
                        className="mobile-menu-link flex items-center space-x-3 cursor-pointer"
                        onClick={() => setShowMobileMenu(false)}
                      >
                        <Trophy className="h-4 w-4" />
                        <span>Тэмцээн Үүсгэх</span>
                      </div>
                    </Link>
                    <Link href="/admin/tournament-results">
                      <div 
                        className="mobile-menu-link flex items-center space-x-3 cursor-pointer"
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
                  className="mobile-logout-btn flex items-center space-x-3 w-full"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Гарах</span>
                </button>
              </>
            ) : (
              <div className="mobile-user-actions space-y-2">
                <Link href="/register">
                  <button
                    onClick={() => setShowMobileMenu(false)}
                    className="mobile-menu-link flex items-center justify-center w-full border border-mtta-green text-mtta-green hover:bg-mtta-green hover:text-white"
                  >
                    <span>Бүртгүүлэх</span>
                  </button>
                </Link>
                <Link href="/login">
                  <button
                    onClick={() => setShowMobileMenu(false)}
                    className="mobile-menu-link flex items-center justify-center w-full text-white bg-mtta-green hover:bg-mtta-green-dark"
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