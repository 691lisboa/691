import React from 'react'
import { useLanguage } from '../contexts/LanguageContext'
import { Globe } from 'lucide-react'

export default function LanguageSelector() {
  const { language, setLanguage } = useLanguage()

  return (
    <div className="fixed top-4 right-4 z-50">
      <div className="bg-black/60 backdrop-blur-xl border border-green-500/30 rounded-2xl p-2 flex gap-2">
        <button
          onClick={() => setLanguage('pt')}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
            language === 'pt'
              ? 'bg-green-500 text-black'
              : 'text-green-400 hover:bg-green-500/10'
          }`}
        >
          PT
        </button>
        <button
          onClick={() => setLanguage('en')}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
            language === 'en'
              ? 'bg-green-500 text-black'
              : 'text-green-400 hover:bg-green-500/10'
          }`}
        >
          EN
        </button>
      </div>
    </div>
  )
}
