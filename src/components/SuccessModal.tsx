import React from 'react'

interface SuccessModalProps {
  open: boolean
  title: string
  message: string
  buttonText?: string
  onClose: () => void
}

const SuccessModal: React.FC<SuccessModalProps> = ({ open, title, message, buttonText = 'Continuar', onClose }) => {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-2xl px-8 py-8 max-w-sm w-full text-center border border-green-300 animate-fade-in">
        <svg className="mx-auto mb-4 h-12 w-12 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
        <h3 className="text-xl font-bold mb-2 text-green-700">{title}</h3>
        <p className="mb-6 text-gray-700">{message}</p>
        <button
          className="bg-gradient-to-r from-green-400 to-blue-500 hover:from-green-500 hover:to-blue-600 text-white font-bold py-2 px-6 rounded-lg shadow transition-all duration-200"
          onClick={onClose}
        >
          {buttonText}
        </button>
      </div>
    </div>
  )
}

export default SuccessModal
