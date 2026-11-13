/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_API: string;
  readonly VITE_PERSIST_KEY: string;
  readonly VITE_CARTO_BASEMAP_KEY?: string;
  // more env variables...
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
