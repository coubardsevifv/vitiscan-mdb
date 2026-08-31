import { Toaster } from "@/components/ui/toaster"

import { QueryClientProvider } from '@tanstack/react-query'

import { queryClientInstance } from '@/lib/query-client'

import { BrowserRouter as Router, Navigate, Route, Routes } from 'react-router-dom';

import PageNotFound from './lib/PageNotFound';

import ProtectedRoute from '@/components/ProtectedRoute';

import { AuthProvider, useAuth } from '@/lib/AuthContext';

import ScrollToTop from './components/ScrollToTop';

import MobileLayout from '@/components/MobileLayout';

import Login from '@/pages/Login';

import Register from '@/pages/Register';

import ForgotPassword from '@/pages/ForgotPassword';

import ResetPassword from '@/pages/ResetPassword';

import Prospection from '@/pages/Prospection';

import ParcelleDetail from '@/pages/ParcelleDetail';

import Saisie from '@/pages/Saisie';

import Carte from '@/pages/Carte';

import Historique from '@/pages/Historique';

import Profil from '@/pages/Profil';

import AdminLayout from '@/components/AdminLayout';

import AdminDashboard from '@/pages/admin/Dashboard';

import AdminParcelles from '@/pages/admin/Parcelles';

import AdminCategories from '@/pages/admin/Categories';

import AdminImport from '@/pages/admin/Import';

import AdminExport from '@/pages/admin/Export';

import AdminUsers from '@/pages/admin/Users';

const AuthenticatedApp = () => {

  const { isLoadingAuth, authChecked } = useAuth();

  // Show loading spinner while checking auth

  if (isLoadingAuth || !authChecked) {

    return (

      <div className="fixed inset-0 flex items-center justify-center">

        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>

      </div>

    );

  }

  // Render the main app

  return (

    <Routes>

      <Route path="/login" element={<Login />} />

      <Route path="/register" element={<Register />} />

      <Route path="/forgot-password" element={<ForgotPassword />} />

      <Route path="/reset-password" element={<ResetPassword />} />

      <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} />}>

        <Route element={<MobileLayout />}>

          <Route path="/" element={<Prospection />} />

          <Route path="/parcelles/:id" element={<ParcelleDetail />} />

          <Route path="/carte" element={<Carte />} />

          <Route path="/historique" element={<Historique />} />

          <Route path="/profil" element={<Profil />} />

        </Route>

        <Route path="/saisie/:parcelleId/:placetteId" element={<Saisie />} />

        <Route element={<AdminLayout />}>

          <Route path="/admin" element={<AdminDashboard />} />

          <Route path="/admin/parcelles" element={<AdminParcelles />} />

          <Route path="/admin/categories" element={<AdminCategories />} />

          <Route path="/admin/import" element={<AdminImport />} />

          <Route path="/admin/export" element={<AdminExport />} />

          <Route path="/admin/users" element={<AdminUsers />} />

        </Route>

      </Route>

      <Route path="*" element={<PageNotFound />} />

    </Routes>

  );

};

function App() {

  return (

    <AuthProvider>

      <QueryClientProvider client={queryClientInstance}>

        <Router>

          <ScrollToTop />

          <AuthenticatedApp />

        </Router>

        <Toaster />

      </QueryClientProvider>

    </AuthProvider>

  )

}

export default App
