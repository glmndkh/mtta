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

      {/* Mobile menu overlay */}
      {showMobileMenu && (
        <div 
          className="fixed inset-0 z-50 md:hidden"
          onClick={() => setShowMobileMenu(false)}
          style={{
            background: 'rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(4px)'
          }}
        >
          {/* Mobile menu sidebar */}
          <div 
            className="mobile-menu-sidebar"
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'fixed',
              top: 0,
              right: 0,
              bottom: 0,
              width: '280px',
              maxWidth: '85vw',
              background: 'linear-gradient(135deg, rgba(15, 20, 25, 0.98) 0%, rgba(25, 30, 38, 0.96) 100%)',
              backdropFilter: 'blur(10px)',
              color: '#ffffff',
              display: 'flex',
              flexDirection: 'column',
              transform: showMobileMenu ? 'translateX(0)' : 'translateX(100%)',
              transition: 'transform 0.3s ease-in-out',
              boxShadow: '-4px 0 20px rgba(0, 0, 0, 0.3)'
            }}
          >
            {/* Header */}
            <div style={{
              background: 'rgba(26, 26, 26, 0.9)',
              borderBottom: '1px solid rgba(0, 200, 150, 0.3)',
              padding: '1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexShrink: 0
            }}>
              <img src={mttaLogo} alt="MTTA Logo" className="h-8 w-auto" />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowMobileMenu(false)}
                style={{ 
                  color: '#ffffff',
                  padding: '0.5rem',
                  minWidth: 'auto'
                }}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Menu items container */}
            <div style={{
              flex: 1,
              overflowY: 'auto',
              padding: '0.5rem 0'
            }}>
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
                      padding: '1rem 1.5rem',
                      borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      minHeight: '52px',
                      fontSize: '1rem',
                      fontWeight: '500',
                      transition: 'background-color 0.2s ease',
                      cursor: 'pointer'
                    }}
                  >
                    <Icon className="h-4 w-4" style={{ color: '#ffffff' }} />
                    <span style={{ color: '#ffffff', marginLeft: '0.75rem' }}>{link.label}</span>
                  </div>
                </Link>
              );
              })}
            
              {/* User menu section at bottom */}
              <div style={{
                marginTop: 'auto',
                borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                backgroundColor: 'rgba(26, 26, 26, 0.5)',
                padding: '1rem'
              }}>
              {isAuthenticated && user ? (
                <>
                  {(user as any).role === 'player' && (
                    <Link href="/profile">
                      <div 
                        className="mobile-menu-link flex items-center space-x-3 cursor-pointer"
                        onClick={() => setShowMobileMenu(false)}
                        style={{
                          color: '#ffffff',
                          padding: '0.75rem 1rem',
                          display: 'flex',
                          alignItems: 'center',
                          minHeight: '48px',
                          marginBottom: '0.5rem',
                          borderRadius: '0.5rem',
                          transition: 'background-color 0.2s ease'
                        }}
                      >
                        <User className="h-4 w-4" style={{ color: '#ffffff' }} />
                        <span style={{ color: '#ffffff', marginLeft: '0.75rem' }}>Миний профайл</span>
                      </div>
                    </Link>
                  )}

                  {/* Admin-only mobile menu items */}
                  {(user as any)?.role === 'admin' && (
                    <>
                      <Link href="/admin/dashboard">
                        <div 
                          className="mobile-menu-link flex items-center space-x-3 cursor-pointer"
                          onClick={() => setShowMobileMenu(false)}
                          style={{
                            color: '#ffffff',
                            padding: '0.75rem 1rem',
                            display: 'flex',
                            alignItems: 'center',
                            minHeight: '48px',
                            marginBottom: '0.5rem',
                            borderRadius: '0.5rem',
                            transition: 'background-color 0.2s ease'
                          }}
                        >
                          <User className="h-4 w-4" style={{ color: '#ffffff' }} />
                          <span style={{ color: '#ffffff', marginLeft: '0.75rem' }}>Админ самбар</span>
                        </div>
                      </Link>
                      <Link href="/admin/generator">
                        <div 
                          className="mobile-menu-link flex items-center space-x-3 cursor-pointer"
                          onClick={() => setShowMobileMenu(false)}
                          style={{
                            color: '#ffffff',
                            padding: '0.75rem 1rem',
                            display: 'flex',
                            alignItems: 'center',
                            minHeight: '48px',
                            marginBottom: '0.5rem',
                            borderRadius: '0.5rem',
                            transition: 'background-color 0.2s ease'
                          }}
                        >
                          <Trophy className="h-4 w-4" style={{ color: '#ffffff' }} />
                          <span style={{ color: '#ffffff', marginLeft: '0.75rem' }}>Тэмцээн үүсгэх</span>
                        </div>
                      </Link>
                    </>
                  )}
                  <button
                    onClick={() => {
                      setShowMobileMenu(false);
                      window.location.href = '/api/logout';
                    }}
                    style={{
                      color: '#ff6b6b',
                      background: 'rgba(255, 107, 107, 0.1)',
                      border: '1px solid rgba(255, 107, 107, 0.3)',
                      padding: '0.75rem 1rem',
                      display: 'flex',
                      alignItems: 'center',
                      width: '100%',
                      minHeight: '48px',
                      marginTop: '1rem',
                      borderRadius: '0.5rem'
                    }}
                  >
                    <LogOut className="h-4 w-4" style={{ color: '#ff6b6b' }} />
                    <span style={{ color: '#ff6b6b', marginLeft: '0.75rem' }}>Гарах</span>
                  </button>
                </>
              ) : (
                <>
                  <Link href="/register">
                    <button
                      onClick={() => setShowMobileMenu(false)}
                      style={{
                        width: '100%',
                        padding: '0.75rem 1rem',
                        marginBottom: '0.75rem',
                        border: '1px solid #00c896',
                        color: '#00c896',
                        background: 'transparent',
                        borderRadius: '0.5rem',
                        fontSize: '1rem',
                        fontWeight: '500',
                        minHeight: '48px'
                      }}
                    >
                      Бүртгүүлэх
                    </button>
                  </Link>
                  <Link href="/login">
                    <button
                      onClick={() => setShowMobileMenu(false)}
                      style={{
                        width: '100%',
                        padding: '0.75rem 1rem',
                        background: '#00c896',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '0.5rem',
                        fontSize: '1rem',
                        fontWeight: '500',
                        minHeight: '48px'
                      }}
                    >
                      Нэвтрэх
                    </button>
                  </Link>
                </>
              )}
              </div>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}