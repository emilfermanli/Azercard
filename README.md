# Azericard — idarəetmə paneli

React + TypeScript ilə yazılmış daxili idarəetmə paneli: autentifikasiya, istifadəçi siyahısı, departament və pozisiya modulları.

Ətraflı **texnologiya siyahısı** üçün bax: [`TECH_STACK.md`](./TECH_STACK.md).

---

## Tələblər

- Node.js (LTS tövsiyə olunur)
- npm

## Quraşdırma və işə salma

```bash
npm install
npm run dev
```

Brauzerdə adətən: `http://localhost:5173`

Digər skriptlər:

| Skript | Təsvir |
|--------|--------|
| `npm run build` | TypeScript yoxlaması + production build |
| `npm run preview` | Build önizləməsi |
| `npm run lint` | ESLint |
| `npm run prettier` | Prettier formatı |

---

## Ətraf mühit (`.env`)

| Dəyişən | Təsvir |
|---------|--------|
| `VITE_APP_API` | Backend API baza ünvanı (məs. `http://.../api/`) — bütün RTK Query sorğuları bu prefiksdən gedir |
| `VITE_PERSIST_KEY` | `redux-persist` şifrələmə açarı — **məxfilik üçün repoda real dəyər saxlamayın** |
| `VITE_DOMAIN` | İstinad / konfiqurasiya üçün (məs. `http://localhost:5173`) |
| `GENERATE_SOURCEMAP` | Məs. `false` — source map generasiyası |

---

## Tətbiq strukturu

### Marşrutlar (Generouted)

Fayllar `src/pages/` altında təşkil olunub; `src/router.ts` avtomatik generasiya olunur (`_` prefiksli `.tsx` faylları marşrut kimi götürülmür — modallar üçün).

| Marşrut | Təsvir |
|---------|--------|
| `/login` | Giriş |
| `/istifadeciler` | İstifadəçi siyahısı (səhifələmə) |
| `/departamentler` | Departamentlər CRUD |
| `/pozisiyalar` | Pozisiyalar CRUD |
| `/403` | Giriş icazəsi yoxdur |

### Shell

`AppShell`: sidebar, topbar, əsas məzmun sahəsi. **Tema** `ShellThemeContext` ilə idarə olunur (açıq / qaranlıq görünüş); bu, `html`-də `.dark` sinfindən asılı olmayan lokal shell temasıdır — semantic `bg-background` bəzi komponentlərdə ayrıca uyğunlaşdırılıb.

---

## Autentifikasiya

1. **`POST Auth/login`** — body: `email`, `password`. Cavab: token + müddət məlumatı; xətalar API formatına uyğun emal olunur.
2. Uğurlu girişdən sonra **`GET auth/getcurrentuserdata`** — cari istifadəçi; Redux-da saxlanılır.
3. `fetchBaseQuery` sorğulara `Authorization: Bearer <token>` əlavə edir (auth state-dən).

---

## API inteqrasiyası (xülasə)

Baza URL: `import.meta.env.VITE_APP_API` (adətən sonunda `/`).

### İstifadəçilər (`user.service.ts`)

| Əməliyyat | Metod | Endpoint | Qeyd |
|-----------|-------|----------|------|
| Siyahı | GET | `Auth/GetAllUsers` | Query: `pageNumber`, `pageSize`, istəyə bağlı `search` |

### Departamentlər (`organization.service.ts`)

| Əməliyyat | Metod | URL / body |
|-----------|-------|-------------|
| Siyahı | GET | `department` — cavab massiv kimi normalizasiya olunur |
| Tək qeyd | GET | `department/{id}` |
| Yarat | POST | `department` — body: `{ name, description }` |
| Yenilə | PUT | `department/update` — body: `{ id, name, description }` |
| Sil | DELETE | `department/{id}` | |

### Pozisiyalar

| Əməliyyat | Metod | URL / body |
|-----------|-------|-------------|
| Siyahı | GET | `position` |
| Tək qeyd | GET | `position/{id}` |
| Yarat | POST | `position` — body: `{ id, name, description, isActive }` (`id` üçün client-də `uuid` v4) |
| Yenilə | PUT | `position/update` — body: `{ id, name, description, isActive }` |
| Sil | DELETE | `position/{id}` | |

Backend path / HTTP metodu fərqlidirsə, uyğun `src/services/organization.service.ts` (və ya `auth.service.ts`) dəyərlərini dəyişdirin.

---

## UI modulları

### İstifadəçilər

- TanStack Table, server tərəfli səhifələmə.
- Yüklənmə vəziyyətlərində mətn əvəzinə **spinner** (`LoadingSpinner`).

### Departamentlər

- Cədvəl + **Yeni departament** düyməsi.
- Modallar: `_department-create-modal.tsx`, `_department-view-modal.tsx`, `_department-edit-modal.tsx`, `_department-delete-modal.tsx`.
- Cədvəldə əməliyyatlar: baxış, redaktə, silmə (ikon düymələri).

### Pozisiyalar

- Cədvəl + **Yeni pozisiya** düyməsi.
- Modallar: `_position-create-modal.tsx`, `_position-view-modal.tsx`, `_position-edit-modal.tsx`, `_position-delete-modal.tsx`.
- Formada: ad, təsvir, aktiv checkbox; əməkdaş (`employees`) sahəsi layihədən çıxarılıb.

### Redaktə formu qeydi

Modal bağlandıqdan sonra yenidən açılanda cache-dən eyni məlumat gəldikdə forma yenidən doldurulması üçün `open` + `data` birlikdə `useEffect` asılılıqlarında idarə olunur.

---

## Redux store

`src/store/index.ts`: `auth`, `app`, `authApi`, `userApi`, `organizationApi`, `redux-persist` (auth whitelist), xəta middleware.

---

## Fayl yerləri (istinad)

| Sahə | Qovluq / fayl |
|------|----------------|
| Səhifələr | `src/pages/(app)/…`, `src/pages/(auth)/login` |
| API | `src/services/*.service.ts` |
| Tiplər | `src/types/*.type.ts` |
| Shell | `src/widgets/app-shell/` |
| Ümumi komponentlər | `src/components/` |
| Base sorğu | `src/utils/fetchBaseQuery.ts` |

---

## Əlavə

- Layihə **@abilovelchin/react-ts-starter-kit** əsasında inkişaf etdirilib; orijinal şablon README-si bu faylda əvəz olunub.
- Kod standartları üçün layihədə `.cursor/rules/react.mdc` ola bilər.

Əgər API kontraktı dəyişərsə, əsas toxunuş nöqtələri `src/services/` və `src/types/` qovluqlarıdır.
