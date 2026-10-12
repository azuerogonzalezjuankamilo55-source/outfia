
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
  const [avatarUrl, setAvatarUrl] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [editing, setEditing] = useState(false)
  const [message, setMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    let cancelled = false

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

        if (cancelled) return

        setProfile({
          full_name:
            data.full_name ?? user.user_metadata?.full_name ?? '',
          phone: data.phone ?? '',
        })

        // Buscar la foto del usuario en su carpeta privada.
        const { data: files, error: listError } =
          await supabase.storage
            .from('profile-photos')
            .list(user.id, { limit: 20 })

        if (listError) throw listError

        const photo = files?.find(
          (file) => file.name.startsWith('avatar.')
        )

        if (photo) {
          const { data: signedData, error: signedError } =
            await supabase.storage
              .from('profile-photos')
              .createSignedUrl(
                `${user.id}/${photo.name}`,
                3600
              )

          if (signedError) throw signedError

          if (!cancelled) {
            setAvatarUrl(signedData.signedUrl)
          }
        } else if (!cancelled) {
          setAvatarUrl('')
        }
      } catch (err) {
        if (!cancelled) {
          setErrorMessage(
            err instanceof Error
              ? err.message
              : 'No se pudo cargar el perfil.'
          )
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void loadProfile()

    return () => {
      cancelled = true
    }
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
        throw new Error(
          'Tu sesión ha expirado. Inicia sesión de nuevo.'
        )
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

  async function uploadPhoto(file: File) {
    setUploadingPhoto(true)
    setMessage('')
    setErrorMessage('')

    try {
      const { data: userData, error: userError } =
        await supabase.auth.getUser()

      if (userError || !userData.user) {
        throw new Error(
          'Tu sesión ha expirado. Inicia sesión de nuevo.'
        )
      }

      const user = userData.user

      const allowedTypes = [
        'image/jpeg',
        'image/png',
        'image/webp',
        'image/gif',
      ]

      if (!allowedTypes.includes(file.type)) {
        throw new Error(
          'Usa una imagen JPG, PNG, WEBP o GIF.'
        )
      }

      if (file.size > 5 * 1024 * 1024) {
        throw new Error(
          'La imagen debe pesar menos de 5 MB.'
        )
      }

      const extensionByType: Record<string, string> = {
        'image/jpeg': 'jpg',
        'image/png': 'png',
        'image/webp': 'webp',
        'image/gif': 'gif',
      }

      const extension = extensionByType[file.type]
      const filePath = `${user.id}/avatar.${extension}`

      // Eliminar la foto anterior para permitir cambiar
      // de formato sin dejar archivos antiguos.
      const { data: existingFiles, error: listError } =
        await supabase.storage
          .from('profile-photos')
          .list(user.id, { limit: 20 })

      if (listError) throw listError

      const previousPhotos = (existingFiles ?? [])
        .filter((item) => item.name.startsWith('avatar.'))
        .map((item) => `${user.id}/${item.name}`)
        .filter((path) => path !== filePath)

      if (previousPhotos.length > 0) {
        const { error: removeError } =
          await supabase.storage
            .from('profile-photos')
            .remove(previousPhotos)

        if (removeError) throw removeError
      }

      const { error: uploadError } =
        await supabase.storage
          .from('profile-photos')
          .upload(filePath, file, {
            upsert: true,
            contentType: file.type,
            cacheControl: '3600',
          })

      if (uploadError) throw uploadError

      const { data: signedData, error: signedError } =
        await supabase.storage
          .from('profile-photos')
          .createSignedUrl(filePath, 3600)

      if (signedError) throw signedError

      setAvatarUrl(signedData.signedUrl)
      setMessage('Tu foto de perfil se actualizó correctamente.')
    } catch (err) {
      setErrorMessage(
        err instanceof Error
          ? err.message
          : 'No se pudo subir la foto.'
      )
    } finally {
      setUploadingPhoto(false)
    }
  }

  if (loading) {
    return (
      <div className="profile-page">
        Cargando perfil...
      </div>
    )
  }

  return (
    <main className="profile-page">
      <section className="profile-card">
        <div className="profile-header">
          <div className="profile-photo-container">
            <div className="profile-avatar">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt="Foto de perfil"
                />
              ) : (
                profile.full_name.charAt(0).toUpperCase() || '?'
              )}
            </div>

            <label className="profile-photo-button">
              {uploadingPhoto
                ? 'Subiendo foto...'
                : avatarUrl
                  ? 'Cambiar foto'
                  : 'Añadir foto'}

              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                disabled={uploadingPhoto}
                hidden
                onChange={(event) => {
                  const file = event.currentTarget.files?.[0]

                  if (file) {
                    void uploadPhoto(file)
                  }

                  event.currentTarget.value = ''
                }}
              />
            </label>
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
          <label htmlFor="profile-email">
            Correo electrónico
          </label>
          <input
            id="profile-email"
            type="email"
            value={email}
            readOnly
          />
          <small>Este es el correo de tu cuenta.</small>
        </div>

        <div className="profile-field">
          <label htmlFor="profile-name">
            Nombre completo
          </label>
          <input
            id="profile-name"
            type="text"
            value={profile.full_name}
            onChange={(event) =>
              handleChange(
                'full_name',
                event.target.value
              )
            }
            readOnly={!editing}
            maxLength={100}
            autoComplete="name"
          />
        </div>

        <div className="profile-field">
          <label htmlFor="profile-phone">
            Teléfono
          </label>
          <input
            id="profile-phone"
            type="tel"
            value={profile.phone}
            onChange={(event) =>
              handleChange('phone', event.target.value)
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
                }}
                disabled={saving}
                className="profile-secondary"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={() => void saveProfile()}
                disabled={saving}
                className="profile-primary"
              >
                {saving
                  ? 'Guardando...'
                  : 'Guardar cambios'}
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
