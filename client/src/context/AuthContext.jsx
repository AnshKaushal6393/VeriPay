import { createContext, useContext, useEffect, useState } from 'react'

const AuthContext = createContext(null)
export const AUTH_STORAGE_KEY = 'veripay_auth'

const readStoredAuth = () => {
  if (typeof window === 'undefined') {
    return {
      token: null,
      user: null,
    }
  }

  const storedAuth = localStorage.getItem(AUTH_STORAGE_KEY)

  if (!storedAuth) {
    return {
      token: null,
      user: null,
    }
  }

  try {
    const parsedAuth = JSON.parse(storedAuth)

    return {
      token: parsedAuth.token || null,
      user: parsedAuth.user || null,
    }
  } catch (_error) {
    localStorage.removeItem(AUTH_STORAGE_KEY)

    return {
      token: null,
      user: null,
    }
  }
}

export function AuthProvider({ children }) {
  const [authState, setAuthState] = useState(readStoredAuth)
  const { token, user } = authState

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
    setAuthState({
      token: authToken,
      user: authUser,
    })
  }

  const logout = () => {
    setAuthState({
      token: null,
      user: null,
    })
  }

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        isAuthenticated: Boolean(token && user),
        isAuthReady: true,
        login,
        logout,
        setUser: (nextUser) =>
          setAuthState((currentState) => ({
            ...currentState,
            user: nextUser,
          })),
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
