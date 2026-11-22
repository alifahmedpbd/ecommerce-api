
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState({
    username: '',
    email: '',
    first_name: '',
    last_name: '',
    password: '',
  })

  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await register(form)
      navigate('/')
    } catch (err) {
      const data = err.response?.data
      setError(
        data ? Object.values(data).flat().join(' ') : 'Registration failed.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-5 py-12 bg-[#FAFAF9]">
      <form onSubmit={handleSubmit} className="w-full max-w-lg bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
        <h1 className="text-3xl font-bold mb-2">Create Account</h1>
        <p className="text-gray-500 mb-7">Join API Store today.</p>

        {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">First Name</label>
            <input name="first_name" value={form.first_name} onChange={handleChange}
              className="w-full border rounded-lg p-3 mb-4" />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Last Name</label>
            <input name="last_name" value={form.last_name} onChange={handleChange}
              className="w-full border rounded-lg p-3 mb-4" />
          </div>
        </div>

        <label className="block text-sm font-medium mb-2">Username</label>
        <input required name="username" value={form.username} onChange={handleChange}
          className="w-full border rounded-lg p-3 mb-4" placeholder="Choose a username" />

        <label className="block text-sm font-medium mb-2">Email</label>
        <input required type="email" name="email" value={form.email} onChange={handleChange}
          className="w-full border rounded-lg p-3 mb-4" placeholder="Enter email address" />

        <label className="block text-sm font-medium mb-2">Password</label>
        <input required minLength={8} type="password" name="password" value={form.password} onChange={handleChange}
          className="w-full border rounded-lg p-3 mb-6" placeholder="At least 8 characters" />

        <button disabled={loading}
          className="w-full bg-[#047857] text-white py-3 rounded-full font-semibold hover:bg-emerald-800 disabled:opacity-60">
          {loading ? 'Creating account...' : 'Create Account'}
        </button>

        <p className="text-center text-sm text-gray-500 mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-[#047857] font-semibold">Login</Link>
        </p>
      </form>
    </div>
  )
}
