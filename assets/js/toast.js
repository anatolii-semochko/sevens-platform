import toast from 'react-hot-toast'

window.toast = {
    success: (message, options = {}) => toast.success(message, options),
    error: (message, options = {}) => toast.error(message, options),
    loading: (message, options = {}) => toast.loading(message, options),
    custom: (message, options = {}) => toast(message, options),
    dismiss: (toastId) => toast.dismiss(toastId),
    remove: (toastId) => toast.remove(toastId)
}
