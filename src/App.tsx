
import { useEffect } from 'react';
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from 'react-router-dom';

import { APP } from './data/data.ts';
import Play from './pages/Play.tsx';
import Hub from './pages/Hub.tsx';
import About from './pages/About.tsx';
import Projects from './pages/Projects.tsx';
import Experience from './pages/Experience.tsx';
import Contacts from './pages/Contacts.tsx';

function RouteTransition() {
  return (
    <Routes>
      <Route path="/" element={<Play />} />
      <Route path="/hub" element={<Hub />} />
      <Route path="/about" element={<About />} />
      <Route path="/projects" element={<Projects />} />
      <Route path="/experience" element={<Experience />} />
      <Route path="/contacts" element={<Contacts />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
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