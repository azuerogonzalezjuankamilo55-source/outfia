import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import {
  Menu,
  Search,
  Heart,
  Shirt,
  Sparkles,
  CalendarDays,
  UserRound,
  Plus,
  ArrowUpRight,
  Bookmark,
  X,
  LogOut,
} from 'lucide-react'

import Auth from './Auth'
import Profile from './Profile'
import { supabase } from './supabase'
import './App.css'

const outfits = [
  {
    id: 1,
    name: 'Quiet Luxury',
    category: 'ELEGANTE · CASUAL',
    image:
      'https://images.unsplash.com/photo-1617137968427-85924c800a22?auto=format&fit=crop&w=800&q=85',
    colors: ['#D8C8B5', '#292929', '#F1EDE5'],
  },
  {
    id: 2,
    name: 'Urban Essential',
    category: 'URBANO · MINIMALISTA',
    image:
      'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=800&q=85',
    colors: ['#B5A28D', '#353535', '#E8E0D4'],
  },
  {
    id: 3,
    name: 'Modern Classic',
    category: 'CLÁSICO · MODERNO',
    image:
      'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=800&q=85',
    colors: ['#B8B5AD', '#252525', '#D9C7AE'],
  },
]

const navigation = [
  { label: 'Inicio', icon: Sparkles },
  { label: 'Mi armario', icon: Shirt },
  { label: 'Crear outfit', icon: Plus },
  { label: 'Calendario', icon: CalendarDays },
  { label: 'Favoritos', icon: Heart },
  { label: 'Mi perfil', icon: UserRound },
]

