import { ExclamationCircleOutlined } from '@ant-design/icons';
import { Alert } from 'antd';

interface DraftBannerProps {
  message: string;
  description?: string;
}

export function DraftBanner({ message, description }: DraftBannerProps) {
  return (
    <Alert
      type="warning"
      showIcon
      icon={<ExclamationCircleOutlined />}
      message={message}
      description={description}
      banner
      style={{
        marginBottom: 16,
        border: '1px solid #faad14',
        background: '#fffbe6',
      }}
    />
  );
}
