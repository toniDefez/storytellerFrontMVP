import React from 'react'

interface ErrorModalProps {
  open: boolean
  title?: string
  message: string
  buttonText?: string
  onClose: () => void
}

const ErrorModal: React.FC<ErrorModalProps> = ({ open, title = 'Error', message, buttonText = 'Cerrar', onClose }) => {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-2xl px-8 py-8 max-w-sm w-full text-center border border-red-300 animate-fade-in">
        <svg className="mx-auto mb-4 h-12 w-12 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
        <h3 className="text-xl font-bold mb-2 text-red-700">{title}</h3>
        <p className="mb-6 text-gray-700">{message}</p>
        <button
          className="bg-gradient-to-r from-red-400 to-pink-500 hover:from-red-500 hover:to-pink-600 text-white font-bold py-2 px-6 rounded-lg shadow transition-all duration-200"
          onClick={onClose}
        >
          {buttonText}
        </button>
      </div>
    </div>
  )
}

export default ErrorModal
