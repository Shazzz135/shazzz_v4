
import { useState } from 'react';
import World from './world/World';
import LoadingScreen from './components/LoadingScreen';

export default function App() {
  const [isLoading, setIsLoading] = useState(false); // Disabled for now

  const handleLoadingComplete = () => {
    setIsLoading(false);
  };

  return (
    <>
      <LoadingScreen isLoading={isLoading} levelName="Dungeon" onLoadingComplete={handleLoadingComplete} />
      <World />
    </>
  );
}
