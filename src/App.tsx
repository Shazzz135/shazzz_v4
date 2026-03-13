
import { useState } from 'react';
import Sandbox from './world/Sandbox';
import LoadingScreen from './components/LoadingScreen';

export default function App() {
  const [isLoading, setIsLoading] = useState(true);

  const handleLoadingComplete = () => {
    setIsLoading(false);
  };

  return (
    <>
      <LoadingScreen isLoading={isLoading} levelName="Dungeon" onLoadingComplete={handleLoadingComplete} />
      <Sandbox />
    </>
  );
}
