let dialogHandler = null;
let pendingDialogs = [];

export function registerDialogHandler(handler) {
  dialogHandler = handler;

  if (pendingDialogs.length > 0) {
    pendingDialogs.forEach((payload) => handler(payload));
    pendingDialogs = [];
  }

  return () => {
    if (dialogHandler === handler) dialogHandler = null;
  };
}

function dispatchDialog(config) {
  return new Promise((resolve) => {
    const payload = { ...config, resolve };
    if (dialogHandler) {
      dialogHandler(payload);
      return;
    }

    pendingDialogs.push(payload);
  });
}

export async function showAlert(message, options = {}) {
  const payload = {
    type: 'alert',
    title: options.title || 'Thông báo',
    message,
    confirmText: options.confirmText || 'Đóng',
    tone: options.tone || 'info',
  };

  await dispatchDialog(payload);
}

export async function showConfirm(message, options = {}) {
  const payload = {
    type: 'confirm',
    title: options.title || 'Xác nhận',
    message,
    confirmText: options.confirmText || 'Xác nhận',
    cancelText: options.cancelText || 'Hủy',
    tone: options.tone || 'warning',
  };

  const result = await dispatchDialog(payload);
  return Boolean(result);
}

export async function showPrompt(message, options = {}) {
  const payload = {
    type: 'prompt',
    title: options.title || 'Nhập thông tin',
    message,
    confirmText: options.confirmText || 'Lưu',
    cancelText: options.cancelText || 'Hủy',
    tone: options.tone || 'info',
    defaultValue: options.defaultValue || '',
    placeholder: options.placeholder || '',
    inputType: options.inputType || 'text',
  };

  return await dispatchDialog(payload);
}
