import React, { useCallback } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Veiculos from './pages/Veiculos';
import Clientes from './pages/Clientes';
import Usuarios from './pages/Usuarios';
import Alugueis from './pages/Alugueis';
import Login from './pages/Login';
import Autoatendimento, { PoliticaPrivacidade, TermosUso } from './pages/Autoatendimento';
import Solicitacoes from './pages/Solicitacoes';
import Auditoria from './pages/Auditoria';
import './App.css';

// Component to handle redirects after login
function AppContent() {
  const [isAuthenticated, setIsAuthenticated] = React.useState(() => {
    const token = localStorage.getItem('authToken');
    return !!token;
  });


  const handleLogin = useCallback(() => {
    setIsAuthenticated(true);
  }, []);

  const handleLogout = useCallback(() => {
    setIsAuthenticated(false);
  }, []);

  React.useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('authToken');
      const newAuthState = !!token;
      setIsAuthenticated(newAuthState);
    };

    window.addEventListener('authChange', checkAuth);
    window.addEventListener('storage', checkAuth);

    return () => {
      window.removeEventListener('authChange', checkAuth);
      window.removeEventListener('storage', checkAuth);
    };
  }, []);

  return (
    <>
      <Toaster position="top-right" richColors closeButton />
      <Routes>
        {/* Autoatendimento e transparência: rotas públicas sem login. */}
        <Route path="/autoatendimento" element={<Autoatendimento />} />
        <Route path="/politica-privacidade" element={<PoliticaPrivacidade />} />
        <Route path="/termos-uso" element={<TermosUso />} />

        {/* Public login route */}
        <Route path="/login" element={isAuthenticated ? <Navigate to="/" replace /> : <Login onLogin={handleLogin} />} />

        {/* Protected routes - require authentication */}
        <Route path="/" element={isAuthenticated ? <Layout onLogout={handleLogout} /> : <Navigate to="/login" replace />}>
          <Route index element={<Dashboard />} />
          <Route path="veiculos" element={<Veiculos />} />
          <Route path="clientes" element={<Clientes />} />
          <Route path="usuarios" element={JSON.parse(localStorage.getItem('user') || '{}').role === 'admin' ? <Usuarios /> : <Navigate to="/" replace />} />
          <Route path="alugueis" element={<Alugueis />} />
          <Route path="solicitacoes" element={<Solicitacoes />} />
          <Route path="auditoria" element={JSON.parse(localStorage.getItem('user') || '{}').role === 'admin' ? <Auditoria /> : <Navigate to="/" replace />} />
        </Route>

        {/* Catch-all route - redirect based on auth status */}
        <Route path="*" element={<Navigate to={isAuthenticated ? "/" : "/login"} replace />} />
      </Routes>
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;