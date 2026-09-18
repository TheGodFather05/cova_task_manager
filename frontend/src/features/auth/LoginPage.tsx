import { useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { HttpError } from '../../api'
import { Alert } from '../../components/ui/Alert'
import { Field } from '../../components/ui/Field'
import { Button } from '../../components/ui/Button'
import { useAuth } from '../../auth/useAuth'
import { AuthCard } from './AuthCard'

export function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [pending, setPending] = useState(false)

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setPending(true)
    setError(null)
    setFieldErrors({})
    try {
      await login({ email, password })
      const from = (location.state as { from?: string } | null)?.from
      navigate(from ?? '/tasks', { replace: true })
    } catch (caught) {
      if (caught instanceof HttpError) {
        setFieldErrors(caught.fieldErrors)
        setError(
          caught.status === 401
            ? 'Email or password is incorrect.'
            : (caught.message ?? 'Something went wrong.'),
        )
      } else {
        setError('Network error — check your connection and try again.')
      }
    } finally {
      setPending(false)
    }
  }

  return (
    <AuthCard
      title="Sign in to Taskline"
      subtitle="Pick up where you left off."
      footer={
        <>
          No account yet?{' '}
          <Link to="/register" className="font-medium text-primary hover:underline">
            Create one
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
        {error ? <Alert title={error} /> : null}
        <Field
          label="Email"
          type="email"
          name="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          error={fieldErrors.email}
          required
        />
        <Field
          label="Password"
          type="password"
          name="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          error={fieldErrors.password}
          required
        />
        <Button type="submit" pending={pending} pendingLabel="Signing in…" className="mt-1">
          Sign in
        </Button>
      </form>
    </AuthCard>
  )
}
