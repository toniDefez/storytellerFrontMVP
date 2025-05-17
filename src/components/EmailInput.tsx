import React, { useState } from 'react'
import { validateEmail } from '../utils/validation'

interface EmailInputProps {
  value: string
  onChange: (value: string) => void
  label?: string
  placeholder?: string
  required?: boolean
  externalError?: string
}

const EmailInput: React.FC<EmailInputProps> = ({
  value,
  onChange,
  label = 'Email',
  placeholder = 'tu@email.com',
  required = true,
  externalError = '',
}) => {
  const [touched, setTouched] = useState(false)
  const [localError, setLocalError] = useState('')

  const handleBlur = () => {
    setTouched(true)
    setLocalError(validateEmail(value))
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value)
    if (touched) {
      setLocalError(validateEmail(e.target.value))
    }
  }

  const showError = (externalError || localError) && (touched || externalError)

  return (
    <div className="mb-5">
      <label className="block text-gray-700 mb-1 font-medium">{label}</label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
          <svg xmlns='http://www.w3.org/2000/svg' className='h-5 w-5' fill='none' viewBox='0 0 24 24' stroke='currentColor'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M16 12H8m8 0a4 4 0 11-8 0 4 4 0 018 0zm0 0v1a4 4 0 01-8 0v-1' /></svg>
        </span>
        <input
          type="email"
          value={value}
          onChange={handleChange}
          onBlur={handleBlur}
          className={`w-full border border-gray-300 rounded-lg px-10 py-2 focus:outline-none focus:ring-2 focus:ring-green-400 transition ${showError ? 'border-red-400' : ''}`}
          required={required}
          placeholder={placeholder}
        />
      </div>
      {showError && <p className="text-red-500 text-xs mt-1 ml-1">{externalError || localError}</p>}
    </div>
  )
}

export default EmailInput
