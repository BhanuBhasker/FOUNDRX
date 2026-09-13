import { NavLink, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { Avatar } from '../ui/Avatar.jsx';

const NAV_LINKS = [
  { to: '/discover/builders', label: 'Discover Builders' },
  { to: '/discover/startups', label: 'Discover Startups' },
  { to: '/startups', label: 'Startups' },
  { to: '/applications', label: 'Applications' },
  { to: '/dashboard', label: 'Dashboard' },
];

export function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-8">
          <NavLink to="/" className="flex items-center gap-2 text-lg font-extrabold tracking-tight text-brand-700">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white">F</span>
            FOUNDRX
          </NavLink>
          {isAuthenticated && (
            <nav className="hidden items-center gap-6 md:flex">
              {NAV_LINKS.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  className={({ isActive }) =>
                    `text-sm font-medium ${isActive ? 'text-brand-700' : 'text-slate-600 hover:text-slate-900'}`
                  }
                >
                  {link.label}
                </NavLink>
              ))}
              {user?.role === 'admin' && (
                <NavLink
                  to="/admin"
                  className={({ isActive }) => `text-sm font-medium ${isActive ? 'text-brand-700' : 'text-slate-600 hover:text-slate-900'}`}
                >
                  Admin
                </NavLink>
              )}
            </nav>
          )}
        </div>

        {isAuthenticated ? (
          <div className="relative">
            <button type="button" onClick={() => setMenuOpen((v) => !v)} className="flex items-center gap-2">
              <Avatar name={user.name} src={user.avatar_url} size="sm" />
            </button>
            {menuOpen && (
              <div
                className="absolute right-0 mt-2 w-48 rounded-lg border border-slate-200 bg-white py-1 shadow-lg"
                onMouseLeave={() => setMenuOpen(false)}
              >
                <p className="truncate px-4 py-2 text-sm font-medium text-slate-900">{user.name}</p>
                <NavLink to="/profile" className="block px-4 py-2 text-sm text-slate-600 hover:bg-slate-50" onClick={() => setMenuOpen(false)}>
                  My profile
                </NavLink>
                <button type="button" onClick={handleLogout} className="block w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50">
                  Sign out
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <NavLink to="/login" className="btn-ghost">Sign in</NavLink>
            <NavLink to="/register" className="btn-primary">Get started</NavLink>
          </div>
        )}
      </div>
    </header>
  );
}
