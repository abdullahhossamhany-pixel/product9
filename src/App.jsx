import React, { useState, useEffect } from 'react';
import SplashScreen from './components/SplashScreen';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// Import your pages and components
import Wallet from './pages/Wallet';
import { db } from './api/base44Client';

export default function App() {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    // Show splash screen for 2.5 seconds on initial load
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  if (showSplash) {
    return <SplashScreen />;
  }

  return (
    <Router>
      <Routes>
        <Route path="/Wallet" element={<Wallet />} />
        {/* Render your default home or landing route here */}
        <Route path="/" element={<Wallet />} />
      </Routes>
    </Router>
  );
}
