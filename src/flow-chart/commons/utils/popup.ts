/* eslint-disable no-param-reassign */
import Swal from 'sweetalert2';
import 'sweetalert2/dist/sweetalert2.min.css';

const Toast = Swal.mixin({
  toast: true,
  position: 'top-end',
  showConfirmButton: false,
  timer: 3000,
  timerProgressBar: true,
  didOpen: (toast) => {
    toast.onmouseenter = Swal.stopTimer;
    toast.onmouseleave = Swal.resumeTimer;
  },
});

export const showSuccessToast = (message: string) => {
  Toast.fire({
    icon: 'success',
    title: message,
  });
};

const Alert = Swal.mixin({
  showConfirmButton: true,
  confirmButtonText: '确定',
});

export const showAlert = (message: string) => {
  Alert.fire({
    icon: 'warning',
    title: message,
  });
};
