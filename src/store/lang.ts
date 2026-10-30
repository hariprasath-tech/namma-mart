import { create } from 'zustand';
import i18n from '../i18n';

interface LangState {
  language: 'en' | 'ta';
  setLanguage: (lang: 'en' | 'ta') => void;
  toggleLanguage: () => void;
}

const currentLang = (localStorage.getItem('localkart_lang') as 'en' | 'ta') || 'en';

export const useLangStore = create<LangState>((set, get) => ({
  language: currentLang,

  setLanguage: (lang: 'en' | 'ta') => {
    i18n.changeLanguage(lang);
    localStorage.setItem('localkart_lang', lang);
    document.documentElement.lang = lang;
    set({ language: lang });
  },

  toggleLanguage: () => {
    const next = get().language === 'en' ? 'ta' : 'en';
    get().setLanguage(next);
  },
}));
