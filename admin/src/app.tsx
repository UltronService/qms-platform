import { ConfigProvider } from 'antd';
import zhTW from 'antd/locale/zh_TW';
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AdminLayout } from './components/admin-layout';
import { ProtectedRoute } from './components/protected-route';
import { AuthProvider } from './context/auth-context';
import { BrandProvider } from './context/brand-context';
import { BrandEditPage } from './pages/brand-edit-page';
import { BrandListPage } from './pages/brand-list-page';
import { LoginPage } from './pages/login-page';

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
          <HashRouter>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route element={<ProtectedRoute />}>
                <Route element={<AdminLayout />}>
                  <Route path="/brands" element={<BrandListPage />} />
                  <Route path="/brands/:id/edit" element={<BrandEditPage />} />
                </Route>
              </Route>
              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
          </HashRouter>
        </BrandProvider>
      </AuthProvider>
    </ConfigProvider>
  );
}