function App() {
  const [session, setSession] = useState<Session | null>(null)
  const [authReady, setAuthReady] = useState(false)
  const [active, setActive] = useState('Inicio')
  const [saved, setSaved] = useState<number[]>([])
  const [menuOpen, setMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [search, setSearch] = useState('')

  useEffect(() => {
    let mounted = true

    const loadSession = async () => {
      const { data, error } = await supabase.auth.getSession()

      if (!mounted) return

      if (error) {
        console.error('Error consultando la sesión:', error.message)
      }

      setSession(data.session)
      setAuthReady(true)
    }

    void loadSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!mounted) return
      setSession(nextSession)
      setAuthReady(true)
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  const handleAuthenticated = async () => {
    const { data, error } = await supabase.auth.getSession()

    if (error) {
      console.error('Error cargando la sesión:', error.message)
      return
    }

    setSession(data.session)
  }

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut()

    if (error) {
      window.alert('No se pudo cerrar la sesión. Inténtalo de nuevo.')
      console.error('Error cerrando sesión:', error.message)
      return
    }

    setActive('Inicio')
    setMenuOpen(false)
    setSaved([])
  }

  const filteredOutfits = outfits.filter((outfit) =>
    `${outfit.name} ${outfit.category}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  )

  const toggleSaved = (id: number) => {
    setSaved((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    )
  }

  const navigate = (section: string) => {
    setActive(section)
    setMenuOpen(false)

    if (section === 'Mi perfil' || section === 'Inicio') {
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }

    if (section === 'Crear outfit') {
      document.getElementById('crear')?.scrollIntoView({ behavior: 'smooth' })
      return
    }

    document.getElementById('coleccion')?.scrollIntoView({ behavior: 'smooth' })
  }

  if (!authReady) {
    return (
      <main className="loading-screen">
        <div className="loading-mark">O</div>
        <p>Preparando tu espacio OUTFIA...</p>
      </main>
    )
  }

  if (!session) {
    return <Auth onAuthenticated={handleAuthenticated} />
  }

  const displayName =
    session.user.user_metadata?.full_name ||
    session.user.user_metadata?.name ||
    session.user.email?.split('@')[0] ||
    'Mi perfil'

  const visibleOutfits =
    active === 'Favoritos'
      ? filteredOutfits.filter((outfit) => saved.includes(outfit.id))
      : filteredOutfits

  return (
    <div className="app-shell">
      <aside className={`sidebar ${menuOpen ? 'sidebar-open' : ''}`}>
        <a
          className="brand"
          href="#inicio"
          onClick={(event) => {
            event.preventDefault()
            navigate('Inicio')
          }}
        >
          <span className="brand-mark">O</span>
          <span>OUTFIA</span>
        </a>

        <p className="nav-caption">MENÚ PRINCIPAL</p>

        <nav className="side-nav" aria-label="Navegación principal">
          {navigation.map(({ label, icon: Icon }) => (
            <button
              type="button"
              className={`nav-item ${active === label ? 'active' : ''}`}
              key={label}
              onClick={() => navigate(label)}
              aria-current={active === label ? 'page' : undefined}
            >
              <Icon size={18} strokeWidth={1.7} />
              <span>{label}</span>
              {label === 'Favoritos' && saved.length > 0 && (
                <span className="nav-count">{saved.length}</span>
              )}
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="style-card">
            <Sparkles size={19} />
            <p>Tu estilo evoluciona contigo.</p>
            <span>Descubre nuevas combinaciones cada día.</span>
          </div>

          <button
            type="button"
            className="profile-button"
            onClick={() => navigate('Mi perfil')}
            title={`Ver perfil de ${displayName}`}
          >
            <span className="avatar">
              {displayName.trim().charAt(0).toUpperCase() || 'U'}
            </span>
            <span className="profile-copy">
              <strong>{displayName}</strong>
              <small>Mi perfil</small>
            </span>
            <UserRound size={16} />
          </button>

          <button
            type="button"
            className="nav-item signout-button"
            onClick={() => void handleSignOut()}
          >
            <LogOut size={18} strokeWidth={1.7} />
            <span>Cerrar sesión</span>
          </button>
        </div>
      </aside>

      {menuOpen && (
        <button
          type="button"
          className="mobile-overlay"
          aria-label="Cerrar menú"
          onClick={() => setMenuOpen(false)}
        />
      )}

      <main className="main-content" id="inicio">
        <header className="topbar">
          <button
            type="button"
            className="icon-button mobile-menu"
            aria-label="Abrir menú"
            onClick={() => setMenuOpen(true)}
          >
            <Menu size={21} />
          </button>

          <div className="breadcrumb">
            <span>OUTFIA</span>
            <span className="breadcrumb-divider">/</span>
            <span className="breadcrumb-current">{active}</span>
          </div>

          <div className="topbar-actions">
            {searchOpen ? (
              <div className="search-box">
                <Search size={17} />
                <input
                  autoFocus
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Buscar estilos..."
                  aria-label="Buscar outfits"
                />
                <button
                  type="button"
                  className="search-close"
                  aria-label="Cerrar búsqueda"
                  onClick={() => {
                    setSearchOpen(false)
                    setSearch('')
                  }}
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              <button
                type="button"
                className="icon-button"
                aria-label="Buscar outfits"
                onClick={() => setSearchOpen(true)}
              >
                <Search size={19} />
              </button>
            )}

            <button
              type="button"
              className="icon-button profile-icon"
              aria-label="Ver mi perfil"
              title="Mi perfil"
              onClick={() => navigate('Mi perfil')}
            >
              <UserRound size={19} />
            </button>

            <button
              type="button"
              className="icon-button"
              aria-label="Cerrar sesión"
              title="Cerrar sesión"
              onClick={() => void handleSignOut()}
            >
              <LogOut size={19} />
            </button>
          </div>
        </header>

        <div className="page-content">
          {active === 'Mi perfil' ? (
            <Profile session={session} />
          ) : (
            <>
              <section className="welcome-row">
                <div>
                  <p className="eyebrow">STYLE CONNECTS PEOPLE</p>
                  <h1>
                    Más que ropa,
                    <br />
                    <span>es tu estilo.</span>
                  </h1>
                  <p className="welcome-description">
                    Descubre nuevas formas de expresarte, guarda tus looks
                    favoritos y encuentra inspiración para tu próximo outfit.
                  </p>
                </div>
                <div className="today-label">
                  <span className="today-dot" />
                  <span>Tu espacio de estilo</span>
                </div>
              </section>

              <section className="hero-banner">
                <img
                  className="hero-image"
                  src="https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1800&q=90"
                  alt="Personas explorando moda urbana"
                />
                <div className="hero-overlay" />
                <div className="hero-content">
                  <span className="hero-kicker">
                    <Sparkles size={14} />
                    ENCUENTRA TU IDENTIDAD
                  </span>
                  <h2>
                    Tu estilo.
                    <br />
                    Tus reglas.
                  </h2>
                  <p>
                    Inspírate, experimenta y crea una identidad que hable por ti.
                  </p>
                  <button
                    type="button"
                    className="hero-button"
                    onClick={() => navigate('Crear outfit')}
                  >
                    Explorar estilos
                    <ArrowUpRight size={17} />
                  </button>
                </div>
                <div className="hero-index">
                  <span>01</span>
                  <span className="hero-index-line" />
                  <span>STYLE CONNECTS PEOPLE</span>
                </div>
              </section>

              <section className="stats-row" aria-label="Funciones de OUTFIA">
                <div className="stat-item">
                  <span className="stat-icon"><Shirt size={19} /></span>
                  <div>
                    <strong>Tu armario</strong>
                    <span>Organiza tus prendas</span>
                  </div>
                </div>
                <div className="stat-item">
                  <span className="stat-icon"><Sparkles size={19} /></span>
                  <div>
                    <strong>Nuevas ideas</strong>
                    <span>Inspírate cada día</span>
                  </div>
                </div>
                <div className="stat-item">
                  <span className="stat-icon"><Heart size={19} /></span>
                  <div>
                    <strong>Tus favoritos</strong>
                    <span>Guarda lo que te gusta</span>
                  </div>
                </div>
              </section>

              <section className="collection-section" id="coleccion">
                <div className="section-heading">
                  <div>
                    <p className="eyebrow">INSPIRACIÓN PARA TI</p>
                    <h2>
                      {active === 'Favoritos' ? 'Tus looks guardados' : 'Explora los outfits'}
                    </h2>
                    <p className="section-description">
                      Ideas de estilo para inspirar tu próxima combinación.
                    </p>
                  </div>
                  <button
                    type="button"
                    className="text-button"
                    onClick={() => {
                      setActive('Inicio')
                      setSearch('')
                    }}
                  >
                    Ver colección <ArrowUpRight size={16} />
                  </button>
                </div>

                {visibleOutfits.length > 0 ? (
                  <div className="outfit-grid">
                    {visibleOutfits.map((outfit, index) => {
                      const isSaved = saved.includes(outfit.id)
                      return (
                        <article className="outfit-card" key={outfit.id}>
                          <div className="outfit-image-wrap">
                            <img
                              className="outfit-image"
                              src={outfit.image}
                              alt={`Inspiración de estilo ${outfit.name}`}
                              loading={index === 0 ? 'eager' : 'lazy'}
                            />
                            <span className="look-number">LOOK 0{outfit.id}</span>
                            <button
                              type="button"
                              className={`save-button ${isSaved ? 'saved' : ''}`}
                              aria-label={
                                isSaved
                                  ? `Quitar ${outfit.name} de favoritos`
                                  : `Guardar ${outfit.name} en favoritos`
                              }
                              aria-pressed={isSaved}
                              onClick={() => toggleSaved(outfit.id)}
                            >
                              <Bookmark size={18} fill={isSaved ? 'currentColor' : 'none'} />
                            </button>
                            <span className="outfit-category">{outfit.category}</span>
                          </div>
                          <div className="outfit-info">
                            <div>
                              <h3>{outfit.name}</h3>
                              <p>Inspiración de temporada</p>
                            </div>
                            <div className="color-palette" aria-label="Paleta de colores">
                              {outfit.colors.map((color) => (
                                <span
                                  key={color}
                                  className="color-dot"
                                  style={{ backgroundColor: color }}
                                />
                              ))}
                            </div>
                          </div>
                        </article>
                      )
                    })}
                  </div>
                ) : (
                  <div className="empty-state">
                    <Heart size={30} strokeWidth={1.4} />
                    <h3>
                      {active === 'Favoritos' ? 'Aún no tienes favoritos' : 'No encontramos resultados'}
                    </h3>
                    <p>
                      {active === 'Favoritos'
                        ? 'Guarda los looks que te gusten con el icono de marcador.'
                        : 'Prueba con otro nombre o categoría.'}
                    </p>
                    <button
                      type="button"
                      className="hero-button"
                      onClick={() => {
                        setActive('Inicio')
                        setSearch('')
                      }}
                    >
                      Explorar looks
                    </button>
                  </div>
                )}
              </section>

              <section className="create-banner" id="crear">
                <div className="create-icon"><Sparkles size={23} /></div>
                <div className="create-copy">
                  <p className="eyebrow">TU CREATIVIDAD, TU REGLA</p>
                  <h2>El próximo look lo creas tú.</h2>
                  <p>
                    Estamos preparando un espacio para combinar prendas y
                    construir outfits a tu manera.
                  </p>
                </div>
                <button
                  type="button"
                  className="create-button"
                  onClick={() =>
                    window.alert('El creador de outfits será una de las próximas funciones de OUTFIA.')
                  }
                >
                  <Plus size={18} />
                  Próximamente
                </button>
              </section>
            </>
          )}

          <footer className="footer">
            <a
              className="footer-brand"
              href="#inicio"
              onClick={(event) => {
                event.preventDefault()
                navigate('Inicio')
              }}
            >
              OUTFIA.
            </a>
            <span>Más que ropa, es tu estilo.</span>
            <span>© 2026 OUTFIA</span>
          </footer>
        </div>
      </main>

      <nav className="mobile-nav" aria-label="Navegación móvil">
        {[navigation[0], navigation[1], navigation[4], navigation[5]].map(
          ({ label, icon: Icon }) => (
            <button
              type="button"
              key={label}
              className={`mobile-nav-item ${active === label ? 'active' : ''}`}
              onClick={() => navigate(label)}
            >
              <Icon size={20} />
              <span>{label}</span>
            </button>
          ),
        )}
      </nav>
    </div>
  )
}

export default App
