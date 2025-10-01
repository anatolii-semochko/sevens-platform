import axios from 'axios'
import store from '@react/store/index'
import { toast } from 'react-hot-toast'

const api = axios.create({
  baseURL: `/${store.getState().currentLocale}/api`,
  withCredentials: true, // якщо використовуєш cookie-based автентифікацію
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
})

export const objectToFormData = (obj, form = new FormData(), namespace = '') => {
  for (let key in obj) {
    if (obj[key] === undefined || obj[key] === null) continue
    const formKey = namespace ? `${namespace}[${key}]` : key

    if (obj[key] instanceof File) {
      form.append(formKey, obj[key])
    } else if (typeof obj[key] === 'object' && !(obj[key] instanceof Date)) {
      objectToFormData(obj[key], form, formKey)
    } else {
      form.append(formKey, obj[key])
    }
  }
  return form;
}

export const fetchErrorMessage = (error) =>
  error?.response?.data?.detail ||
  error?.response?.data?.message ||
  error?.response?.data?.error ||
  error?.message ||
  'Error occurred'

export const throwErrorMessage = (error) => {
    throw new Error(fetchErrorMessage(error))
}

export const handleApiError = (error) => {
  const message = fetchErrorMessage(error)
  toast.error(message)
  return message
}

export default api
