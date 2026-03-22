import axios from 'axios'
import { AUTH_STORAGE_KEY } from '../context/AuthContext'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
})

api.interceptors.request.use(
  (config) => {
    const storedAuth = localStorage.getItem(AUTH_STORAGE_KEY)

    if (storedAuth) {
      try {
        const { token } = JSON.parse(storedAuth)

        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }
      } catch (error) {
        localStorage.removeItem(AUTH_STORAGE_KEY)
      }
    }

    return config
  },
  (error) => Promise.reject(error),
)

export default api
