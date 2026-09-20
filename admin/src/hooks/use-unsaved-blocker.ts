import { Modal } from 'antd';
import { useEffect } from 'react';
import { useBlocker } from 'react-router-dom';

export function useUnsavedBlocker(isDirty: boolean) {
  const blocker = useBlocker(isDirty);

  useEffect(() => {
    if (blocker.state !== 'blocked') {
      return;
    }

    Modal.confirm({
      title: '有未儲存或未發布的變更',
      content: '離開將放棄尚未儲存的編輯內容，確定要離開嗎？',
      okText: '放棄並離開',
      cancelText: '繼續編輯',
      okButtonProps: { danger: true },
      onOk: () => blocker.proceed?.(),
      onCancel: () => blocker.reset?.(),
    });
  }, [blocker]);
}

export function confirmLeave(onConfirm: () => void, isDirty: boolean) {
  if (!isDirty) {
    onConfirm();
    return;
  }

  Modal.confirm({
    title: '有未儲存或未發布的變更',
    content: '離開將放棄尚未儲存的編輯內容，確定要離開嗎？',
    okText: '放棄並離開',
    cancelText: '繼續編輯',
    okButtonProps: { danger: true },
    onOk: onConfirm,
  });
}
