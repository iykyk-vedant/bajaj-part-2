import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface LockState {
  isDcLocked: boolean;
  lockedDcNo: string;
  lockedPartCode: string;
  toggleDcLock: () => void;
  unlockDc: () => void;
  lockDc: (dcNo: string, partCode: string) => void;
  setLockedValues: (dcNo: string, partCode: string) => void;
}

export const useLockStore = create<LockState>()(
  persist(
    (set, get) => ({
      isDcLocked: false as boolean,
      lockedDcNo: '',
      lockedPartCode: '',
      toggleDcLock: () => set({ isDcLocked: !get().isDcLocked }),
      unlockDc: () => set({ isDcLocked: false, lockedDcNo: '', lockedPartCode: '' }),
      lockDc: (dcNo: string, partCode: string) => set({ isDcLocked: true, lockedDcNo: dcNo, lockedPartCode: partCode }),
      setLockedValues: (dcNo: string, partCode: string) => set({ lockedDcNo: dcNo, lockedPartCode: partCode }),
    }),
    {
      name: 'dc-lock-storage', // name of the item in the storage (must be unique)
      partialize: (state) => ({ isDcLocked: state.isDcLocked, lockedDcNo: state.lockedDcNo, lockedPartCode: state.lockedPartCode }), // persist lock state and values
    }
  )
);