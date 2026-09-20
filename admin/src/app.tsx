import { ConfigProvider } from 'antd';
import zhTW from 'antd/locale/zh_TW';
import { useMemo } from 'react';
import {
  Navigate,
  RouterProvider,
  createHashRouter,
} from 'react-router-dom';
import { AdminLayout } from './components/admin-layout';
import { ProtectedRoute } from './components/protected-route';
import { AuthProvider } from './context/auth-context';
import { BrandProvider } from './context/brand-context';
import { BrandEditPage } from './pages/brand-edit-page';
import { BrandListPage } from './pages/brand-list-page';
import { LoginPage } from './pages/login-page';

function AppRouter() {
  const router = useMemo(
    () =>
      createHashRouter([
        { path: '/login', element: <LoginPage /> },
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
        { path: '*', element: <Navigate to="/login" replace /> },
      ]),
    [],
  );

  return <RouterProvider router={router} />;
}

export function App() {
  return (
    <ConfigProvider
      locale={zhTW}
      theme={{
        token: {
          colorPrimary: '#006B3F',
          borderRadius: 6,
        },
      }}
    >
      <AuthProvider>
        <BrandProvider>
          <AppRouter />
        </BrandProvider>
      </AuthProvider>
    </ConfigProvider>
  );
}
