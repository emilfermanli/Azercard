# Texniki Tapşırıq — Acquiring Device Transaction (səhifə)

> Mənbə: `Acquiring device transaction.pptx` (dizayn 1-ci slayd) + Swagger
> `http://31.57.77.199:8080/swagger/index.html` → **AcquiringDevice** controller (3 endpoint).
> Bu sənəd yalnız **frontend**-ə aid hissəni əhatə edir. Slaydlardakı backend transformasiya
> məntiqi (slayd 4 — `Query`) yalnız istinad üçündür, frontend tərəfdə realizə olunmur.

---

## 1. Məqsəd

Mövcud `terminal-aktivliyi` (Devices) və `kart-portfoliyosu` (Cards) səhifələrinə bənzər yeni bir
**dashboard** səhifəsi. Səhifə `IS_ACQUIRING = 1` olan əməliyyatlar üzrə (ekvayrinq qurğuları)
seçilmiş tarix aralığında dövriyyə / əməliyyat sayı / orta məbləğ göstəricilərini müxtəlif
kəsimlərdə qrafiklərlə göstərir.

## 2. Route və adlandırma

| Element | Dəyər (təklif) |
|---|---|
| Route qovluğu | `src/pages/(app)/acquiring-device-transaction/index.tsx` |
| Menyu adı (AZ) | "Acquiring qurğu əməliyyatları" |
| Service (RTK Query) | `src/services/acquiring-device.service.ts` |
| Tip faylı | `src/types/acquiring-device.type.ts` |
| API base path | `AcquiringDevice/*` (mövcud `baseQuery` üzərindən) |

Pattern olaraq `devices.service.ts` (RTK Query + `createApi` + `cleanParams`) əsas götürülür.

---

## 3. Dizayn (1-ci slayd) — səhifə bloklarının yerləşməsi

Səhifə **2 hissəyə** bölünür: solda qrafiklər toru, sağda rəngli qurğu kartları.

```
┌──────────────────────────────────────────────┬───────────────┐
│  [1] Pay (donut)        [2] Trans Group (bar) │  POS  300 mln │  ← rəngli
│                         [3] Payment Sys (bar) │  ATM  128 mln │     qurğu
│                                               │  ECOM  78 mln │     kartları
│  [4] Zaman trendi       [5] Source Bank       │  C2C  300 mln │  (klikləndikdə
│      (+ proqnoz)        [6] Target Bank       │  UFX  250 mln │   filtr verir)
└──────────────────────────────────────────────┴───────────────┘
        ↑ scroll edildikdə 4, 5, 6 aşağıda görünür
```

### Sağ panel — Qurğu kartları (ACQUIRING_DEVICE_TYPE)
- Hər `acquiringDeviceType` (ATM, C2C, ECOM, POS, UFX) üçün rəngli kart: ad + seçilmiş
  kateqoriya üzrə dəyər (dövriyyə / sayı / orta).
- Kartlar 1-ci slayddakı rənglərə uyğun rənglənir; bütün qrafiklər həmin rəng palitrasını
  paylaşır (eyni qurğu tipi hər yerdə eyni rəngdə).
- **Klik = qlobal filtr**: kartlardan birinə klik edildikdə bütün qrafiklər (1–6) həmin qurğu
  tipinə görə yenidən filtrlənir. Təkrar klik filtri götürür (toggle).

### Qrafiklər
| № | Başlıq | Tip | Mənbə |
|---|---|---|---|
| 1 | Pay bölgüsü | Donut/Pie | `dashboard.pieChart` |
| 2 | Trans Group (Əməliyyat qrupları) | Üfüqi bar | `dashboard.transGroupChart` |
| 3 | Payment System (Visa, Master…) | Üfüqi bar | `dashboard.paymentSysChart` |
| 4 | Zaman trendi — total, ACQUIRING_DEVICE_TYPE üzrə + **proqnoz** | Sahə/xətt | `trend` endpoint |
| 5 | Source Bank (Issuing bank) | Bar/cədvəl | `dashboard.sourceBankChart` |
| 6 | Target Bank | Bar/cədvəl | `dashboard.targetBankChart` |

> Qeyd: 5 və 6-cı qrafiklər eyni görünüşdədir, yalnız mənbə dəyişir (source vs target bank).

---

## 4. Tələblər (2-ci slayd → realizə)

1. **Data**: `BI_transaction` cədvəli, `IS_ACQUIRING = 1` (backend filtrasiyası, API artıq belə qaytarır).
2. **Sağ kartlar**: `ACQUIRING_DEVICE_TYPE` üzrə dövriyyə / əməliyyat sayı / orta məbləğ
   (seçilmiş **Kateqoriya** parametrindən asılı olaraq).
