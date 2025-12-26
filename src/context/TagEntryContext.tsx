'use client';

import { createContext, useContext, ReactNode } from 'react';

interface TagEntryContextType {
  refreshPreview?: () => void;
  setRefreshCallback?: (callback: () => void) => void;
}

const TagEntryContext = createContext<TagEntryContextType>({});

export function TagEntryProvider({ 
  children 
}: { 
  children: ReactNode 
}) {
  return (
    <TagEntryContext.Provider value={{}}>
      {children}
    </TagEntryContext.Provider>
  );
}

export function useTagEntryContext() {
  return useContext(TagEntryContext);
}