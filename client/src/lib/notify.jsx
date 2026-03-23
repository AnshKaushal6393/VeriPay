import toast from 'react-hot-toast'
import AppToast from '../components/AppToast'

const baseOptions = {
  duration: 3600,
}

function showToast(tone, title, message, options = {}) {
  return toast.custom(
    (toastState) => (
      <AppToast
        tone={tone}
        title={title}
        message={message}
        visible={toastState.visible}
        onDismiss={() => toast.dismiss(toastState.id)}
      />
    ),
    {
      ...baseOptions,
      ...options,
    },
  )
}

export function notifySuccess(title, message, options) {
  return showToast('success', title, message, options)
}

export function notifyError(title, message, options) {
  return showToast('error', title, message, options)
}

export function notifyInfo(title, message, options) {
  return showToast('info', title, message, options)
}
