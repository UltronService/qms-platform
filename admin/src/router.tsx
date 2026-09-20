import { createHashRouter, Navigate } from 'react-router-dom';
import { AdminLayout } from './components/admin-layout';
import { ProtectedRoute } from './components/protected-route';
import { BrandEditPage } from './pages/brand-edit-page';
import { BrandListPage } from './pages/brand-list-page';
import { LoginPage } from './pages/login-page';

export const adminRouter = createHashRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AdminLayout />,
        children: [
          { path: '/brands', element: <BrandListPage /> },
          { path: '/brands/:id/edit', element: <BrandEditPage /> },
        ],
      },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/login" replace />,
  },
]);
