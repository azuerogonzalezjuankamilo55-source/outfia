import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from './supabase'
import './Profile.css'

type ProfileData = {
  full_name: string
  phone: string
}

type ProfileProps = {
  session: Session
}

export default function Profile({ session }: ProfileProps) {

  const [email, setEmail] = useState('')
  const [profile, setProfile] = useState<ProfileData>({
    full_name: '',
    phone: '',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editing, setEditing] = useState(false)
  const [message, setMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    async function loadProfile() {
      setLoading(true)
      setErrorMessage('')

      try {
        const { data: userData, error: userError } =
  await supabase.auth.getUser()

if (userError) throw userError

const user = userData.user ?? session.user

if (!user) {
  throw new Error('Debes iniciar sesión para ver tu perfil.')
}
        setEmail(user.email ?? '')

        const { data, error } = await supabase
          .from('profiles')
          .select('full_name, phone')
          .eq('id', user.id)
          .maybeSingle()

        if (error) throw error

        if (!data) {
          throw new Error(
            'No se encontró tu perfil. Verifica que se haya creado correctamente.'
          )
        }

        setProfile({
          full_name:
            data.full_name ?? user.user_metadata?.full_name ?? '',
          phone: data.phone ?? '',
        })
      } catch (err) {
        setErrorMessage(
          err instanceof Error
            ? err.message
            : 'No se pudo cargar el perfil.'
        )
      } finally {
        setLoading(false)
      }
    }

    void loadProfile()
    }, [session])

  function handleChange(
    field: keyof ProfileData,
    value: string
  ) {
    setProfile((current) => ({
      ...current,
      [field]: value,
    }))
  }

  async function saveProfile() {
    setSaving(true)
    setMessage('')
    setErrorMessage('')

    try {
      const { data: userData, error: userError } =
        await supabase.auth.getUser()

      if (userError || !userData.user) {
        throw new Error('Tu sesión ha expirado. Inicia sesión de nuevo.')
      }

      const user = userData.user
      const fullName = profile.full_name.trim()
      const phone = profile.phone.trim()

      if (!fullName) {
        throw new Error('El nombre no puede estar vacío.')
      }

      const { data, error } = await supabase
        .from('profiles')
        .update({
          full_name: fullName,
          phone: phone || null,
        })
        .eq('id', user.id)
        .select('id')

      if (error) throw error

      if (!data || data.length === 0) {
        throw new Error(
          'No se pudo actualizar el perfil. Comprueba las políticas RLS.'
        )
      }

      setProfile({
        full_name: fullName,
        phone,
      })
      setEditing(false)
      setMessage('Tu perfil se actualizó correctamente.')
    } catch (err) {
      setErrorMessage(
        err instanceof Error
          ? err.message
          : 'Ocurrió un error al guardar los cambios.'
      )
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="profile-page">Cargando perfil...</div>
  }

  return (
    <main className="profile-page">
      <section className="profile-card">
        <div className="profile-header">
          <div className="profile-avatar">
            {profile.full_name.charAt(0).toUpperCase() || '?'}
          </div>

          <div>
            <h1>Mi perfil</h1>
            <p>Administra tu información personal</p>
          </div>
        </div>

        {message && (
          <div className="profile-message" role="status">
            {message}
          </div>
        )}

        {errorMessage && (
          <div className="profile-error" role="alert">
            {errorMessage}
          </div>
        )}

        <div className="profile-field">
          <label htmlFor="profile-email">Correo electrónico</label>
          <input
            id="profile-email"
            type="email"
            value={email}
            readOnly
          />
          <small>Este es el correo de tu cuenta.</small>
        </div>

        <div className="profile-field">
          <label htmlFor="profile-name">Nombre completo</label>
          <input
            id="profile-name"
            type="text"
            value={profile.full_name}
            onChange={(e) =>
              handleChange('full_name', e.target.value)
            }
            readOnly={!editing}
            maxLength={100}
            autoComplete="name"
          />
        </div>

        <div className="profile-field">
          <label htmlFor="profile-phone">Teléfono</label>
          <input
            id="profile-phone"
            type="tel"
            value={profile.phone}
            onChange={(e) =>
              handleChange('phone', e.target.value)
            }
            readOnly={!editing}
            maxLength={30}
            autoComplete="tel"
            placeholder="Añade tu teléfono"
          />
        </div>

        <div className="profile-actions">
          {editing ? (
            <>
              <button
                type="button"
                onClick={() => {
                  setEditing(false)
                  setMessage('')
                  setErrorMessage('')
                  window.location.reload()
                }}
                disabled={saving}
                className="profile-secondary"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={saveProfile}
                disabled={saving}
                className="profile-primary"
              >
                {saving ? 'Guardando...' : 'Guardar cambios'}
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => {
                setMessage('')
                setErrorMessage('')
                setEditing(true)
              }}
              className="profile-primary"
            >
              Editar perfil
            </button>
          )}
        </div>
      </section>
    </main>
  )
}