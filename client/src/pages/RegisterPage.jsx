import { useMutation } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../lib/api'
import { notifyError, notifySuccess } from '../lib/notify'
import AuthCardIntro from '../components/AuthCardIntro'

function RegisterPage() {
  const navigate = useNavigate()
  const { isAuthenticated, login } = useAuth()

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm({
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      role: 'VIEWER',
    },
  })

  const password = watch('password')

  const registerMutation = useMutation({
    mutationFn: async (values) => {
      const response = await api.post('/auth/register', {
        name: values.name,
        email: values.email,
        password: values.password,
        role: values.role,
      })
      return response.data
    },
    onSuccess: (data) => {
      login({
        token: data.token,
        user: data.user,
      })
      notifySuccess(
        'Account created',
        'Your VeriPay workspace account is ready to use.',
      )
      navigate('/vendors', { replace: true })
    },
    onError: (error) => {
      notifyError(
        'Registration failed',
        error?.response?.data?.message ||
          'Unable to create account. Please try again.',
      )
    },
  })

  if (isAuthenticated) {
    return <Navigate to="/vendors" replace />
  }

  return (
    <main className="login-shell">
      <section className="login-card">
        <AuthCardIntro
          eyebrow="VeriPay / Access"
          title="Create account"
          description="Set up a workspace account to manage vendors, invoices, and dispute operations."
        />

        <form
          className="login-form auth-form-panel"
          onSubmit={handleSubmit((values) => registerMutation.mutate(values))}
        >
          <label className="control">
            <span>Full name</span>
            <input
              type="text"
              placeholder="Ace Ansh"
              {...register('name', {
                required: 'Name is required',
              })}
            />
            {errors.name ? (
              <small className="field-error">{errors.name.message}</small>
            ) : null}
          </label>

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
            <span>Role</span>
            <select
              {...register('role', {
                required: 'Role is required',
              })}
            >
              <option value="VIEWER">Viewer</option>
              <option value="MANAGER">Manager</option>
              <option value="ADMIN">Admin</option>
            </select>
          </label>

          <label className="control">
            <span>Password</span>
            <input
              type="password"
              placeholder="Create a password"
              {...register('password', {
                required: 'Password is required',
                minLength: {
                  value: 6,
                  message: 'Password must be at least 6 characters',
                },
              })}
            />
            {errors.password ? (
              <small className="field-error">{errors.password.message}</small>
            ) : null}
          </label>

          <label className="control">
            <span>Confirm password</span>
            <input
              type="password"
              placeholder="Re-enter password"
              {...register('confirmPassword', {
                required: 'Please confirm your password',
                validate: (value) =>
                  value === password || 'Passwords do not match',
              })}
            />
            {errors.confirmPassword ? (
              <small className="field-error">
                {errors.confirmPassword.message}
              </small>
            ) : null}
          </label>

          <button
            type="submit"
            className="action-button login-button"
            disabled={registerMutation.isPending}
          >
            {registerMutation.isPending ? 'Creating account...' : 'Create account'}
          </button>
        </form>

        <div className="auth-links">
          <Link to="/login" className="login-link">
            Already have an account? Sign in
          </Link>
        </div>
      </section>
    </main>
  )
}

export default RegisterPage
