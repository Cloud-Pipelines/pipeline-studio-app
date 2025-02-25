import { createContext, useContext, useState } from 'react';

const DnDContext = createContext([null, (_: any) => {}]);

export const DnDProvider = ({ children }: { children: React.ReactNode }) => {
  const [type, setType] = useState(null);

  return (
    <DnDContext.Provider value={[type, setType]}>
      {children}
    </DnDContext.Provider>
  );
}

export default DnDContext;

export const useDnD = (): [string | null, (type: string) => void] => {
  const context = useContext(DnDContext);
  if (!context) throw new Error('useDnD must be used within a DNDProvider');
  return context;
};
