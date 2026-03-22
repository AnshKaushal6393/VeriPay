import { useAuth } from './context/AuthContext'

function App() {
  const { isAuthenticated, token, user, logout } = useAuth()

  return (
    <main className="app">
      <h1>VeriPay</h1>
      <p>React auth context is ready.</p>
      {isAuthenticated ? (
        <section>
          <p>Logged in as {user?.name}</p>
          <p>Role: {user?.role}</p>
          <p>Token stored: {token ? 'Yes' : 'No'}</p>
          <button type="button" onClick={logout}>
            Logout
          </button>
        </section>
      ) : (
        <p>No authenticated user in state.</p>
      )}
    </main>
  )
}

export default App
