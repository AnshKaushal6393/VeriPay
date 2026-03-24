import { useMutation } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../lib/api'
import { notifyError, notifySuccess } from '../lib/notify'
import AuthCardIntro from '../components/AuthCardIntro'

function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { isAuthenticated, isAuthReady, login } = useAuth()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      email: '',
      password: '',
    },
  })

  const loginMutation = useMutation({
    mutationFn: async (values) => {
      const response = await api.post('/auth/login', values)
      return response.data
    },
    onSuccess: (data) => {
      login({
        token: data.token,
        user: data.user,
      })
      notifySuccess(
        'Login successful',
        'Your workspace session is active and ready to use.',
      )
      navigate(location.state?.from?.pathname || '/vendors', { replace: true })
    },
    onError: (error) => {
      notifyError(
        'Sign-in failed',
        error?.response?.data?.message || 'Unable to log in. Please try again.',
      )
    },
  })

  if (!isAuthReady) {
    return null
  }

  if (isAuthenticated) {
    return <Navigate to={location.state?.from?.pathname || '/vendors'} replace />
  }

  return (
    <main className="login-shell">
      <section className="login-card">
        <AuthCardIntro
          eyebrow="VeriPay / Access"
          title="Login"
          description="Sign in to access vendors, invoice records, and protected operational workflows."
        />

        <form
          className="login-form auth-form-panel"
          onSubmit={handleSubmit((values) => loginMutation.mutate(values))}
        >
          <label className="control">
            <span>Email</span>
            <input
              type="email"
              placeholder="you@example.com"
              {...register('email', {
                required: 'Email is required',
              })}
            />
            {errors.email ? (
              <small className="field-error">{errors.email.message}</small>
            ) : null}
          </label>

          <label className="control">
            <span>Password</span>
            <input
              type="password"
              placeholder="Enter your password"
              {...register('password', {
                required: 'Password is required',
              })}
            />
            {errors.password ? (
              <small className="field-error">{errors.password.message}</small>
            ) : null}
          </label>

          <button
            type="submit"
            className="action-button login-button"
            disabled={loginMutation.isPending}
          >
            {loginMutation.isPending ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <div className="auth-links">
          <Link to="/register" className="login-link">
            Need an account? Create one
          </Link>
          <Link to="/vendors" className="login-link">
            Back to vendors
          </Link>
        </div>
      </section>
    </main>
  )
}

export default LoginPage
