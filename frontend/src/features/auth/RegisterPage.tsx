import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { HttpError } from '../../api'
import { Alert } from '../../components/ui/Alert'
import { Field } from '../../components/ui/Field'
import { Button } from '../../components/ui/Button'
import { useAuth } from '../../auth/useAuth'
import { AuthCard } from './AuthCard'
import { PasswordMeter } from './PasswordMeter'

export function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [pending, setPending] = useState(false)

  const mismatch = confirmation.length > 0 && confirmation !== password

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    if (mismatch) {
      return
    }
    setPending(true)
    setError(null)
    setFieldErrors({})
    try {
      await register({ email, password })
      navigate('/tasks', { replace: true })
    } catch (caught) {
      if (caught instanceof HttpError) {
        setFieldErrors(caught.fieldErrors)
        setError(
          caught.status === 409
            ? 'That email is already registered.'
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
      title="Create your account"
      subtitle="Sort what matters from what is merely loud."
      footer={
        <>
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-primary hover:underline">
            Sign in
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
        <div className="flex flex-col gap-2">
          <Field
            label="Password"
            type="password"
            name="password"
            autoComplete="new-password"
            minLength={8}
            maxLength={72}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            error={fieldErrors.password}
            required
          />
          <PasswordMeter password={password} />
        </div>
        <Field
          label="Confirm password"
          type="password"
          name="confirmation"
          autoComplete="new-password"
          value={confirmation}
          onChange={(event) => setConfirmation(event.target.value)}
          error={mismatch ? 'Passwords do not match.' : undefined}
          required
        />
        <Button type="submit" pending={pending} pendingLabel="Creating account…" className="mt-1">
          Create account
        </Button>
      </form>
    </AuthCard>
  )
}
