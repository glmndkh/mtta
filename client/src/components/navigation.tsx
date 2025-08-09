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

      {/* Mobile menu - Full screen overlay */}
      {showMobileMenu && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-50 md:hidden"
          onClick={() => setShowMobileMenu(false)}
        >
          {/* Sidebar */}
          <div 
            className="fixed top-0 right-0 bottom-0 w-80 max-w-[85vw] bg-gray-900 shadow-2xl z-[60]"
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'linear-gradient(135deg, rgba(15, 20, 25, 0.98) 0%, rgba(25, 30, 38, 0.96) 100%)',
              borderLeft: '1px solid rgba(0, 200, 150, 0.3)'
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-green-700 bg-gray-800">
              <img src={mttaLogo} alt="MTTA Logo" className="h-8 w-auto" />
              <button
                onClick={() => setShowMobileMenu(false)}
                className="text-white hover:text-green-400 p-2"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Navigation Links */}
            <div className="flex-1 overflow-y-auto">
              {navigationLinks.map((link) => {
                const Icon = link.icon;
                const isActive = location === link.href;
                return (
                  <Link key={link.href} href={link.href}>
                    <div 
                      className={`flex items-center px-6 py-4 text-white hover:bg-gray-800 hover:text-green-400 transition-colors border-b border-gray-700 ${
                        isActive ? 'bg-green-900 text-green-400' : ''
                      }`}
                      onClick={() => setShowMobileMenu(false)}
                    >
                      <Icon className="h-5 w-5" />
                      <span className="ml-3 text-base font-medium">{link.label}</span>
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* User Authentication Section */}
            <div className="mt-auto border-t border-gray-700 bg-gray-800 p-4">
              {isAuthenticated && user ? (
                <div className="space-y-2">
                  {(user as any).role === 'player' && (
                    <Link href="/profile">
                      <div 
                        className="flex items-center px-4 py-3 text-white hover:bg-gray-700 hover:text-green-400 transition-colors rounded"
                        onClick={() => setShowMobileMenu(false)}
                      >
                        <User className="h-4 w-4" />
                        <span className="ml-3">Миний профайл</span>
                      </div>
                    </Link>
                  )}

                  {/* Admin-only items */}
                  {(user as any)?.role === 'admin' && (
                    <>
                      <Link href="/admin/dashboard">
                        <div 
                          className="flex items-center px-4 py-3 text-white hover:bg-gray-700 hover:text-green-400 transition-colors rounded"
                          onClick={() => setShowMobileMenu(false)}
                        >
                          <User className="h-4 w-4" />
                          <span className="ml-3">Админ самбар</span>
                        </div>
                      </Link>
                      <Link href="/admin/generator">
                        <div 
                          className="flex items-center px-4 py-3 text-white hover:bg-gray-700 hover:text-green-400 transition-colors rounded"
                          onClick={() => setShowMobileMenu(false)}
                        >
                          <Trophy className="h-4 w-4" />
                          <span className="ml-3">Тэмцээн үүсгэх</span>
                        </div>
                      </Link>
                    </>
                  )}
                  
                  <button
                    onClick={() => {
                      setShowMobileMenu(false);
                      window.location.href = '/api/logout';
                    }}
                    className="w-full flex items-center px-4 py-3 mt-4 text-red-400 bg-red-900 bg-opacity-20 hover:bg-opacity-30 transition-colors rounded border border-red-800"
                  >
                    <LogOut className="h-4 w-4" />
                    <span className="ml-3">Гарах</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <Link href="/register">
                    <button
                      onClick={() => setShowMobileMenu(false)}
                      className="w-full py-3 px-4 border border-green-400 text-green-400 bg-transparent hover:bg-green-400 hover:text-black transition-colors rounded font-medium"
                    >
                      Бүртгүүлэх
                    </button>
                  </Link>
                  <Link href="/login">
                    <button
                      onClick={() => setShowMobileMenu(false)}
                      className="w-full py-3 px-4 bg-green-400 text-black hover:bg-green-500 transition-colors rounded font-medium"
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
    </nav>
  );
}