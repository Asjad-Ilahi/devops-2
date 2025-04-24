import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {jwtDecode} from 'jwt-decode'

interface DecodedToken {
  exp: number
  userId: string
}

export function useAuth() {
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return
    }

    try {
      const decoded: DecodedToken = jwtDecode(token)
      const expirationTime = decoded.exp * 1000 // Convert to milliseconds
      const currentTime = Date.now()

      if (currentTime >= expirationTime) {
        logout()
      } else {
        const timeout = setTimeout(() => {
          logout()
        }, expirationTime - currentTime)
        return () => clearTimeout(timeout)
      }
    } catch (error) {
      console.error('Invalid token:', error)
      logout()
    }
  }, [router])
}

export function logout() {
  localStorage.removeItem('token')
  window.location.href = '/login' // Use window.location for immediate redirect
}