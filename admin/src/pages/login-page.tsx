import { LockOutlined, UserOutlined } from '@ant-design/icons';
import { Alert, Button, Card, Form, Input, Typography } from 'antd';
import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/auth-context';

interface LoginFormValues {
  username: string;
  password: string;
}

export function LoginPage() {
  const navigate = useNavigate();
  const { isAuthenticated, login } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (isAuthenticated) {
    return <Navigate to="/brands" replace />;
  }

  const handleFinish = async (values: LoginFormValues) => {
    setLoading(true);
    setError(null);
    try {
      const result = await login(values.username, values.password);
      if (result.ok) {
        navigate('/brands');
        return;
      }
      setError(result.message ?? '登入失敗');
    } catch {
      setError('登入時發生錯誤，請稍後再試');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #f0f5ff 0%, #f6ffed 100%)',
        padding: 24,
      }}
    >
      <Card style={{ width: '100%', maxWidth: 420, boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Typography.Title level={3} style={{ marginBottom: 4 }}>
            UltronService QMS
          </Typography.Title>
          <Typography.Text type="secondary">Admin CMS 視覺預覽</Typography.Text>
        </div>

        {error && (
          <Alert
            message={error}
            type="error"
            showIcon
            style={{ marginBottom: 16 }}
            closable
            onClose={() => setError(null)}
          />
        )}

        <Form<LoginFormValues>
          layout="vertical"
          onFinish={handleFinish}
          requiredMark={false}
          initialValues={{ username: '', password: '' }}
        >
          <Form.Item
            label="帳號"
            name="username"
            rules={[{ required: true, message: '請輸入帳號' }]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder="admin"
              autoComplete="username"
              size="large"
            />
          </Form.Item>
          <Form.Item
            label="密碼"
            name="password"
            rules={[{ required: true, message: '請輸入密碼' }]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="••••••••"
              autoComplete="current-password"
              size="large"
            />
          </Form.Item>
          <Form.Item style={{ marginBottom: 8 }}>
            <Button type="primary" htmlType="submit" block size="large" loading={loading}>
              登入
            </Button>
          </Form.Item>
        </Form>

        <Typography.Paragraph
          type="secondary"
          style={{ fontSize: 12, textAlign: 'center', marginBottom: 0, marginTop: 16 }}
        >
          預覽帳密：admin / preview · 無真實後端
        </Typography.Paragraph>
      </Card>
    </div>
  );
}
