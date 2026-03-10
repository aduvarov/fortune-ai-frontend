import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { secureStorage } from '../utils/secureStorage';
import { ISettingsState } from '../types/settings';
import { DrawSource } from '../types/dto';

export const useSettingsStore = create<ISettingsState>()(
    persist(
        (set) => ({
            hapticsEnabled: true,
            defaultDrawSource: 'app' as DrawSource,

            toggleHaptics: () =>
                set((state) => ({ hapticsEnabled: !state.hapticsEnabled })),

            setDefaultDrawSource: (source: DrawSource) =>
                set({ defaultDrawSource: source }),
        }),
        {
            name: 'tarot-settings-secure',
            storage: createJSONStorage(() => secureStorage),
        },
    ),
);
