import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Splash from './Splash.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import ProfileMenu from './ProfileMenu.jsx';

const NAV_LINKS = [
  { label: 'About Us', href: '#about' },
  { label: 'Project', href: '#capabilities' },
  { label: 'New Scan', to: '/dashboard' },
  { label: 'Previous Scan', to: '/dashboard' },
  { label: 'News', to: '/news' },
  { label: 'References', to: '/references' },
];

export default function TopBar({ variant = 'public' }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [splashing, setSplashing] = useState(false);

  const handleLogoClick = (e) => {
    e.preventDefault();
    setSplashing(true);
  };

  return (
    <>
      {splashing && (
        <Splash
          duration={1100}
          onFinish={() => {
            setSplashing(false);
            navigate('/');
          }}
        />
      )}
      <header className="stb-bar">
        <style>{`
          @import url('https://api.fontshare.com/v2/css?f[]=clash-display@600,700&f[]=switzer@400,500&display=swap');
          .stb-bar {
            position: sticky; top: 0; z-index: 30;
            display: flex; align-items: center; justify-content: space-between;
            padding: 16px 32px; background: rgba(10,13,18,0.86); backdrop-filter: blur(8px);
            border-bottom: 1px solid #1b2129;
            font-family: 'Switzer', sans-serif;
          }
          .stb-logo {
            font-family: 'Clash Display', sans-serif; font-weight: 700; font-size: 17px;
            letter-spacing: 0.08em; color: #e8eaef; text-decoration: none; cursor: pointer;
          }
          .stb-nav { display: flex; align-items: center; gap: 26px; }
          .stb-link {
            font-size: 13.5px; color: #8a93a3; text-decoration: none;
            transition: color 0.15s ease;
          }
          .stb-link:hover { color: #c9a227; }
          .stb-signin-btn {
            font-size: 13.5px; font-weight: 600; color: #191308; background: #c9a227;
            padding: 8px 18px; border-radius: 6px; text-decoration: none;
          }
          .stb-signin-btn:hover { filter: brightness(1.08); }
          .profile-menu { position: relative; }
          .profile-menu-trigger { display: flex; align-items: center; gap: 8px; background: none; border: none; cursor: pointer; font-family: inherit; padding: 2px; }
          .profile-menu-avatar { width: 30px; height: 30px; border-radius: 999px; background: rgba(201,162,39,0.14); color: #c9a227; display: inline-flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 600; font-family: 'IBM Plex Mono', monospace; }
          .profile-menu-name { font-size: 13px; color: #e8eaef; }
          .profile-menu-popover { position: absolute; right: 0; top: calc(100% + 12px); z-index: 60; width: 270px; padding: 8px; background: #12161d; border: 1px solid #262e3a; box-shadow: 0 18px 40px rgba(0,0,0,.32); border-radius: 10px; }
          .profile-menu-summary { display: flex; gap: 10px; align-items: center; padding: 10px; border-bottom: 1px solid #262e3a; }
          .profile-menu-avatar-large { width: 36px; height: 36px; }
          .profile-menu-summary strong, .profile-menu-summary span { display: block; } .profile-menu-summary strong { color: #e8eaef; font-size: 13px; } .profile-menu-summary span { color: #8a93a3; font-size: 11px; margin-top: 2px; }
          .profile-menu-list { padding: 5px 0; } .profile-menu-list button, .profile-menu-logout { width: 100%; display: flex; align-items: center; gap: 9px; padding: 9px 10px; border: 0; border-radius: 6px; background: none; color: #c3c8d1; text-align: left; font: inherit; font-size: 12.5px; cursor: pointer; } .profile-menu-list button:hover, .profile-menu-logout:hover { background: #171c25; color: #c9a227; } .profile-menu-logout { border-top: 1px solid #262e3a; color: #dc8976; }
          @media (max-width: 860px) {
            .stb-nav { display: none; }
          }
        `}</style>

        <a href="/" className="stb-logo" onClick={handleLogoClick}>SEMICOLON</a>

        <nav className="stb-nav">
          {NAV_LINKS.map((item) =>
            item.to ? (
              <Link key={item.label} to={item.to} className="stb-link">{item.label}</Link>
            ) : (
              <a key={item.label} href={item.href} className="stb-link">{item.label}</a>
            )
          )}
        </nav>

        <div>
          {user ? (
            <ProfileMenu />
          ) : (
            <Link to="/login" className="stb-signin-btn">Sign in</Link>
          )}
        </div>
      </header>
    </>
  );
}
