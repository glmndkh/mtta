import React, { useState } from 'react';
import { X, MessageCircle, Home, Trophy, Calendar, Users } from 'lucide-react';

const FloatingActionButton: React.FC = () => {
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  const togglePanel = () => {
    setIsPanelOpen(!isPanelOpen);
  };

  const quickActions = [
    { icon: Home, label: 'Нүүр хуудас', href: '/' },
    { icon: Trophy, label: 'Тэмцээнүүд', href: '/tournaments' },
    { icon: Calendar, label: 'Үйл явдлууд', href: '/events' },
    { icon: Users, label: 'Клубууд', href: '/clubs' }
  ];

  return (
    <>
      {/* Overlay for mobile */}
      {isPanelOpen && (
        <div 
          className="fab-overlay"
          onClick={() => setIsPanelOpen(false)}
        />
      )}

      {/* Quick Actions Panel */}
      <div className={`fab-panel ${isPanelOpen ? 'fab-panel-open' : ''}`}>
        <div className="fab-panel-header">
          <div className="flex items-center gap-2">
            <img src="/logo.svg" alt="MTTA" className="w-6 h-6" />
            <span className="font-semibold text-sm">Түргэн холбоос</span>
          </div>
          <button 
            onClick={() => setIsPanelOpen(false)}
            className="fab-close-btn"
            aria-label="Хаах"
          >
            <X size={16} />
          </button>
        </div>

        <div className="fab-panel-content">
          {quickActions.map((action, index) => {
            const IconComponent = action.icon;
            return (
              <a
                key={index}
                href={action.href}
                className="fab-action-item"
                onClick={() => setIsPanelOpen(false)}
              >
                <IconComponent size={18} />
                <span>{action.label}</span>
              </a>
            );
          })}
        </div>
      </div>

      {/* FAB Button */}
      <button
        className="fab-button"
        onClick={togglePanel}
        aria-label={isPanelOpen ? "Цэсийг хаах" : "Цэсийг нээх"}
      >
        <img src="/logo.svg" alt="MTTA" className="fab-logo" />
      </button>

      <style>{`
        .fab-button {
          position: fixed;
          bottom: 24px;
          left: 24px;
          width: 56px;
          height: 56px;
          border-radius: 50%;
          background: #111;
          border: none;
          cursor: pointer;
          z-index: 9999;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0;
          outline: none;

          /* Safe area support */
          bottom: max(24px, env(safe-area-inset-bottom, 24px));
          left: max(24px, env(safe-area-inset-left, 24px));
        }

        .fab-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.25);
          background: #1a1a1a;
        }

        .fab-button:active {
          transform: translateY(0px);
        }

        .fab-logo {
          width: 60%;
          height: 60%;
          transition: transform 0.2s ease;
        }

        .fab-button:hover .fab-logo {
          transform: scale(1.1);
        }

        .fab-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.5);
          z-index: 9998;
          opacity: 0;
          animation: fadeIn 0.2s ease forwards;
        }

        .fab-panel {
          position: fixed;
          bottom: 92px;
          left: 24px;
          width: 100%;
          max-width: 360px;
          background: var(--background, #ffffff);
          border: 1px solid var(--border, #e2e8f0);
          border-radius: 16px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
          z-index: 9999;
          transform: translateY(20px) scale(0.95);
          opacity: 0;
          pointer-events: none;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

          /* Safe area support */
          bottom: max(92px, calc(env(safe-area-inset-bottom, 24px) + 68px));
          left: max(24px, env(safe-area-inset-left, 24px));
        }

        .fab-panel-open {
          transform: translateY(0) scale(1);
          opacity: 1;
          pointer-events: all;
        }

        .fab-panel-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 20px;
          border-bottom: 1px solid var(--border, #e2e8f0);
          color: var(--text-primary, #0f172a);
        }

        .fab-close-btn {
          background: none;
          border: none;
          cursor: pointer;
          padding: 4px;
          border-radius: 4px;
          color: var(--text-secondary, #64748b);
          transition: all 0.2s ease;
        }

        .fab-close-btn:hover {
          background: var(--accent, #f1f5f9);
          color: var(--text-primary, #0f172a);
        }

        .fab-panel-content {
          padding: 8px 0;
        }

        .fab-action-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 20px;
          text-decoration: none;
          color: var(--text-primary, #0f172a);
          transition: background-color 0.2s ease;
          font-size: 14px;
        }

        .fab-action-item:hover {
          background: var(--accent, #f1f5f9);
          color: var(--link, #16a34a);
        }

        /* Mobile responsive */
        @media (max-width: 768px) {
          .fab-button {
            width: 64px;
            height: 64px;
            bottom: 20px;
            left: 20px;
            bottom: max(20px, env(safe-area-inset-bottom, 20px));
            left: max(20px, env(safe-area-inset-left, 20px));
          }

          .fab-panel {
            bottom: 96px;
            left: 20px;
            right: 20px;
            max-width: none;
            width: auto;
            bottom: max(96px, calc(env(safe-area-inset-bottom, 20px) + 76px));
            left: max(20px, env(safe-area-inset-left, 20px));
            right: max(20px, env(safe-area-inset-right, 20px));
          }
        }

        /* Dark mode support */
        @media (prefers-color-scheme: dark) {
          .fab-button {
            background: #222;
          }

          .fab-button:hover {
            background: #333;
          }

          .fab-panel {
            background: #1a1a1a;
            border-color: #333;
            color: #ffffff;
          }

          .fab-panel-header {
            border-color: #333;
            color: #ffffff;
          }

          .fab-close-btn {
            color: #a0a0a0;
          }

          .fab-close-btn:hover {
            background: #333;
            color: #ffffff;
          }

          .fab-action-item {
            color: #ffffff;
          }

          .fab-action-item:hover {
            background: #333;
            color: #22c55e;
          }
        }

        /* Theme support for React apps */
        [data-theme="dark"] .fab-button,
        .dark .fab-button {
          background: #222 !important;
        }

        [data-theme="dark"] .fab-button:hover,
        .dark .fab-button:hover {
          background: #333 !important;
        }

        [data-theme="dark"] .fab-panel,
        .dark .fab-panel {
          background: var(--card, #1a1a1a) !important;
          border-color: var(--border, #333) !important;
          color: var(--text-primary, #ffffff) !important;
        }

        [data-theme="dark"] .fab-panel-header,
        .dark .fab-panel-header {
          border-color: var(--border, #333) !important;
          color: var(--text-primary, #ffffff) !important;
        }

        [data-theme="dark"] .fab-close-btn,
        .dark .fab-close-btn {
          color: var(--text-secondary, #a0a0a0) !important;
        }

        [data-theme="dark"] .fab-close-btn:hover,
        .dark .fab-close-btn:hover {
          background: var(--accent, #333) !important;
          color: var(--text-primary, #ffffff) !important;
        }

        [data-theme="dark"] .fab-action-item,
        .dark .fab-action-item {
          color: var(--text-primary, #ffffff) !important;
        }

        [data-theme="dark"] .fab-action-item:hover,
        .dark .fab-action-item:hover {
          background: var(--accent, #333) !important;
          color: var(--link, #22c55e) !important;
        }

        @keyframes fadeIn {
          to {
            opacity: 1;
          }
        }

        /* Focus styles for accessibility */
        .fab-button:focus-visible {
          outline: 2px solid #22c55e;
          outline-offset: 2px;
        }

        .fab-close-btn:focus-visible,
        .fab-action-item:focus-visible {
          outline: 2px solid #22c55e;
          outline-offset: 2px;
          border-radius: 4px;
        }
      `}</style>
    </>
  );
};

export default FloatingActionButton;