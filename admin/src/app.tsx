import { ConfigProvider } from 'antd';
import zhTW from 'antd/locale/zh_TW';
import { RouterProvider } from 'react-router-dom';
import { AuthProvider } from './context/auth-context';
import { BrandProvider } from './context/brand-context';
import { adminRouter } from './router';

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
          <RouterProvider router={adminRouter} />
        </BrandProvider>
      </AuthProvider>
    </ConfigProvider>
  );
}
