import React, { useState } from 'react'
import { validatePassword } from '../utils/validation'

interface PasswordInputProps {
  value: string
  onChange: (value: string) => void
  label?: string
  placeholder?: string
  required?: boolean
  minLength?: number
  externalError?: string
}

const PasswordInput: React.FC<PasswordInputProps> = ({
  value,
  onChange,
  label = 'Contraseña',
  placeholder = 'Tu contraseña',
  required = true,
  minLength = 6,
  externalError = '',
}) => {
  const [touched, setTouched] = useState(false)
  const [localError, setLocalError] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const handleBlur = () => {
    setTouched(true)
    setLocalError(validatePassword(value, minLength))
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value)
    if (touched) {
      setLocalError(validatePassword(e.target.value, minLength))
    }
  }

  const showError = (externalError || localError) && (touched || externalError)

  return (
    <div className="mb-8">
      <label className="block text-gray-700 mb-1 font-medium">{label}</label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
          <svg xmlns='http://www.w3.org/2000/svg' className='h-5 w-5' fill='none' viewBox='0 0 24 24' stroke='currentColor'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 11c1.104 0 2-.896 2-2s-.896-2-2-2-2 .896-2 2 .896 2 2 2zm6 2v-2a6 6 0 10-12 0v2a2 2 0 00-2 2v4a2 2 0 002 2h12a2 2 0 002-2v-4a2 2 0 00-2-2z' /></svg>
        </span>
        <input
          type={showPassword ? 'text' : 'password'}
          value={value}
          onChange={handleChange}
          onBlur={handleBlur}
          className={`w-full border border-gray-300 rounded-lg px-10 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 transition ${showError ? 'border-red-400' : ''}`}
          required={required}
          placeholder={placeholder}
        />
        <button
          type="button"
          tabIndex={-1}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
          onClick={() => setShowPassword((v) => !v)}
          aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
        >
          {showPassword ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-5 0-9-4-9-7s4-7 9-7c1.02 0 2.007.15 2.925.425M15 12a3 3 0 11-6 0 3 3 0 016 0zm6.385 2.209A8.959 8.959 0 0021 12c0-3-4-7-9-7-.695 0-1.377.07-2.037.202M3.055 6.945A8.963 8.963 0 003 12c0 3 4 7 9 7 1.306 0 2.563-.252 3.725-.725M21 21L3 3" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0zm6 0c0 3-4 7-9 7s-9-4-9-7 4-7 9-7 9 4 9 7z" />
            </svg>
          )}
        </button>
      </div>
      {showError && <p className="text-red-500 text-xs mt-1 ml-1">{externalError || localError}</p>}
    </div>
  )
}

export default PasswordInput
