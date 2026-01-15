import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout/Layout';
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import Invoices from './pages/Invoices';
import Outlets from './pages/Outlets';
import Reports from './pages/Reports';
import Login from './pages/Login';
import { localStorageManager } from './utils/localStorage';

function App() {
  useEffect(() => {
    try {
      // Initialize dummy data on first load
      localStorageManager.initializeData();
      console.log('App initialized with localStorage data');
    } catch (error) {
      console.error('Error initializing localStorage:', error);
    }
  }, []);

  const PrivateRoute = ({ children }) => {
    const isLoggedIn = localStorageManager.isLoggedIn();
    return isLoggedIn ? children : <Navigate to="/login" />;
  };

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        <Route path="/" element={
          <PrivateRoute>
            <Layout />
          </PrivateRoute>
        }>
          <Route index element={<Dashboard />} />
          <Route path="inventory/*" element={<Inventory />} />
          <Route path="invoices/*" element={<Invoices />} />
          <Route path="outlets" element={<Outlets />} />
          <Route path="reports" element={<Reports />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;