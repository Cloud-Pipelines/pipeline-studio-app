import { useEffect, useRef } from "react";

export const useAutoSave = <T>(
  saveFunction: (data: T) => Promise<void> | void,
  data: T,
  isDirty: boolean,
) => {
  const saveFunctionRef = useRef(saveFunction);
  const dataRef = useRef(data);
  const isDirtyRef = useRef(isDirty);

  useEffect(() => {
    saveFunctionRef.current = saveFunction;
  }, [saveFunction]);

  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  useEffect(() => {
    isDirtyRef.current = isDirty;
  }, [isDirty]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (isDirtyRef.current) {
        saveFunctionRef.current(dataRef.current);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, []);
};
