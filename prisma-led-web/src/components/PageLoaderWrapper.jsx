import { useEffect, useState, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import VideoLoader from './VideoLoader';

export default function PageLoaderWrapper({ children }) {
  const location = useLocation();
  const [showChildren, setShowChildren] = useState(false);
  const lastPath = useRef(location.pathname);

  const excludePaths = ['/cliente/disponibilidad']; // 🛑 rutas sin loader

  useEffect(() => {
    if (excludePaths.includes(location.pathname)) {
      setShowChildren(true); // ❌ no aplicar loader
      return;
    }

    if (location.pathname !== lastPath.current) {
      setShowChildren(false);
      const timeout = setTimeout(() => {
        setShowChildren(true);
        lastPath.current = location.pathname;
      }, 2000); // tu duración deseada
      return () => clearTimeout(timeout);
    } else {
      setShowChildren(true);
    }
  }, [location.pathname]);

  return showChildren ? children : <VideoLoader />;
}
