import { createContext, useContext, useEffect, useState } from 'react'

const AuthContext = createContext(null)
export const AUTH_STORAGE_KEY = 'veripay_auth'

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null)
  const [user, setUser] = useState(null)

  useEffect(() => {
    const storedAuth = localStorage.getItem(AUTH_STORAGE_KEY)

    if (!storedAuth) {
      return
    }

    try {
      const parsedAuth = JSON.parse(storedAuth)
      setToken(parsedAuth.token || null)
      setUser(parsedAuth.user || null)
    } catch (error) {
      localStorage.removeItem(AUTH_STORAGE_KEY)
    }
  }, [])

  useEffect(() => {
    if (!token && !user) {
      localStorage.removeItem(AUTH_STORAGE_KEY)
      return
    }

    localStorage.setItem(
      AUTH_STORAGE_KEY,
      JSON.stringify({
        token,
        user,
      }),
    )
  }, [token, user])

  const login = ({ token: authToken, user: authUser }) => {
    setToken(authToken)
    setUser(authUser)
  }

  const logout = () => {
    setToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        isAuthenticated: Boolean(token && user),
        login,
        logout,
        setUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }

  return context
}
