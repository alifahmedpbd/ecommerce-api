
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function Register() {
  const {
    register,
    verifyRegistrationOTP,
    resendRegistrationOTP,
  } = useAuth()

  const navigate = useNavigate()

  const [step, setStep] = useState(1)
  const [form, setForm] = useState({
    username: '',
    email: '',
    first_name: '',
    last_name: '',
    password: '',
  })

  const [otp, setOtp] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    setError('')
    setMessage('')
    setLoading(true)

    try {
      const response = await register(form)
      setMessage(response.message)
      setStep(2)
    } catch (err) {
      const data = err.response?.data
      setError(
        data
          ? Object.values(data).flat().join(' ')
          : 'Registration failed.'
      )
    } finally {
      setLoading(false)
    }
  }

  const handleVerify = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await verifyRegistrationOTP(form.email, otp)
      navigate('/')
    } catch (err) {
      const data = err.response?.data
      setError(
        data
          ? Object.values(data).flat().join(' ')
          : 'OTP verification failed.'
      )
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    setError('')
    setMessage('')
    setLoading(true)

    try {
      const response = await resendRegistrationOTP(form.email)
      setMessage(response.message)
    } catch (err) {
      setError(
        err.response?.data?.message || 'Unable to resend OTP.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-5 py-12 bg-[#FAFAF9]">
      <div className="w-full max-w-lg bg-white p-8 rounded-2xl shadow-sm border border-gray-100">

        {step === 1 ? (
          <>
            <h1 className="text-3xl font-bold mb-2">
              Create Account
            </h1>

            <p className="text-gray-500 mb-7">
              Join API Store today.
            </p>

            {error && (
              <p className="text-red-600 text-sm mb-4">{error}</p>
            )}

            <form onSubmit={handleRegister}>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    First Name
                  </label>
                  <input
                    name="first_name"
                    value={form.first_name}
                    onChange={handleChange}
                    className="w-full border rounded-lg p-3 mb-4"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Last Name
                  </label>
                  <input
                    name="last_name"
                    value={form.last_name}
                    onChange={handleChange}
                    className="w-full border rounded-lg p-3 mb-4"
                  />
                </div>
              </div>

              <label className="block text-sm font-medium mb-2">
                Username
              </label>
              <input
                required
                name="username"
                value={form.username}
                onChange={handleChange}
                className="w-full border rounded-lg p-3 mb-4"
                placeholder="Choose a username"
              />

              <label className="block text-sm font-medium mb-2">
                Email
              </label>
              <input
                required
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                className="w-full border rounded-lg p-3 mb-4"
                placeholder="Enter email address"
              />

              <label className="block text-sm font-medium mb-2">
                Password
              </label>
              <input
                required
                minLength={8}
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                className="w-full border rounded-lg p-3 mb-6"
                placeholder="At least 8 characters"
              />

              <button
                disabled={loading}
                className="w-full bg-[#047857] text-white py-3 rounded-full font-semibold hover:bg-emerald-800 disabled:opacity-60"
              >
                {loading ? 'Sending OTP...' : 'Continue'}
              </button>
            </form>

            <p className="text-center text-sm text-gray-500 mt-6">
              Already have an account?{' '}
              <Link to="/login" className="text-[#047857] font-semibold">
                Login
              </Link>
            </p>
          </>
        ) : (
          <>
            <h1 className="text-3xl font-bold mb-2">
              Verify Your Email
            </h1>

            <p className="text-gray-500 mb-6">
              We sent a 6-digit OTP to{' '}
              <span className="font-semibold text-gray-800">
                {form.email}
              </span>
            </p>

            {error && (
              <p className="text-red-600 text-sm mb-4">{error}</p>
            )}

            {message && (
              <p className="text-emerald-700 text-sm mb-4">{message}</p>
            )}

            <form onSubmit={handleVerify}>
              <label className="block text-sm font-medium mb-2">
                Enter OTP
              </label>

              <input
                required
                type="text"
                inputMode="numeric"
                maxLength={6}
                pattern="[0-9]{6}"
                value={otp}
                onChange={(e) =>
                  setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))
                }
                className="w-full border rounded-lg p-4 mb-6 text-center text-2xl tracking-[0.5em] font-bold outline-none focus:border-emerald-700"
                placeholder="000000"
              />

              <button
                disabled={loading || otp.length !== 6}
                className="w-full bg-[#047857] text-white py-3 rounded-full font-semibold hover:bg-emerald-800 disabled:opacity-60"
              >
                {loading ? 'Verifying...' : 'Verify & Create Account'}
              </button>
            </form>

            <button
              type="button"
              onClick={handleResend}
              disabled={loading}
              className="w-full mt-5 text-[#047857] font-semibold text-sm disabled:opacity-50"
            >
              Resend OTP
            </button>

            <button
              type="button"
              onClick={() => {
                setStep(1)
                setOtp('')
                setError('')
                setMessage('')
              }}
              className="w-full mt-3 text-gray-500 text-sm hover:text-gray-800"
            >
              Change registration details
            </button>
          </>
        )}
      </div>
    </div>
  )
}
