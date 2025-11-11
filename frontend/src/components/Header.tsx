import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks';
import { LogOut, User, FileText } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    toast.success('Logout realizado com sucesso!');
    navigate('/login');
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <FileText className="w-8 h-8 text-primary-600" />
            <div>
              <h1 className="text-xl font-bold text-gray-900">Presales AI</h1>
              <p className="text-xs text-gray-500">Sistema de Pré-Venda</p>
            </div>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            <Link
              to="/"
              className="text-gray-600 hover:text-primary-600 transition font-medium"
            >
              Dashboard
            </Link>
            <Link
              to="/new"
              className="text-gray-600 hover:text-primary-600 transition font-medium"
            >
              Nova Proposta
            </Link>
            <Link
              to="/professionals"
              className="text-gray-600 hover:text-primary-600 transition font-medium"
            >
              Profissionais
            </Link>
            <Link
              to="/parameters"
              className="text-gray-600 hover:text-primary-600 transition font-medium"
            >
              Parâmetros
            </Link>
            {user?.role === 'admin' && (
              <Link
                to="/users"
                className="text-gray-600 hover:text-primary-600 transition font-medium"
              >
                Usuários
              </Link>
            )}
          </nav>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            {/* User Info */}
            <div className="hidden sm:flex items-center space-x-3 bg-gray-50 rounded-lg px-4 py-2">
              <div className="flex items-center justify-center w-8 h-8 bg-primary-100 rounded-full">
                <User className="w-5 h-5 text-primary-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
              </div>
            </div>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
            >
              <LogOut className="w-5 h-5" />
              <span className="hidden sm:inline font-medium">Sair</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
