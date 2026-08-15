import { createContext, useContext, useReducer, useCallback, useRef } from 'react'

const AppContext = createContext(null)

const initialState = {
  toasts: [],
  installPrompt: null,
  whatsappLink: '',
  teamName: 'CBC Thane Worship Team',
  teamLogo: null,
}

function appReducer(state, action) {
  switch (action.type) {
    case 'ADD_TOAST':
      return { ...state, toasts: [...state.toasts, { id: Date.now(), ...action.payload }] }
    case 'REMOVE_TOAST':
      return { ...state, toasts: state.toasts.filter(t => t.id !== action.id) }
    case 'SET_INSTALL_PROMPT':
      return { ...state, installPrompt: action.prompt }
    case 'SET_WHATSAPP':
      return { ...state, whatsappLink: action.link }
    case 'SET_TEAM':
      return { ...state, teamName: action.name, teamLogo: action.logo }
    default:
      return state
  }
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, initialState)

  const lastToastRef = useRef({ key: null, at: 0 })

  const toast = useCallback((message, type = 'success', duration = 3500, opts = {}) => {
    // Dedup identical back-to-back toasts (e.g. several independent mount-time
    // API calls all failing with the same error) so they don't stack.
    const key = `${type}:${message}`
    const now = Date.now()
    if (lastToastRef.current.key === key && now - lastToastRef.current.at < 4000) return
    lastToastRef.current = { key, at: now }

    const id = now + Math.random()
    dispatch({ type: 'ADD_TOAST', payload: { id, message, type, subtitle: opts.subtitle, onClick: opts.onClick } })
    setTimeout(() => dispatch({ type: 'REMOVE_TOAST', id }), duration)
  }, [])

  const setInstallPrompt = useCallback((prompt) => {
    dispatch({ type: 'SET_INSTALL_PROMPT', prompt })
  }, [])

  const setWhatsappLink = useCallback((link) => {
    dispatch({ type: 'SET_WHATSAPP', link })
  }, [])

  const setTeam = useCallback((name, logo) => {
    dispatch({ type: 'SET_TEAM', name, logo })
  }, [])

  return (
    <AppContext.Provider value={{ ...state, toast, setInstallPrompt, setWhatsappLink, setTeam }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
