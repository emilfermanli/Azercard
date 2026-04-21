# Layihə texnologiyaları (Azericard)

Bu sənəd hazırkı kod bazasında istifadə olunan əsas texnologiya və kitabxanaları qruplaşdırılmış şəkildə əks etdirir.

## Əsas platforma

| Texnologiya | Təsvir |
|-------------|--------|
| **React 18** | UI komponentləri, hooks (`useState`, `useEffect`, `useContext` və s.) |
| **TypeScript** | Statik tipləmə, `.ts` / `.tsx` faylları |
| **Vite 5** | Dev server, production build, HMR |

## Routing

| Texnologiya | Təsvir |
|-------------|--------|
| **React Router DOM v6** | Marşrutlaşdırma |
| **@generouted/react-router** | Fayl əsaslı marşrutlar (`src/pages/...`), Vite plugin ilə avtomatik `router.ts` generasiyası; modal faylları `_` prefiksi ilə marşruta düşmür |

## State idarəetməsi və server məlumatı

| Texnologiya | Təsvir |
|-------------|--------|
| **Redux Toolkit (@reduxjs/toolkit)** | `createSlice`, `configureStore`, middleware |
| **React Redux** | `Provider`, `useDispatch`, `useSelector` |
| **RTK Query** | `createApi`, `fetchBaseQuery` — REST çağırışları, cache, tag invalidation (`auth`, `user`, `organization` API-ləri) |
| **redux-persist** | Auth və seçilmiş state-in brauzerdə saxlanması |
| **redux-persist-transform-encrypt** | Persist məlumatının şifrələnməsi (`VITE_PERSIST_KEY`) |

## UI və stil

| Texnologiya | Təsvir |
|-------------|--------|
| **Tailwind CSS v4** | Utility-first stil (`@tailwindcss/vite`, `@import 'tailwindcss'`) |
| **tailwindcss-animate** | Animasiya utilitiləri |
| **tailwind-merge** | Siniflərin təhlükəsiz birləşməsi (`cn` helper) |
| **clsx** | Şərti class adları |
| **class-variance-authority (cva)** | Düymə variantları (`buttonVariants`) |
| **Radix UI** | `@radix-ui/react-slot` (komponent polimorfizmi), `@radix-ui/react-toast` (bildirişlər) |
| **lucide-react** | İkonlar (sidebar, cədvəl əməliyyatları, modal bağlama və s.) |
| **Custom SVG** | `LoadingIcon` və s. asset ikonları |

## Formalar və cədvəllər

| Texnologiya | Təsvir |
|-------------|--------|
| **react-hook-form** | Departament / pozisiya yaratma və redaktə modallarında formlar |
| **@tanstack/react-table v8** | İstifadəçilər, departamentlər, pozisiyalar cədvəlləri |

## Şəbəkə və utilitilər

| Texnologiya | Təsvir |
|-------------|--------|
| **Fetch API** | RTK Query `fetchBaseQuery` ilə `VITE_APP_API` üzərindən sorğular; `Auth/GetAllUsers` üçün isteğe bağlı `search` query paramı tipdə saxlanılır |
| **uuid** | Pozisiya yaratmada server üçün `id` (v4) |

## Kod keyfiyyəti və alətlər

| Texnologiya | Təsvir |
|-------------|--------|
| **ESLint** | `@typescript-eslint/*`, `eslint-plugin-react-hooks`, `eslint-plugin-react-refresh` |
| **Prettier** | Formatlaşdırma |
| **Husky** | Git hook-ları (`prepare` skripti) |
| **Custom Vite plugin** | `src/utils/vite-plugin-auto-import-components` — komponentlərin avto-importu |

## Layihə strukturu (qısa)

- `src/pages/` — səhifələr və `_` prefiksli yardımçı modal komponentləri (Generouted)
- `src/services/` — RTK Query API (`auth`, `user`, `organization`)
- `src/store/` — Redux store, slice-lar, middleware (xəta idarəetməsi)
- `src/widgets/app-shell/` — sidebar, topbar, tema konteksti (`ShellThemeContext`)
- `src/components/` — UI primitivləri (Button, Input, DataTable, LoadingSpinner və s.)
- `src/types/` — TypeScript interfeysləri
- `src/assets/css/` — qlobal Tailwind / tema dəyişənləri

## Ətraf mühit dəyişənləri

Layihə `.env` üzərindən məsələn `VITE_APP_API`, `VITE_PERSIST_KEY` kimi dəyərlər gözləyir (faylları repozitoriyaya commit etməyin tövsiyə olunur).

---

*Sənəd layihənin cari asılılıqlarına əsaslanır; versiyalar `package.json`-dakı ilə uyğunlaşdırılmalıdır.*
