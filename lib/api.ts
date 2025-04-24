import { logout } from './auth'

export async function apiFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const token = localStorage.getItem('token')
  const headers = {
    ...options.headers,
    'Authorization': token ? `Bearer ${token}` : '',
    'Content-Type': 'application/json',
  }

  const response = await fetch(url, { ...options, headers })

  if (response.status === 401) {
    logout()
    throw new Error('Unauthorized')
  }

  return response
}