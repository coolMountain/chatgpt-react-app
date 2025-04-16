import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { supabase } from './utils/supabaseClient';
import { ThemeProvider } from './contexts/ThemeContext';
import { AISettingsProvider } from './contexts/AISettingsContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Login from './pages/Login';
import Register from './pages/Register';
import Chat from './pages/Chat';

function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 检查当前会话状态
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // 监听认证状态变化
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-xl">加载中...</div>
      </div>
    );
  }

  return (
    <ThemeProvider>
      <AISettingsProvider>
        <Router>
          <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-200">
            <Routes>
              <Route
                path="/"
                element={session ? <Navigate to="/chat" /> : <Navigate to="/login" />}
              />
              <Route
                path="/login"
                element={!session ? <Login /> : <Navigate to="/chat" />}
              />
              <Route
                path="/register"
                element={!session ? <Register /> : <Navigate to="/chat" />}
              />
              <Route
                path="/chat"
                element={session ? <Chat session={session} /> : <Navigate to="/login" />}
              />
            </Routes>
          </div>
          <ToastContainer position="bottom-right" theme="colored" />
        </Router>
      </AISettingsProvider>
    </ThemeProvider>
  );
}

export default App; 