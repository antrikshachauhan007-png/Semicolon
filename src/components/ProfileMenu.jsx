import React, { useEffect, useRef, useState } from 'react';
import { Activity, Bell, CircleHelp, FileClock, LogOut, Settings, UserRound } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth, initials } from '../context/AuthContext.jsx';

const ITEMS = [
  { label: 'Profile activity', icon: Activity, to: '/activity' },
  { label: 'Account settings', icon: Settings, to: '/settings' },
  { label: 'Help centre', icon: CircleHelp, to: '/help' },
  { label: 'Previous scans & reminders', icon: FileClock, to: '/dashboard#sec-history' },
];

export default function ProfileMenu({ className = '', compact = false }) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const name = user?.name || 'Guest';

  useEffect(() => {
    const close = (event) => {
      if (!menuRef.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const go = (to) => {
    setOpen(false);
    navigate(to);
  };

  const doLogout = () => {
    setOpen(false);
    logout();
    navigate('/login');
  };

  return (
    <div className={`profile-menu ${className}`} ref={menuRef}>
      <button className="profile-menu-trigger" onClick={() => setOpen((value) => !value)} aria-expanded={open} aria-haspopup="menu" aria-label="Open profile menu">
        <span className="profile-menu-avatar">{initials(name)}</span>
        {!compact && <span className="profile-menu-name">{name}</span>}
      </button>
      {open && (
        <div className="profile-menu-popover" role="menu">
          <div className="profile-menu-summary">
            <span className="profile-menu-avatar profile-menu-avatar-large">{initials(name)}</span>
            <div><strong>{name}</strong><span>{user?.email || 'Semicolon account'}</span></div>
          </div>
          <div className="profile-menu-list">
            {ITEMS.map(({ label, icon: Icon, to }) => (
              <button key={label} role="menuitem" onClick={() => go(to)}><Icon size={15} />{label}</button>
            ))}
          </div>
          <button className="profile-menu-logout" role="menuitem" onClick={doLogout}><LogOut size={15} />Log out</button>
        </div>
      )}
    </div>
  );
}
