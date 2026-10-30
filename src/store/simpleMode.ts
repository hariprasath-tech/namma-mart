import { create } from 'zustand';

interface SimpleModeState {
  isSimpleMode: boolean;
  toggleSimpleMode: () => void;
  setSimpleMode: (val: boolean) => void;
}

export const useSimpleModeStore = create<SimpleModeState>((set) => ({
  isSimpleMode: localStorage.getItem('localkart_simple_mode') === 'true',
  toggleSimpleMode: () =>
    set((state) => {
      const next = !state.isSimpleMode;
      localStorage.setItem('localkart_simple_mode', String(next));
      if (next) {
        document.documentElement.classList.add('simple-mode');
      } else {
        document.documentElement.classList.remove('simple-mode');
      }
      return { isSimpleMode: next };
    }),
  setSimpleMode: (val: boolean) => {
    localStorage.setItem('localkart_simple_mode', String(val));
    if (val) {
      document.documentElement.classList.add('simple-mode');
    } else {
      document.documentElement.classList.remove('simple-mode');
    }
    set({ isSimpleMode: val });
  },
}));
