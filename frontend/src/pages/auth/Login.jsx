
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState({
    username: '',
    password: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await login(form.username, form.password)
      navigate('/')
    } catch (err) {
      setError(
        err.response?.data?.non_field_errors?.[0] ||
        'Invalid username or password.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-5 py-12 bg-[#FAFAF9]">
      <form onSubmit={handleSubmit} className="w-full max-w-md bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
        <h1 className="text-3xl font-bold mb-2">Welcome Back</h1>
        <p className="text-gray-500 mb-7">Login to your API Store account.</p>

        {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

        <label className="block text-sm font-medium mb-2">Username</label>
        <input
          required
          value={form.username}
          onChange={(e) => setForm({ ...form, username: e.target.value })}
          className="w-full border rounded-lg p-3 mb-5 outline-none focus:border-emerald-700"
          placeholder="Enter username"
        />

        <label className="block text-sm font-medium mb-2">Password</label>
        <input
          required
          type="password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          className="w-full border rounded-lg p-3 mb-6 outline-none focus:border-emerald-700"
          placeholder="Enter password"
        />

        <button
          disabled={loading}
          className="w-full bg-[#047857] text-white py-3 rounded-full font-semibold hover:bg-emerald-800 disabled:opacity-60"
        >
          {loading ? 'Logging in...' : 'Login'}
        </button>

        <p className="text-center text-sm text-gray-500 mt-6">
          Don't have an account?{' '}
          <Link to="/register" className="text-[#047857] font-semibold">
            Register
          </Link>
        </p>
      </form>
    </div>
  )
}
