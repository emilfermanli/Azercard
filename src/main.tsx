import { createRoot } from 'react-dom/client';
import { Routes } from '@generouted/react-router';

import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';

import { LoadingSpinner } from '@/components';
import store, { persistor } from '@/store';

import '@/assets/css/style.css';

createRoot(document.getElementById('root') as HTMLElement).render(
  <Provider store={store}>
    <PersistGate
      loading={
        <div className="flex min-h-dvh items-center justify-center bg-slate-950">
          <LoadingSpinner size="lg" className="text-slate-400" />
        </div>
      }
      persistor={persistor}
    >
      <Routes />
    </PersistGate>
  </Provider>
);
