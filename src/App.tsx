

import { useEffect, useState } from 'react'

import type { FormEvent } from 'react'

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

  Trash2,

  Tag,

  ImagePlus,

  Camera,

} from 'lucide-react'

import Auth from './Auth'

import Profile from './Profile'

import { supabase } from './supabase'

import './App.css'

type WardrobeItem = {

  id: string

  user_id: string

  name: string

  category: string

  color: string | null

  brand: string | null

  image_path: string | null

  imageUrl?: string

  created_at: string

}

const clothingCategories = [

  'Camisetas',

  'Pantalones',

  'Chaquetas',

  'Sudaderas',

  'Calzado',

  'Accesorios',

  'Otros',

]

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
  const [selectedWardrobeIds, setSelectedWardrobeIds] = useState<string[]>([])
  const [outfitName, setOutfitName] = useState('')
  const [outfitStyle, setOutfitStyle] = useState('Urbano')
  const [savingOutfit, setSavingOutfit] = useState(false)
  const [outfitMessage, setOutfitMessage] = useState('')
  const [saved, setSaved] = useState<number[]>([])

  const [menuOpen, setMenuOpen] = useState(false)

  const [searchOpen, setSearchOpen] = useState(false)

  const [search, setSearch] = useState('')

  // Estados del armario

  const [wardrobeItems, setWardrobeItems] = useState<WardrobeItem[]>([])

  const [wardrobeLoading, setWardrobeLoading] = useState(false)

  const [wardrobeError, setWardrobeError] = useState('')

  const [wardrobeCategory, setWardrobeCategory] = useState('Todas')

  const [showAddItem, setShowAddItem] = useState(false)

  const [itemName, setItemName] = useState('')

  const [itemCategory, setItemCategory] = useState('Camisetas')

  const [itemColor, setItemColor] = useState('')

  const [itemBrand, setItemBrand] = useState('')

  const [savingItem, setSavingItem] = useState(false)
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState('')

  const handleImageChange = (file?: File) => {
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setWardrobeError('Selecciona un archivo de imagen válido.')
      return
    }

    if (file.size > 8 * 1024 * 1024) {
      setWardrobeError('La imagen debe pesar menos de 8 MB.')
      return
    }

    setWardrobeError('')
    setSelectedImage(file)
    setImagePreview(URL.createObjectURL(file))
  }

  // Consultar la sesión

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

  // Cargar las prendas del usuario desde Supabase

  useEffect(() => {

    if (!session) {

      setWardrobeItems([])

      setWardrobeLoading(false)

      return

    }

    let cancelled = false

    const loadWardrobe = async () => {

      setWardrobeLoading(true)

      setWardrobeError('')

      const { data, error } = await supabase

        .from('wardrobe_items')

        .select('*')

        .eq('user_id', session.user.id)

        .order('created_at', { ascending: false })

      if (cancelled) return

      if (error) {

        setWardrobeError('No se pudieron cargar tus prendas.')

        console.error('Error cargando el armario:', error.message)

      } else {

        const items = (data ?? []) as WardrobeItem[]
        const itemsWithImages = await Promise.all(
          items.map(async (item) => {
            if (!item.image_path) return item

            const { data: imageData, error: imageError } = await supabase.storage
              .from('wardrobe-images')
              .createSignedUrl(item.image_path, 86400)

            if (imageError) {
              console.error('Error obteniendo la imagen:', imageError.message)
              return { ...item, imageUrl: '' }
            }

            return { ...item, imageUrl: imageData.signedUrl }
          }),
        )

        if (!cancelled) setWardrobeItems(itemsWithImages)

      }

      setWardrobeLoading(false)

    }

    void loadWardrobe()

    return () => {

      cancelled = true

    }

  }, [session])

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

      window.alert('No se pudo cerrar sesión. Inténtalo de nuevo.')

      console.error('Error cerrando sesión:', error.message)

      return

    }

    setActive('Inicio')

    setMenuOpen(false)

    setSaved([])

    setWardrobeItems([])

  }

  // Agregar una prenda con foto a Supabase Storage
  const handleAddItem = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!session) return

    const name = itemName.trim()
    if (!name) {
      setWardrobeError('Escribe el nombre de la prenda.')
      return
    }
    if (!selectedImage) {
      setWardrobeError('Selecciona o toma una foto de la prenda.')
      return
    }

    setSavingItem(true)
    setWardrobeError('')
    let imagePath = ''

    try {
      const safeName = selectedImage.name.replace(/[^a-zA-Z0-9._-]/g, '_')
      imagePath = `${session.user.id}/${crypto.randomUUID()}-${safeName}`

      const { error: uploadError } = await supabase.storage
        .from('wardrobe-images')
        .upload(imagePath, selectedImage, {
          contentType: selectedImage.type,
          upsert: false,
        })
      if (uploadError) throw uploadError

      const { data: item, error: insertError } = await supabase
        .from('wardrobe_items')
        .insert({
          user_id: session.user.id,
          name,
          category: itemCategory,
          color: itemColor.trim() || null,
          brand: itemBrand.trim() || null,
          image_path: imagePath,
        })
        .select('*')
        .single()
      if (insertError) throw insertError

      const { data: signedImage, error: signedError } = await supabase.storage
        .from('wardrobe-images')
        .createSignedUrl(imagePath, 86400)
      if (signedError) throw signedError

      setWardrobeItems((current) => [
        { ...(item as WardrobeItem), imageUrl: signedImage.signedUrl },
        ...current,
      ])
      setItemName('')
      setItemCategory('Camisetas')
      setItemColor('')
      setItemBrand('')
      setSelectedImage(null)
      setImagePreview('')
      setShowAddItem(false)
    } catch (error) {
      console.error('Error guardando la prenda:', error)
      if (imagePath) {
        const { error: cleanupError } = await supabase.storage
          .from('wardrobe-images')
          .remove([imagePath])
        if (cleanupError) console.error('No se pudo limpiar la imagen:', cleanupError.message)
      }
      setWardrobeError('No se pudo guardar la prenda. Revisa la conexión e inténtalo de nuevo.')
    } finally {
      setSavingItem(false)
    }
  }

  // Eliminar una prenda y su imagen guardada
  const handleDeleteItem = async (id: string) => {
    const confirmed = window.confirm('¿Seguro que quieres eliminar esta prenda de tu armario?')
    if (!confirmed) return

    const item = wardrobeItems.find((current) => current.id === id)
    setWardrobeError('')

    const { error } = await supabase
      .from('wardrobe_items')
      .delete()
      .eq('id', id)
      .eq('user_id', session?.user.id)

    if (error) {
      setWardrobeError('No se pudo eliminar la prenda.')
      console.error('Error eliminando la prenda:', error.message)
      return
    }

    if (item?.image_path) {
      const { error: storageError } = await supabase.storage
        .from('wardrobe-images')
        .remove([item.image_path])
      if (storageError) console.error('No se pudo eliminar la imagen:', storageError.message)
    }

    setWardrobeItems((current) => current.filter((currentItem) => currentItem.id !== id))
  }

  const filteredOutfits = outfits.filter((outfit) =>

    `${outfit.name} ${outfit.category}`

      .toLowerCase()

      .includes(search.toLowerCase()),

  )

  const visibleOutfits =

    active === 'Favoritos'

      ? filteredOutfits.filter((outfit) => saved.includes(outfit.id))

      : filteredOutfits

  const visibleWardrobe = wardrobeItems.filter((item) => {

    const matchesCategory =

      wardrobeCategory === 'Todas' ||

      item.category === wardrobeCategory

    const matchesSearch =

      `${item.name} ${item.category} ${item.color ?? ''} ${item.brand ?? ''}`

        .toLowerCase()

        .includes(search.toLowerCase())

    return matchesCategory && matchesSearch

  })

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

    if (

      section === 'Mi perfil' ||

      section === 'Inicio' ||

      section === 'Mi armario'

    ) {

      window.scrollTo({ top: 0, behavior: 'smooth' })

      return

    }

    if (section === 'Crear outfit') {

      document.getElementById('crear')?.scrollIntoView({

        behavior: 'smooth',

      })

      return

    }

    document.getElementById('coleccion')?.scrollIntoView({

      behavior: 'smooth',

    })

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

  const generateOutfit = () => {
    if (wardrobeItems.length === 0) {
      setOutfitMessage('Agrega prendas a tu armario para poder generar un outfit.')
      return
    }

    const groups: Record<string, WardrobeItem[]> = {
      top: [], bottom: [], shoes: [], outerwear: [], accessory: [], other: [],
    }
    wardrobeItems.forEach((item) => {
      const category = `${item.category} ${item.name}`.toLocaleLowerCase()
      if (/camiseta|camisa|blusa|top|polo|crop|su[eé]ter|buzo/.test(category)) groups.top.push(item)
      else if (/pantal[oó]n|jean|falda|short|bermuda/.test(category)) groups.bottom.push(item)
      else if (/zapato|zapatilla|tenis|bota|calzado/.test(category)) groups.shoes.push(item)
      else if (/chaqueta|abrigo|saco|chaleco/.test(category)) groups.outerwear.push(item)
      else if (/accesorio|gorra|bufanda|cuellero|bolso|gafas|cintur[oó]n/.test(category)) groups.accessory.push(item)
      else groups.other.push(item)
    })

    const pick = (items: WardrobeItem[]) => items.length ? items[Math.floor(Math.random() * items.length)] : undefined
    const chosen = [pick(groups.top), pick(groups.bottom), pick(groups.shoes), pick(groups.outerwear), pick(groups.accessory)]
      .filter((item): item is WardrobeItem => Boolean(item))
    if (chosen.length < 2) {
      const extras = wardrobeItems.filter((item) => !chosen.some((picked) => picked.id === item.id))
      while (chosen.length < 2 && extras.length) chosen.push(extras.splice(Math.floor(Math.random() * extras.length), 1)[0])
    }
    if (chosen.length < 2) {
      setOutfitMessage('Agrega al menos dos prendas diferentes para generar una combinación.')
      return
    }
    setSelectedWardrobeIds(chosen.map((item) => item.id))
    setOutfitName((current) => current.trim() ? current : `Look ${outfitStyle.toLowerCase()} ${Math.floor(Math.random() * 900 + 100)}`)
    setOutfitMessage('¡Combinación creada! Puedes cambiar prendas y guardar tu outfit.')
  }

  const saveOutfit = async () => {
    if (!session) {
      setOutfitMessage('Inicia sesión para guardar tu outfit.')
      return
    }

    if (!outfitName.trim()) {
      setOutfitMessage('Escribe un nombre para tu outfit.')
      return
    }

    if (selectedWardrobeIds.length === 0) {
      setOutfitMessage('Selecciona al menos una prenda.')
      return
    }

    setSavingOutfit(true)
    setOutfitMessage('')

    try {
      const { data: createdOutfit, error: outfitError } = await supabase
        .from('outfits')
        .insert({
          user_id: session.user.id,
          name: outfitName.trim(),
          style: outfitStyle,
        })
        .select('id')
        .single()

      if (outfitError) throw outfitError

      const { error: itemsError } = await supabase
        .from('outfit_items')
        .insert(
          selectedWardrobeIds.map((wardrobeItemId) => ({
            outfit_id: createdOutfit.id,
            wardrobe_item_id: wardrobeItemId,
          })),
        )

      if (itemsError) {
        await supabase.from('outfits').delete().eq('id', createdOutfit.id)
        throw itemsError
      }

      setOutfitMessage('¡Outfit guardado correctamente!')
      setOutfitName('')
      setSelectedWardrobeIds([])
    } catch (error) {
      console.error('Error guardando outfit:', error)
      setOutfitMessage('No se pudo guardar. Revisa la conexión e inténtalo de nuevo.')
    } finally {
      setSavingOutfit(false)
    }
  }

  const displayName =

    session.user.user_metadata?.full_name ||

    session.user.user_metadata?.name ||

    session.user.email?.split('@')[0] ||

    'Mi perfil'

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

            <LogOut size={18} />

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

                  placeholder={

                    active === 'Mi armario'

                      ? 'Buscar prendas...'

                      : 'Buscar estilos...'

                  }

                  aria-label="Buscar"

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

                aria-label="Buscar"

                onClick={() => setSearchOpen(true)}

              >

                <Search size={19} />

              </button>

            )}

            <button

              type="button"

              className="icon-button profile-icon"

              aria-label="Ver mi perfil"

              onClick={() => navigate('Mi perfil')}

            >

              <UserRound size={19} />

            </button>

            <button

              type="button"

              className="icon-button"

              aria-label="Cerrar sesión"

              onClick={() => void handleSignOut()}

            >

              <LogOut size={19} />

            </button>

          </div>

        </header>

        <div className="page-content">

          {active === 'Mi perfil' ? (

            <Profile session={session} />

          ) : active === 'Mi armario' ? (

            <section className="collection-section wardrobe-page">

              <div className="section-heading">

                <div>

                  <p className="eyebrow">TU ESPACIO PERSONAL</p>

                  <h2>Mi armario</h2>

                  <p className="section-description">

                    Organiza tus prendas y descubre todo lo que tienes.

                  </p>

                </div>

                <button

                  type="button"

                  className="hero-button"

                  onClick={() => {

                    setShowAddItem((current) => !current)

                    setWardrobeError('')

                  }}

                >

                  {showAddItem ? <X size={17} /> : <Plus size={17} />}

                  {showAddItem ? 'Cancelar' : 'Agregar prenda'}

                </button>

              </div>

              {wardrobeError && (

                <p className="wardrobe-message" role="alert">

                  {wardrobeError}

                </p>

              )}

              {showAddItem && (

                <form

                  className="wardrobe-form"

                  onSubmit={(event) => void handleAddItem(event)}

                >

                  <h3>Nueva prenda</h3>

                  <div className="wardrobe-photo-picker">
                    <p>Foto de tu prenda *</p>
                    <div className="wardrobe-photo-actions">
                      <label className="hero-button" htmlFor="wardrobe-gallery">
                        <ImagePlus size={17} /> Elegir foto
                      </label>
                      <input
                        id="wardrobe-gallery"
                        type="file"
                        accept="image/*"
                        onChange={(event) => handleImageChange(event.target.files?.[0])}
                        hidden
                      />
                      <label className="hero-button" htmlFor="wardrobe-camera">
                        <Camera size={17} /> Tomar foto
                      </label>
                      <input
                        id="wardrobe-camera"
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={(event) => handleImageChange(event.target.files?.[0])}
                        hidden
                      />
                    </div>
                    {imagePreview && (
                      <div className="wardrobe-photo-preview">
                        <img src={imagePreview} alt="Vista previa de la prenda" />
                        <button
                          type="button"
                          className="text-button"
                          onClick={() => {
                            URL.revokeObjectURL(imagePreview)
                            setSelectedImage(null)
                            setImagePreview('')
                          }}
                        >
                          Quitar foto
                        </button>
                      </div>
                    )}
                  </div>

                  <label htmlFor="item-name">Nombre de la prenda *</label>

                  <input

                    id="item-name"

                    value={itemName}

                    onChange={(event) => setItemName(event.target.value)}

                    placeholder="Ej. Camiseta negra oversize"

                    maxLength={100}

                    required

                  />

                  <label htmlFor="item-category">Categoría</label>

                  <select

                    id="item-category"

                    value={itemCategory}

                    onChange={(event) => setItemCategory(event.target.value)}

                  >

                    {clothingCategories.map((category) => (

                      <option key={category} value={category}>

                        {category}

                      </option>

                    ))}

                  </select>

                  <label htmlFor="item-color">Color</label>

                  <input

                    id="item-color"

                    value={itemColor}

                    onChange={(event) => setItemColor(event.target.value)}

                    placeholder="Ej. Negro"

                    maxLength={50}

                  />

                  <label htmlFor="item-brand">Marca (opcional)</label>

                  <input

                    id="item-brand"

                    value={itemBrand}

                    onChange={(event) => setItemBrand(event.target.value)}

                    placeholder="Ej. Skeleton"

                    maxLength={80}

                  />

                  <button

                    type="submit"

                    className="hero-button"

                    disabled={savingItem}

                  >

                    <Plus size={17} />

                    {savingItem ? 'Guardando...' : 'Guardar prenda'}

                  </button>

                </form>

              )}

              <div className="wardrobe-toolbar">

                <label htmlFor="wardrobe-category">Filtrar por categoría</label>

                <select

                  id="wardrobe-category"

                  value={wardrobeCategory}

                  onChange={(event) =>

                    setWardrobeCategory(event.target.value)

                  }

                >

                  <option value="Todas">Todas las prendas</option>

                  {clothingCategories.map((category) => (

                    <option key={category} value={category}>

                      {category}

                    </option>

                  ))}

                </select>

                <span>

                  {visibleWardrobe.length}{' '}

                  {visibleWardrobe.length === 1 ? 'prenda' : 'prendas'}

                </span>

              </div>

              {wardrobeLoading ? (

                <div className="empty-state">

                  <Shirt size={30} />

                  <p>Cargando tu armario...</p>

                </div>

              ) : visibleWardrobe.length > 0 ? (

                <div className="outfit-grid wardrobe-grid">

                  {visibleWardrobe.map((item) => (

                    <article className="outfit-card wardrobe-card" key={item.id}>

                      <div className="outfit-image-wrap wardrobe-image-wrap">

                        {item.imageUrl ? (

                          <img

                            className="outfit-image"

                            src={item.imageUrl}

                            alt={item.name}

                          />

                        ) : (

                          <div className="wardrobe-placeholder">

                            <Shirt size={52} strokeWidth={1.2} />

                            <span>{item.category}</span>

                          </div>

                        )}

                        <button

                          type="button"

                          className="save-button"

                          aria-label={`Eliminar ${item.name}`}

                          title="Eliminar prenda"

                          onClick={() => void handleDeleteItem(item.id)}

                        >

                          <Trash2 size={18} />

                        </button>

                      </div>

                      <div className="outfit-info">

                        <div>

                          <h3>{item.name}</h3>

                          <p>{item.category}</p>

                          {item.brand && <p>Marca: {item.brand}</p>}

                          {item.color && (

                            <p className="wardrobe-color">

                              <Tag size={13} />

                              {item.color}

                            </p>

                          )}

                        </div>

                      </div>

                    </article>

                  ))}

                </div>

              ) : (

                <div className="empty-state">

                  <Shirt size={34} strokeWidth={1.4} />

                  <h3>

                    {search || wardrobeCategory !== 'Todas'

                      ? 'No encontramos prendas'

                      : 'Tu armario está vacío'}

                  </h3>

                  <p>

                    {search || wardrobeCategory !== 'Todas'

                      ? 'Prueba otra búsqueda o categoría.'

                      : 'Agrega tu primera prenda para comenzar a organizar tu estilo.'}

                  </p>

                  {!search && wardrobeCategory === 'Todas' && (

                    <button

                      type="button"

                      className="hero-button"

                      onClick={() => setShowAddItem(true)}

                    >

                      <Plus size={17} />

                      Agregar mi primera prenda

                    </button>

                  )}

                </div>

              )}

            </section>

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

                    onClick={() => navigate('Mi armario')}

                  >

                    Explorar mi armario

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

                <button

                  type="button"

                  className="stat-item"

                  onClick={() => navigate('Mi armario')}

                >

                  <span className="stat-icon"><Shirt size={19} /></span>

                  <span>

                    <strong>Tu armario</strong>

                    <span>Organiza tus prendas</span>

                  </span>

                </button>

                <div className="stat-item">

                  <span className="stat-icon"><Sparkles size={19} /></span>

                  <div>

                    <strong>Nuevas ideas</strong>

                    <span>Inspírate cada día</span>

                  </div>

                </div>

                <button

                  type="button"

                  className="stat-item"

                  onClick={() => navigate('Favoritos')}

                >

                  <span className="stat-icon"><Heart size={19} /></span>

                  <span>

                    <strong>Tus favoritos</strong>

                    <span>Guarda lo que te gusta</span>

                  </span>

                </button>

              </section>

              <section className="collection-section" id="coleccion">

                <div className="section-heading">

                  <div>

                    <p className="eyebrow">INSPIRACIÓN PARA TI</p>

                    <h2>

                      {active === 'Favoritos'

                        ? 'Tus looks guardados'

                        : 'Explora los outfits'}

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

                            <span className="look-number">

                              LOOK 0{outfit.id}

                            </span>

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

                              <Bookmark

                                size={18}

                                fill={isSaved ? 'currentColor' : 'none'}

                              />

                            </button>

                            <span className="outfit-category">

                              {outfit.category}

                            </span>

                          </div>

                          <div className="outfit-info">

                            <div>

                              <h3>{outfit.name}</h3>

                              <p>Inspiración de temporada</p>

                            </div>

                            <div

                              className="color-palette"

                              aria-label="Paleta de colores"

                            >

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

                      {active === 'Favoritos'

                        ? 'Aún no tienes favoritos'

                        : 'No encontramos resultados'}

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

              <section className="create-banner outfit-creator-section" id="crear">
                <div className="create-icon"><Sparkles size={23} /></div>
                <div className="create-copy">
                  <p className="eyebrow">TU CREATIVIDAD, TU REGLA</p>
                  <h2>Crea tu propio outfit</h2>
                  <p>Combina prendas de tu armario, visualiza tu look y guárdalo en tu colección.</p>
                </div>

                <div className="outfit-creator">
                  <label htmlFor="outfit-name">Nombre del outfit</label>
                  <input
                    id="outfit-name"
                    type="text"
                    value={outfitName}
                    onChange={(event) => setOutfitName(event.target.value)}
                    placeholder="Ej. Mi look urbano"
                    maxLength={60}
                  />

                  <label htmlFor="outfit-style">Estilo</label>
                  <select
                    id="outfit-style"
                    value={outfitStyle}
                    onChange={(event) => setOutfitStyle(event.target.value)}
                  >
                    <option value="Urbano">Urbano</option>
                    <option value="Casual">Casual</option>
                    <option value="Elegante">Elegante</option>
                    <option value="Deportivo">Deportivo</option>
                    <option value="Alternativo">Alternativo</option>
                  </select>

                  <div className="outfit-builder-heading">
                    <div>
                      <h3>Arma tu combinación</h3>
                      <p>Elige tus prendas o deja que OUTFIA proponga un look con lo que tienes.</p>
                    </div>
                    <button type="button" className="generate-outfit-button" onClick={generateOutfit} disabled={wardrobeLoading || wardrobeItems.length < 2}>
                      <Sparkles size={16} /> Generar outfit
                    </button>
                  </div>
                  {wardrobeLoading ? (
                    <p>Cargando tu armario...</p>
                  ) : wardrobeItems.length === 0 ? (
                    <p>Aún no tienes prendas en tu armario. Ve a “Mi armario” y agrega algunas primero.</p>
                  ) : (
                    <div className="outfit-selection-grid">
                      {wardrobeItems.map((item) => {
                        const isSelected = selectedWardrobeIds.includes(item.id)
                        return (
                          <button
                            key={item.id}
                            type="button"
                            className={`outfit-selection-card ${isSelected ? 'selected' : ''}`}
                            aria-pressed={isSelected}
                            onClick={() => setSelectedWardrobeIds((current) =>
                              isSelected
                                ? current.filter((id) => id !== item.id)
                                : [...current, item.id]
                            )}
                          >
                            {item.imageUrl ? (
                              <img src={item.imageUrl} alt={item.name} />
                            ) : (
                              <div className="outfit-no-image"><Shirt size={28} /></div>
                            )}
                            <span>{item.name}</span>
                            <small>{item.category}</small>
                            <span>{isSelected ? '✓ Seleccionada' : 'Seleccionar'}</span>
                          </button>
                        )
                      })}
                    </div>
                  )}

                  <p className="outfit-selection-count">{selectedWardrobeIds.length === 0 ? 'Todavía no has elegido prendas.' : `${selectedWardrobeIds.length} prendas en tu combinación`}</p>
                  {selectedWardrobeIds.length > 0 && (
                    <div className="outfit-preview">
                      <h3>Tu outfit generado</h3>
                      <div className="outfit-preview-grid">
                        {wardrobeItems.filter((item) => selectedWardrobeIds.includes(item.id)).map((item) => (
                          <div key={item.id} className="outfit-preview-item">
                            {item.imageUrl ? <img src={item.imageUrl} alt={item.name} /> : <Shirt size={28} />}
                            <span>{item.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {outfitMessage && <p className="outfit-message" role="status">{outfitMessage}</p>}
                  <button
                    type="button"
                    className="create-button"
                    onClick={() => void saveOutfit()}
                    disabled={savingOutfit}
                  >
                    <Plus size={18} />
                    {savingOutfit ? 'Guardando...' : 'Guardar outfit'}
                  </button>
                </div>
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
