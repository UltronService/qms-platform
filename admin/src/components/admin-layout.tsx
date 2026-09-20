import { LogoutOutlined } from '@ant-design/icons';
import { Button, Layout, Menu, Typography } from 'antd';
import { useMemo } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/auth-context';

const { Header, Sider, Content } = Layout;

export function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const selectedKey = useMemo(() => {
    if (location.pathname.startsWith('/brands/')) {
      return 'brands';
    }
    return 'brands';
  }, [location.pathname]);

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider breakpoint="lg" collapsedWidth={64} theme="dark" width={220}>
        <div
          style={{
            color: '#fff',
            fontWeight: 600,
            padding: '16px 20px',
            letterSpacing: 0.5,
          }}
        >
          UltronService QMS
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[selectedKey]}
          items={[
            {
              key: 'brands',
              label: '品牌列表',
              onClick: () => navigate('/brands'),
            },
          ]}
        />
      </Sider>
      <Layout>
        <Header
          style={{
            background: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingInline: 24,
            borderBottom: '1px solid #f0f0f0',
          }}
        >
          <Typography.Text type="secondary">
            Admin CMS 視覺預覽 · 假資料 · 無真實 API
          </Typography.Text>
          <Button icon={<LogoutOutlined />} onClick={handleLogout}>
            登出
          </Button>
        </Header>
        <Content style={{ padding: 24, background: '#f5f5f5' }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
