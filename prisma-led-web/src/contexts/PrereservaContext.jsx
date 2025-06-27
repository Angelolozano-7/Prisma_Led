// contexts/PrereservaContext.jsx
import { createContext, useState, useContext } from "react";

const PrereservaContext = createContext();

export function PrereservaProvider({ children }) {
  const [prereserva, setPrereserva] = useState(null);

  return (
    <PrereservaContext.Provider value={{ prereserva, setPrereserva }}>
      {children}
    </PrereservaContext.Provider>
  );
}

export function usePrereserva() {
  return useContext(PrereservaContext);
}
