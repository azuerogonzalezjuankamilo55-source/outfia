
import { useState, type FormEvent } from 'react'
import {
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  Sparkles,
} from 'lucide-react'
import { supabase } from './supabase'
import './Auth.css'

type AuthProps = {
  onAuthenticated: () => void
}

type AuthMode = 'login' | 'register' | 'recovery'

function Auth({ onAuthenticated }: AuthProps) {
  const [mode, setMode] = useState<AuthMode>('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setMessage('')
    setErrorMessage('')

    if (mode === 'register' && name.trim().length < 2) {
      setErrorMessage('Escribe tu nombre para continuar.')
      return
    }

    if (mode === 'register' && password !== confirmPassword) {
      setErrorMessage('Las contraseñas no coinciden.')
      return
    }

    setLoading(true)

    try {
      if (mode === 'register') {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: { full_name: name.trim() },
            emailRedirectTo: window.location.origin,
          },
        })

        if (error) throw error

        if (data.session) {
          onAuthenticated()
        } else {
          setMessage(
            'Cuenta creada. Revisa tu correo para confirmar tu dirección antes de iniciar sesión.',
          )
          setMode('login')
          setPassword('')
          setConfirmPassword('')
        }
      } else if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        })

        if (error) throw error

        onAuthenticated()
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(
          email.trim(),
          { redirectTo: window.location.origin },
        )

        if (error) throw error

        setMessage(
          'Si existe una cuenta con ese correo, recibirás instrucciones para recuperar tu contraseña.',
        )
      }
    } catch (error: unknown) {
      const description =
        error instanceof Error
          ? error.message
          : 'Ocurrió un error inesperado.'

      if (description.toLowerCase().includes('invalid login credentials')) {
        setErrorMessage('Correo o contraseña incorrectos.')
      } else if (
        description.toLowerCase().includes('user already registered')
      ) {
        setErrorMessage('Este correo ya tiene una cuenta. Inicia sesión.')
      } else if (
        description.toLowerCase().includes('password should be at least')
      ) {
        setErrorMessage('La contraseña debe tener al menos 6 caracteres.')
      } else {
        setErrorMessage(description)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-showcase">
        <a className="auth-brand" href="/">
          <span className="auth-brand-mark">O</span>
          <span>OUTFIA</span>
        </a>

        <div className="auth-showcase-copy">
          <span className="auth-kicker">
            <Sparkles size={15} />
            TU ESTILO, TU IDENTIDAD
          </span>
          <h1>Tu estilo.<br />Tus reglas.</h1>
          <p>
            Descubre tu estilo, organiza tu armario y crea combinaciones que
            hablen de ti.
          </p>
        </div>

        <span className="auth-showcase-footer">
          Encuentra tu estilo, a tu manera.
        </span>
      </section>

      <section className="auth-panel">
        <div className="auth-form-wrap">
          <a className="auth-mobile-brand" href="/">OUTFIA.</a>

          <p className="auth-eyebrow">
            {mode === 'register'
              ? 'EMPIEZA TU EXPERIENCIA'
              : mode === 'recovery'
                ? 'RECUPERA TU ACCESO'
                : 'QUÉ BUENO TENERTE AQUÍ'}
          </p>

          <h2>
            {mode === 'register'
              ? 'Crea tu cuenta'
              : mode === 'recovery'
                ? 'Recupera tu contraseña'
                : 'Bienvenido de nuevo'}
          </h2>

          <p className="auth-subtitle">
            {mode === 'register'
              ? 'Únete a OUTFIA y construye tu estilo.'
              : mode === 'recovery'
                ? 'Escribe tu correo para recuperar el acceso.'
                : 'Inicia sesión para entrar a tu espacio personal.'}
          </p>

          {message && (
            <div className="auth-message" role="status">{message}</div>
          )}

          {errorMessage && (
            <div className="auth-error" role="alert">{errorMessage}</div>
          )}

          <form className="auth-form" onSubmit={handleSubmit}>
            {mode === 'register' && (
              <label className="auth-field">
                <span>Nombre</span>
                <div className="auth-input-wrap">
                  <input
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="¿Cómo te llamas?"
                    autoComplete="name"
                    minLength={2}
                    maxLength={80}
                    required
                  />
                </div>
              </label>
            )}

            <label className="auth-field">
              <span>Correo electrónico</span>
              <div className="auth-input-wrap">
                <Mail size={18} />
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="tu@correo.com"
                  autoComplete="email"
                  maxLength={254}
                  required
                />
              </div>
            </label>

            {mode !== 'recovery' && (
              <label className="auth-field">
                <span>Contraseña</span>
                <div className="auth-input-wrap">
                  <LockKeyhole size={18} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    autoComplete={
                      mode === 'register' ? 'new-password' : 'current-password'
                    }
                    minLength={6}
                    maxLength={128}
                    required
                  />
                  <button
                    className="auth-password-toggle"
                    type="button"
                    aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    onClick={() => setShowPassword((value) => !value)}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </label>
            )}

            {mode === 'register' && (
              <label className="auth-field">
                <span>Confirmar contraseña</span>
                <div className="auth-input-wrap">
                  <LockKeyhole size={18} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    placeholder="Repite tu contraseña"
                    autoComplete="new-password"
                    minLength={6}
                    maxLength={128}
                    required
                  />
                </div>
              </label>
            )}

            {mode === 'login' && (
              <div className="auth-options">
                <button
                  className="auth-link"
                  type="button"
                  onClick={() => {
                    setMode('recovery')
                    setMessage('')
                    setErrorMessage('')
                  }}
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
            )}

            <button className="auth-submit" type="submit" disabled={loading}>
              {loading
                ? 'Un momento...'
                : mode === 'register'
                  ? 'Crear mi cuenta'
                  : mode === 'recovery'
                    ? 'Enviar instrucciones'
                    : 'Iniciar sesión'}
            </button>
          </form>

          <p className="auth-switch">
            {mode === 'recovery' ? (
              <button
                className="auth-link"
                type="button"
                onClick={() => {
                  setMode('login')
                  setMessage('')
                  setErrorMessage('')
                }}
              >
                Volver al inicio de sesión
              </button>
            ) : (
              <>
                {mode === 'register'
                  ? '¿Ya tienes una cuenta? '
                  : '¿Todavía no tienes una cuenta? '}
                <button
                  className="auth-link"
                  type="button"
                  onClick={() => {
                    setMode(mode === 'register' ? 'login' : 'register')
                    setMessage('')
                    setErrorMessage('')
                  }}
                >
                  {mode === 'register' ? 'Inicia sesión' : 'Regístrate'}
                </button>
              </>
            )}
          </p>

          <p className="auth-legal">
            Mantén tus datos de acceso seguros.
          </p>
        </div>
      </section>
    </main>
  )
}

export default Auth
