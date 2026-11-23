
import { useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../services/api'

export default function ForgotPassword() {
  const [step, setStep] = useState(1)
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [resetToken, setResetToken] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const handleForgotPassword = async (e) => {
    e.preventDefault()
    setError('')
    setMessage('')
    setLoading(true)

    try {
      const response = await api.post('/forgot-password/', {
        email,
      })

      setMessage(response.data.message)
      setStep(2)
    } catch (err) {
      setError(
        err.response?.data?.message || 'Unable to send OTP.'
      )
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOTP = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await api.post('/verify-reset-otp/', {
        email,
        otp,
      })

      setResetToken(response.data.reset_token)
      setMessage(response.data.message)
      setStep(3)
    } catch (err) {
      setError(
        err.response?.data?.message || 'OTP verification failed.'
      )
    } finally {
      setLoading(false)
    }
  }

  const handleResetPassword = async (e) => {
    e.preventDefault()
    setError('')
    setMessage('')

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)

    try {
      const response = await api.post('/reset-password/', {
        email,
        reset_token: resetToken,
        new_password: password,
      })

      setMessage(response.data.message)
      setStep(4)
    } catch (err) {
      const data = err.response?.data

      setError(
        data
          ? Object.values(data).flat().join(' ')
          : 'Password reset failed.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-5 py-12 bg-[#FAFAF9]">
      <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-sm border border-gray-100">

        {step === 1 && (
          <>
            <h1 className="text-3xl font-bold mb-2">
              Forgot Password?
            </h1>

            <p className="text-gray-500 mb-7">
              Enter your registered email to receive a reset OTP.
            </p>

            <form onSubmit={handleForgotPassword}>
              <label className="block text-sm font-medium mb-2">
                Email Address
              </label>

              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border rounded-lg p-3 mb-6 outline-none focus:border-emerald-700"
                placeholder="Enter your email"
              />

              <button
                disabled={loading}
                className="w-full bg-[#047857] text-white py-3 rounded-full font-semibold hover:bg-emerald-800 disabled:opacity-60"
              >
                {loading ? 'Sending OTP...' : 'Send OTP'}
              </button>
            </form>
          </>
        )}

        {step === 2 && (
          <>
            <h1 className="text-3xl font-bold mb-2">
              Verify OTP
            </h1>

            <p className="text-gray-500 mb-6">
              Enter the OTP sent to {email}
            </p>

            <form onSubmit={handleVerifyOTP}>
              <label className="block text-sm font-medium mb-2">
                6-Digit OTP
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
                className="w-full border rounded-lg p-4 mb-6 text-center text-2xl tracking-[0.5em] font-bold"
                placeholder="000000"
              />

              <button
                disabled={loading || otp.length !== 6}
                className="w-full bg-[#047857] text-white py-3 rounded-full font-semibold disabled:opacity-60"
              >
                {loading ? 'Verifying...' : 'Verify OTP'}
              </button>
            </form>
          </>
        )}

        {step === 3 && (
          <>
            <h1 className="text-3xl font-bold mb-2">
              Reset Password
            </h1>

            <p className="text-gray-500 mb-7">
              Create a new password for your account.
            </p>

            <form onSubmit={handleResetPassword}>
              <label className="block text-sm font-medium mb-2">
                New Password
              </label>

              <input
                required
                minLength={8}
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border rounded-lg p-3 mb-4"
                placeholder="Enter new password"
              />

              <label className="block text-sm font-medium mb-2">
                Confirm Password
              </label>

              <input
                required
                minLength={8}
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full border rounded-lg p-3 mb-6"
                placeholder="Confirm new password"
              />

              <button
                disabled={loading}
                className="w-full bg-[#047857] text-white py-3 rounded-full font-semibold disabled:opacity-60"
              >
                {loading ? 'Resetting...' : 'Reset Password'}
              </button>
            </form>
          </>
        )}

        {step === 4 && (
          <div className="text-center">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto mb-5 text-3xl">
              ✓
            </div>

            <h1 className="text-2xl font-bold mb-3">
              Password Reset Successful!
            </h1>

            <p className="text-gray-500 mb-6">
              Your password has been changed. You can now login with your new password.
            </p>

            <Link
              to="/login"
              className="block w-full bg-[#047857] text-white py-3 rounded-full font-semibold hover:bg-emerald-800"
            >
              Go to Login
            </Link>
          </div>
        )}

        {error && (
          <p className="text-red-600 text-sm mt-5">{error}</p>
        )}

        {message && step !== 4 && (
          <p className="text-emerald-700 text-sm mt-5">{message}</p>
        )}

        {step !== 4 && (
          <p className="text-center text-sm text-gray-500 mt-6">
            Remember your password?{' '}
            <Link
              to="/login"
              className="text-[#047857] font-semibold"
            >
              Login
            </Link>
          </p>
        )}
      </div>
    </div>
  )
}
