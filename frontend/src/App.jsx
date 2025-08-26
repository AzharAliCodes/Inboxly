import { Routes, Route, Link, Navigate } from "react-router-dom";
import { useEffect, useState, createContext, useContext } from "react";
import Profile from "./Components/Profile.jsx";
import WelcomeScreen from "./pages/Welcome.jsx";
import LandingPage from "./pages/Landing.jsx";
import Auth from "./pages/Auth.jsx";
import Navbar from "./Components/Navbar.jsx";
import "./App.css";

// Create Theme Context
const ThemeContext = createContext();
// Create Auth Context
const AuthContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  return isAuthenticated ? children : <Navigate to="/auth" replace />;
};

// Theme Provider Component
const ThemeProvider = ({ children }) => {
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    const savedTheme = localStorage.getItem("inboxly-theme");
    if (savedTheme === "light") {
      setIsDark(false);
    } else if (savedTheme === "dark") {
      setIsDark(true);
    }
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
    localStorage.setItem("inboxly-theme", isDark ? "dark" : "light");
  }, [isDark]);

  const toggleTheme = () => {
    setIsDark(prev => !prev);
  };

  const value = {
    isDark,
    toggleTheme,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

// Auth Provider Component
const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check if user is logged in on app load
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const token = localStorage.getItem('inboxly-token');
        if (token) {
          // Verify token with backend
          const response = await fetch('/api/auth/verify', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (response.ok) {
            const userData = await response.json();
            setIsAuthenticated(true);
            setUser(userData);
          } else {
            localStorage.removeItem('inboxly-token');
          }
        }
      } catch (error) {
        console.error('Auth check failed:', error);
      } finally {
        setLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  const login = (token, userData) => {
    localStorage.setItem('inboxly-token', token);
    setIsAuthenticated(true);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('inboxly-token');
    setIsAuthenticated(false);
    setUser(null);
  };

  const value = {
    isAuthenticated,
    user,
    loading,
    login,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Main App Component
function AppContent() {
  const [started, setStarted] = useState(false);
  const { isDark } = useTheme();

  if (!started) {
    return <WelcomeScreen onGetStarted={() => setStarted(true)} />;
  }

  const backgroundClass = isDark ? "bg-[#000000]" : "bg-[#E5E5E5]";

  return (
    <div className={`min-h-screen transition-colors duration-300 ${backgroundClass}`}>
      <Navbar />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route 
          path="/profile" 
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          } 
        />
        <Route path="/auth" element={<Auth />} />
        <Route path="*" element={
          <div className={`text-center p-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Page not found
          </div>
        } />
      </Routes>
    </div>
  );
}

// Root App Component with Theme and Auth Providers
export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}
