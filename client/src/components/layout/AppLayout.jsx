import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar.jsx';

export function AppLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
        <Outlet />
      </main>
      <footer className="border-t border-slate-200 py-6 text-center text-sm text-slate-500">
        © {new Date().getFullYear()} FOUNDRX — Discover builders, build startups.
      </footer>
    </div>
  );
}