3. **Qrafik 1** — pay qrafiki (sağ kartların payları).
4. **Qrafik 2** — `TRANS_GROUP` üzrə bölgü.
5. **Qrafik 3** — `PAYMENT_SYSTEM` üzrə bölgü.
6. **Qrafik 4** — by default `ACQUIRING_DEVICE_TYPE` üzrə **total** zaman trendi + ilin sonuna
   qədər **proqnozlaşdırma indikatoru** (`trend` cavabındakı `forecast*` sahələri).
7. **Qrafik 5** — `SOURCE_BANK_NAME` üzrə bölgü.
8. **Qrafik 6** — `TARGET_BANK_NAME` üzrə bölgü (5 ilə eyni).
9. **Qarşılıqlı təsir**: sağ kartlara klik bütün qrafiklərə təsir edir.
10. **Scroll**: 4, 5, 6-cı qrafiklər aşağı hissədə, scroll ilə görünür.
11. **Rənglər**: 1-ci slayddakı rəng sxemi.

---

## 5. Filtrlər və parametrlər (3-cü slayd)

Hamısı `filter-options` endpointindən doldurulur (multi-select dropdownlar — mövcud səhifələrdəki
`react-select` pattern-i).

**Filtrlər** (massiv, multi-select):
`ACQUIRING_DEVICE_TYPE`, `TRANS_GROUP`, `OPERATION_TYPE`, `TOKEN_STATUS`, `MCC`,
`IS_ACQUIRING_CATEGORY`, `TARGET_BANK_NAME`, `SOURCE_BANK_NAME`, `TARGET_CITY`,
`PAYMENT_SYSTEM`, `IS_CONTACTLESS`.

**Parametrlər**:
- **Date** — start date + end date (default API-nin `minDate`/`maxDate` aralığı).
- **Məbləğ vahidi** — `AmountUnit`: Min / Mln / Mlrd.
- **Kateqoriya** — `Category`: 3 seçim → **Ortalama məbləğ**, **Dövriyyə**, **Əməliyyat sayı**.

---

## 6. API müqaviləsi (AcquiringDevice — 3 endpoint)

Base URL: `http://31.57.77.199:8080/api/`. Bütün cavablar **camelCase**.
Test datası yalnız **2002-05-03 … 2002-05-30** aralığındadır (`filter-options.minDate/maxDate`).

### 6.1 `GET /AcquiringDevice/filter-options`
Bütün dropdownları doldurur. Parametrsiz.

```jsonc
{
  "acquiringDeviceTypes": ["ATM","C2C","ECOM","POS","UFX"],
  "transGroups":   ["ATM","Bill Payment","Cash", ...],      // 13 dəyər
  "operationTypes":["CASH","NON CASH"],
  "tokenStatuses": ["NO"],
  "mccs":          ["007a1d...", ...],                       // ~194, HASH (maskalanıb)
  "acquiringCategories": ["Domestic AC","Domestic Non-AC","Foreign non-AC","On-US"],
  "targetBanks":   ["0003ce...", ...],                       // 32, HASH (maskalanıb)
  "sourceBanks":   ["042c0a...", ...],                       // 23, HASH (maskalanıb)
  "targetCities":  [" ","  BAKI SH", ...],                   // ~2509
  "paymentSystems":["AMEX","Diners Club","Internal","JCB","MasterCard International","UnionPay","VISA"],
  "contactlessStatuses": ["0","1"],
  "minDate": "2002-05-03T00:00:00",
  "maxDate": "2002-05-30T00:00:00"
}
```

> ⚠️ `mccs`, `targetBanks`, `sourceBanks` test mühitində **hash** dəyərlərdir (oxunaqlı ad deyil).
> UI-da göstərmək üçün prod-da real adlar gözlənilir. `contactlessStatuses` = `"0"/"1"`.

### 6.2 `GET /AcquiringDevice/dashboard`
6 qrafikin (1,2,3,5,6 + sağ kartlar) datasını **bir sorğuda** qaytarır.

**Query parametrləri** (hamısı optional):
`FromDate`, `ToDate`, `Category`, `AmountUnit` (string) +
massiv filtrlər: `AcquiringDeviceTypes`, `TransGroups`, `OperationTypes`, `TokenStatuses`,
`Mccs`, `AcquiringCategories`, `TargetBankNames`, `SourceBankNames`, `TargetCities`,
`PaymentSystems`, `ContactlessStatuses`.

