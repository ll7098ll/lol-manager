import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { GameStore } from './types';
import { createCommonSlice } from './slices/commonSlice';
import { createDraftSlice } from './slices/draftSlice';
import { createMatchSlice } from './slices/matchSlice';
import { createTrainingSlice } from './slices/trainingSlice';
import { createFinanceSlice } from './slices/financeSlice';

export const useGameStore = create<GameStore>()(
  persist(
    (set, get, store) => ({
      ...createCommonSlice(set, get, store),
      ...createDraftSlice(set, get, store),
      ...createMatchSlice(set, get, store),
      ...createTrainingSlice(set, get, store),
      ...createFinanceSlice(set, get, store),
    }),
    {
      name: 'lol-manager-savegame',
      storage: createJSONStorage(() => localStorage, {
        reviver: (key, value) => {
          if (key === 'currentDate' && typeof value === 'string') {
            return new Date(value);
          }
          return value;
        }
      })
    }
  )
);
