import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { TownLocation, LocationCoords } from '../types';
import townsData from '../data/towns.json';

interface LocationState {
  selectedTown: TownLocation;
  userCoords: LocationCoords;
  isDetecting: boolean;
  setTown: (town: TownLocation) => void;
  setCustomCoords: (coords: LocationCoords) => void;
  detectLocation: () => Promise<void>;
}

const defaultTown = townsData[0] as TownLocation;

export const useLocationStore = create<LocationState>()(
  persist(
    (set, get) => ({
      selectedTown: defaultTown,
      userCoords: { lat: defaultTown.lat, lng: defaultTown.lng },
      isDetecting: false,

      setTown: (town: TownLocation) => {
        set({
          selectedTown: town,
          userCoords: { lat: town.lat, lng: town.lng },
        });
      },

      setCustomCoords: (coords: LocationCoords) => {
        set({ userCoords: coords });
      },

      detectLocation: async () => {
        set({ isDetecting: true });
        // Emulate realistic geolocation check or fallback to Pollachi Center
        try {
          if ('geolocation' in navigator) {
            await new Promise<void>((resolve) => {
              navigator.geolocation.getCurrentPosition(
                (pos) => {
                  set({
                    userCoords: {
                      lat: pos.coords.latitude,
                      lng: pos.coords.longitude,
                    },
                    isDetecting: false,
                  });
                  resolve();
                },
                () => {
                  // Fallback to default town coordinates
                  set({
                    userCoords: { lat: defaultTown.lat, lng: defaultTown.lng },
                    isDetecting: false,
                  });
                  resolve();
                },
                { timeout: 3000 }
              );
            });
          } else {
            set({ isDetecting: false });
          }
        } catch {
          set({ isDetecting: false });
        }
      },
    }),
    {
      name: 'localkart_location',
    }
  )
);
