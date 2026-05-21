import { useDispatch, useSelector } from 'react-redux';
import { combineReducers, configureStore } from '@reduxjs/toolkit';
import { encryptTransform } from 'redux-persist-transform-encrypt';
import { persistStore, persistReducer } from 'redux-persist';
import type { PersistConfig } from 'redux-persist';
import storage from 'redux-persist/lib/storage';

import { ErrorMiddleware } from '@/store/middlewares/error.middleware';

import appSlice from '@/store/features/app.slice';
import authSlice from '@/store/features/auth.slice';
import { userApi } from '@/services/user.service';
import { authApi } from '@/services/auth.service';
import { organizationApi } from '@/services/organization.service';
import { azmapApi } from '@/services/azmap.service';
import { forecastingApi } from '@/services/forecasting.service';
import { generalApi } from '@/services/general.service';
import { marketbenchmarkApi } from '@/services/marketbenchmark.service';
import { sectorspendApi } from '@/services/sectorspend.service';
import { worldmapApi } from '@/services/worldmap.service';

const encryptor = encryptTransform({
  secretKey: import.meta.env.VITE_PERSIST_KEY,
});

const rootReducer = combineReducers({
  app: appSlice,
  auth: authSlice,
  [userApi.reducerPath]: userApi.reducer,
  [authApi.reducerPath]: authApi.reducer,
  [organizationApi.reducerPath]: organizationApi.reducer,
  [azmapApi.reducerPath]: azmapApi.reducer,
  [forecastingApi.reducerPath]: forecastingApi.reducer,
  [generalApi.reducerPath]: generalApi.reducer,
  [marketbenchmarkApi.reducerPath]: marketbenchmarkApi.reducer,
  [sectorspendApi.reducerPath]: sectorspendApi.reducer,
  [worldmapApi.reducerPath]: worldmapApi.reducer,
});

type RootReducerState = ReturnType<typeof rootReducer>;

const persistConfig: PersistConfig<RootReducerState> = {
  key: 'ea',
  storage,
  transforms: [encryptor],
  whitelist: ['auth'],
  // blacklist: [""],
};

const reducer = persistReducer<RootReducerState>(persistConfig, rootReducer);

const store = configureStore({
  reducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    })
      .concat(
        authApi.middleware,
        userApi.middleware,
        organizationApi.middleware,
        azmapApi.middleware,
        forecastingApi.middleware,
        generalApi.middleware,
        marketbenchmarkApi.middleware,
        sectorspendApi.middleware,
        worldmapApi.middleware
      )
      .prepend(ErrorMiddleware),
});

export const persistor = persistStore(store);
export default store;

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
// Inferred type: {posts: PostsState, comments: CommentsState, users: UsersState}
export type AppDispatch = typeof store.dispatch;

// Use throughout your app instead of plain `useDispatch` and `useSelector`
export const useAppDispatch = useDispatch.withTypes<AppDispatch>();
export const useAppSelector = useSelector.withTypes<RootState>();
