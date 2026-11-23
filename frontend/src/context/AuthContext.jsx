
import { createContext, useContext, useEffect, useState } from 'react'
import api from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const saveToken = (token) => {
    localStorage.setItem('authToken', token)
    api.defaults.headers.common.Authorization = `Token ${token}`
  }

  const clearAuth = () => {
    localStorage.removeItem('authToken')
    delete api.defaults.headers.common.Authorization
    setUser(null)
  }

  const refreshProfile = async () => {
    const response = await api.get('/profile/')
    setUser(response.data)
    return response.data
  }

  useEffect(() => {
    const token = localStorage.getItem('authToken')

    if (!token) {
      setLoading(false)
      return
    }

    api.defaults.headers.common.Authorization = `Token ${token}`

    refreshProfile()
      .catch(() => clearAuth())
      .finally(() => setLoading(false))
  }, [])

  const login = async (username, password) => {
    const response = await api.post('/login/', { username, password })
    saveToken(response.data.token)
    await refreshProfile()
  }

  // Registration: only sends OTP
  const register = async (formData) => {
    const response = await api.post('/register/', formData)
    return response.data
  }

  // Verify OTP and login automatically
  const verifyRegistrationOTP = async (email, otp) => {
    const response = await api.post('/verify-otp/', { email, otp })

    saveToken(response.data.token)
    await refreshProfile()

    return response.data
  }

  const resendRegistrationOTP = async (email) => {
    const response = await api.post('/resend-otp/', { email })
    return response.data
  }

  const logout = async () => {
    try {
      await api.post('/logout/')
    } finally {
      clearAuth()
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        verifyRegistrationOTP,
        resendRegistrationOTP,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
