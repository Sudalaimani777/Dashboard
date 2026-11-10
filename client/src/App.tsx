import React from 'react';
import { AuthProvider } from './features/auth/context/AuthContext';
import { TravelProvider } from './features/travel/context/TravelContext';
import { AppRoutes } from './routes/AppRoutes';

const App: React.FC = () => {
  return (
    <AuthProvider>
      <TravelProvider>
        <AppRoutes />
      </TravelProvider>
    </AuthProvider>
  );
};

export default App;
