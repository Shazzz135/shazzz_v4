
import { useEffect, useState } from 'react';
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
} from 'react-router-dom';

import { APP } from './data/data.ts';
import Play from './pages/Play.tsx';
import World from './pages/World.tsx';

function RouteTransition() {
  const location = useLocation();
  const [displayLocation, setDisplayLocation] = useState(location);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    if (location.pathname !== displayLocation.pathname) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsTransitioning(true);
      const timer = setTimeout(() => {
        setDisplayLocation(location);
        setIsTransitioning(false);
      }, 250);
      return () => clearTimeout(timer);
    }
  }, [location, displayLocation]);

  return (
    <div
      key={displayLocation.pathname}
      className={`route-transition ${isTransitioning ? 'fade-out' : ''}`}
    >
      <Routes location={displayLocation}>
        <Route path="/" element={<Play />} />
        <Route path="/world" element={<World />} />
        <Route path="/" element={<Navigate to="/" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

function App() {
  useEffect(() => {
    document.title = APP.web_name;

    const favicon = document.querySelector("link[rel='icon']");

    if (favicon) {
      favicon.setAttribute('href', APP.web_logo);
    }
  }, []);

  return (
    <BrowserRouter>
      <RouteTransition />
    </BrowserRouter>
  );
}

export default App;