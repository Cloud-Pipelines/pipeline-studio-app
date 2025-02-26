import { createContext, useContext, useState } from 'react';

interface TaskSpec {
  componentRef: {
    url: string;
    spec: unknown;
  };
}

type DnDContextType = [
  { taskSpec: TaskSpec } | null,
  ((type: { taskSpec: TaskSpec } | null) => void) | null
];

const DnDContext = createContext<DnDContextType>([null, null]);

export const DnDProvider = ({ children }: { children: React.ReactNode }) => {
  const [type, setType] = useState<{ taskSpec: TaskSpec } | null>(null);

  return (
    <DnDContext.Provider value={[type, setType]}>
      {children}
    </DnDContext.Provider>
  );
}

export const useDnD = () => {
  const context = useContext(DnDContext);
  if (!context) throw new Error('useDnD must be used within a DNDProvider');
  return context;
};

export default DnDContext;