**Cavab**:
```jsonc
{
  "deviceSummary": [   // sağ rəngli kartlar (ACQUIRING_DEVICE_TYPE)
    { "deviceType":"ATM", "volume":286298077.01, "count":944434, "avgAmount":303.14 }
  ],
  "pieChart": [        // qrafik 1
    { "label":"ATM", "value":286298077.01, "count":944434, "percent":67.62 }
  ],
  "transGroupChart": [ // qrafik 2  (TRANS_GROUP)
    { "transGroup":"ATM", "value":268244761.63, "count":914453, "percent":63.35 }
  ],
  "paymentSysChart": [ // qrafik 3  (PAYMENT_SYSTEM)
    { "paymentSystem":"VISA", "value":206201755.16, "count":778878, "percent":48.7 }
  ],
  "sourceBankChart": [ // qrafik 5  (SOURCE_BANK_NAME) — top 20
    { "bankName":"042c0a...", "value":250830647.74, "count":1026472, "percent":59.24 }
  ],
  "targetBankChart": [ // qrafik 6  (TARGET_BANK_NAME) — top 20
    { "bankName":"042c0a...", "value":243526165, "count":925365, "percent":57.52 }
  ]
}
```
> `deviceSummary` hər kartda `volume`/`count`/`avgAmount` **üçünü də** qaytarır — kartda hansının
> göstərilməsini **Category** parametri (frontend) müəyyən edir.

### 6.3 `GET /AcquiringDevice/trend`
Qrafik 4 — zaman seriyaları (+ proqnoz). `dashboard` parametrlərinin hamısı + əlavə:
- `Dimension` (**required**) — seriyaların hansı ölçü üzrə bölünəcəyi.
- `DimValues` (array) — yalnız seçilmiş dəyərlərlə məhdudlaşdırmaq üçün (optional).
- `Granularity` — `Day` | `Week` | `Month` | `Quarter` | `Year`.

**Etibarlı `Dimension` dəyərləri** (snake_case, DB sütunlarına uyğun):
`trans_group`, `payment_system`, `source_bank_name`, `target_bank_name`,
`operation_type`, `mcc`, `is_acquiring_category`.

> ⚠️ **Açıq sual**: `ACQUIRING_DEVICE_TYPE` üzrə trend ölçüsü (qrafik 4-ün default-u) hazırda
> tapılmadı — `acquiring_device_type`, `device_type` və s. "Invalid dimension" qaytarır.
> Qrafik 4 spesifikasiyaya görə **qurğu tipi üzrə total** olmalıdır; backend-dən bu Dimension
> dəyərinin əlavə edilməsi tələb olunur. (`token_status`, `target_city`, `contactless` də
> hazırda invalid/xəta verir.)

**Cavab**:
```jsonc
{
  "series": [
    {
      "label": "ATM",
      "points": [
        {
          "period": "2002-05-01T00:00:00",
          "actual": 268244761.63,
          "forecast": 0,
          "isForecast": false,
          "forecastLower": 0,
          "forecastUpper": 0,
          "forecastAccuracy": 0,
          "forecastModel": null
        }
      ]
    }
  ]
}
```
> Proqnoz sahələri (`forecast`, `isForecast`, `forecastLower/Upper`, `forecastAccuracy`,
> `forecastModel`) sxemdə mövcuddur, lakin test datasında bir aylıq tarixçə olduğu üçün `0`/`false`
> qayıdır. Qrafik 4-də keçmiş (`actual`, `isForecast=false`) və proqnoz (`isForecast=true`,
> `forecastLower/Upper` ilə güvən zolağı) ayrıca stillə göstərilməlidir.

---

## 7. Davranış qaydaları

- **Bir dəfə yüklənir**: `filter-options` (mount-da). `dashboard` və `trend` filtr/parametr
  dəyişdikdə yenidən çağırılır.
- **Sağ kart kliki** seçilmiş `AcquiringDeviceTypes` filtrinə əlavə/çıxarış edir → həm `dashboard`,
  həm `trend` yeni parametrlə yenilənir.
- **Tarix default-u** `minDate`/`maxDate`-dən gəlir (hardcode etmə — test datası 2002-ci ildir).
- `cleanParams` ilə boş/`undefined` parametrlər sorğudan çıxarılır.
- Rəng palitrası mərkəzi yerdə (qurğu tipi → rəng map) saxlanır və bütün qrafiklərdə paylaşılır.

## 8. Açıq suallar (backend-ə)

1. Qrafik 4 üçün `ACQUIRING_DEVICE_TYPE` Dimension dəyəri əlavə edilməlidir.
2. `Category` / `AmountUnit` parametrləri hazırda cavab dəyərlərini dəyişmir (həmişə dövriyyə
   qaytarır) — backend bunları tətbiq edəcək, yoxsa hesablama frontend-də olmalıdır?
3. `mcc`, `sourceBanks`, `targetBanks` prod-da real (oxunaqlı) adlarla qayıdacaqmı?
4. `token_status`, `target_city`, `contactless` üçün trend Dimension-ları düzəldilməlidir (lazımdırsa).
