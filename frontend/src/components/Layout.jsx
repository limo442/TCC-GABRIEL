import React, { useState } from 'react';
import { NavLink, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { LayoutDashboard, Car, Users, UserCheck, FileText, FileClock, ClipboardList, Menu, X, ChevronRight, LogOut } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '../services/api';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/veiculos', icon: Car, label: 'Veículos' },
  { to: '/clientes', icon: Users, label: 'Clientes' },
  { to: '/usuarios', icon: UserCheck, label: 'Usuários' },
  { to: '/alugueis', icon: FileText, label: 'Aluguéis' },
  { to: '/solicitacoes', icon: ClipboardList, label: 'Solicitações' },
  { to: '/auditoria', icon: FileClock, label: 'Auditoria' },
];

export default function Layout({ onLogout }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const pageTitle = navItems.find(n => n.to === location.pathname)?.label || 'Aluguel de Carros';

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (_) {
      // Mesmo sem conexão, encerra a sessão local.
    } finally {
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      window.dispatchEvent(new Event('authChange'));
      if (onLogout) onLogout();
      toast.success('Sessão local encerrada');
      navigate('/login', { replace: true });
    }
  };

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const availableNav = navItems.filter(n => !['/usuarios','/auditoria'].includes(n.to) || user.role === 'admin');

  return (
    <div className="flex h-screen bg-[#F8F9FA] overflow-hidden">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        data-testid="sidebar"
        className={`fixed lg:static inset-y-0 left-0 z-30 w-64 bg-white border-r border-slate-200 flex flex-col transform transition-transform duration-300 ease-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-200">
          <div className="w-8 h-8 bg-[#0047FF] rounded-lg flex items-center justify-center">
            <Car size={18} className="text-white" />
          </div>
          <div>
            <h1 className="font-heading text-base font-700 text-slate-900 leading-none">AutoLocadora</h1>
            <p className="text-xs text-slate-400 mt-0.5">Sistema de Gestão</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1" data-testid="sidebar-nav">
          {availableNav.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              data-testid={`nav-${label.toLowerCase()}`}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group
                ${isActive
                  ? 'bg-[#0047FF] text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon size={18} className={isActive ? 'text-white' : 'text-slate-500 group-hover:text-slate-700'} />
                  <span>{label}</span>
                  {isActive && <ChevronRight size={14} className="ml-auto text-blue-200" />}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-600 truncate mr-2">{user.username || 'Usuário'}</span>
            <button
              onClick={handleLogout}
              className="p-1.5 rounded-md text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
              title="Sair"
            >
              <LogOut size={16} />
            </button>
          </div>
          <p className="text-xs text-slate-400">v1.0.0 · Node.js + PostgreSQL</p>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center px-4 lg:px-8 gap-4 flex-shrink-0">
          <button
            className="lg:hidden p-2 rounded-md text-slate-500 hover:bg-slate-100"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            data-testid="mobile-menu-btn"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <div className="flex items-center gap-2 min-w-0">
            <h2 className="font-heading text-lg font-semibold text-slate-900 truncate">{pageTitle}</h2>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6 lg:p-8 animate-fade-in-up" data-testid="main-content">
          <div data-testid="page-content">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}