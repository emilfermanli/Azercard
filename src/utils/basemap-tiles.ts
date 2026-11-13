export type BaseMapStyle = 'dark' | 'light' | 'voyager' | 'minimal';

// CARTO raster basemaps. Since 2026 every tile request needs a CARTO Basemaps key
// (from dashboard.basemaps.carto.com — NOT a CARTO Workspace access token).
// Without it CARTO returns an "API KEY REQUIRED" placeholder tile.
const CARTO_KEY = (import.meta.env.VITE_CARTO_BASEMAP_KEY || '').trim();

const STYLE_PATH: Record<BaseMapStyle, string> = {
  dark: 'dark_all',
  light: 'light_all',
  voyager: 'voyager',
  minimal: 'light_nolabels',
};

function buildTileUrl(style: BaseMapStyle) {
  const url = `https://basemaps.cartocdn.com/rastertiles/${STYLE_PATH[style]}/{z}/{x}/{y}@2x.png`;
  return CARTO_KEY ? `${url}?key=${encodeURIComponent(CARTO_KEY)}` : url;
}

export const BASE_MAP_TILE_URL: Record<BaseMapStyle, string> = {
  dark: buildTileUrl('dark'),
  light: buildTileUrl('light'),
  voyager: buildTileUrl('voyager'),
  minimal: buildTileUrl('minimal'),
};
