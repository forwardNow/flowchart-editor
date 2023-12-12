/* eslint-disable no-param-reassign,no-alert */

export const showSuccessToast = (message: string) => {
  window.alert(message);
};

export const showAlert = (message: string) => {
  window.alert(message);
};

export const showConfirm = (message: string) => new Promise((resolve, reject) => {
  const isConfirm = window.confirm(message);

  if (!isConfirm) {
    reject(new Error('cancel'));
    return;
  }

  resolve(true);
});
