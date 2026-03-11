import React from "react";
import { BrowserRouter as Router, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { AuthProvider } from "./hooks/useAuth.jsx";
import AppRoutes from "./routes/AppRoutes.jsx";

function AnimatedRoutesWrapper() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait" initial={false}>
      <AppRoutes location={location} />
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <AnimatedRoutesWrapper />
      </AuthProvider>
    </Router>
  );
}