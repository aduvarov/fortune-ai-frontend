# Fortune AI — Полная документация проекта

## 1. Обзор проекта

**Fortune AI** — мобильное приложение для гадания на картах Таро с использованием ИИ (Google Gemini). Пользователь выбирает тип расклада, способ вытягивания карт (виртуальный или с физической колоды), а затем ИИ делает интерпретацию выпавших карт.

### Основная бизнес-логика

1. **Анонимная авторизация** — пользователь идентифицируется по `deviceId`, JWT-токен хранится в Expo SecureStore.
2. **Выбор расклада** — 4 типа: Карта Дня (daily), Прошлое/Настоящее/Будущее (chronological), Отношения (partner), Внутренний Конфликт (reflective).
3. **Вытягивание карт** — виртуально (с анимацией тасования, энергетической "зарядкой" и haptic-откликом) или ручной ввод с физической колоды (поиск + выбор из справочника 78 карт).
4. **Интерпретация ИИ** — выбранные карты отправляются на бэкенд, Gemini 2.5 Flash генерирует подробную интерпретацию.
5. **Лимиты** — бесплатный расклад 1 раз в 24 часа, обход через просмотр рекламы (`isAd` флаг).
6. **История** — все расклады сохраняются в Supabase, доступна пагинированная история с удалением.

---

## 2. Архитектура и структура

### Монорепо с двумя подпроектами

```
fortune-ai/
├── fortune-ai-backend/     # NestJS REST API
│   └── src/
│       ├── main.ts                      # Точка входа, ValidationPipe
│       ├── app.module.ts                # Корневой модуль (Config, Supabase, Auth, Tarot, Gemini, History)
│       ├── auth/                        # Модуль авторизации
│       │   ├── auth.controller.ts       # POST /auth/init-anonymous
│       │   ├── auth.service.ts          # Логика создания/логина анонимного пользователя через Supabase Auth
│       │   ├── dto/
│       │   │   └── init-anonymous.dto.ts
│       │   ├── interfaces/
│       │   │   └── auth-response.interface.ts
│       │   ├── guards/
│       │   │   └── jwt-auth.guard.ts    # Проверка JWT через Supabase getUser()
│       │   └── decorators/
│       │       └── user.decorator.ts    # @GetUser('id') — извлечение userId из request
│       ├── tarot/                       # Модуль Таро (основная логика)
│       │   ├── tarot.controller.ts      # GET /tarot/status, POST /tarot/interpret
│       │   ├── tarot.service.ts         # Проверка лимитов, оркестрация интерпретации
│       │   ├── dto/
│       │   │   └── interpret-reading.dto.ts  # InterpretReadingDto, CardInputDto + LayoutType, DrawSource
│       │   ├── interfaces/
│       │   │   └── tarot.interface.ts   # TarotCard, ReadingResponse, LimitStatusResponse
│       │   └── constants/
│       │       └── tarot.constants.ts
│       ├── gemini/                      # Обертка над Google Gemini API
│       │   ├── gemini.module.ts
│       │   └── gemini.service.ts        # Системный промпт + генерация интерпретации
│       ├── history/                     # Модуль истории раскладов
│       │   ├── history.controller.ts    # GET /history, DELETE /history/:id
│       │   ├── history.service.ts       # Пагинация, безопасное удаление
│       │   └── interfaces/
│       │       └── history.interface.ts # HistoryReadingItem, PaginatedHistory
│       └── supabase/                    # Обертка над Supabase
│           ├── supabase.module.ts
│           ├── supabase.service.ts      # Admin-клиент с типизацией Database
│           └── database.types.ts        # Строгие типы таблиц users и readings
│
└── fortune-ai-frontend/     # React Native (Expo) мобильное приложение
    └── src/
        ├── api/
        │   ├── api.client.ts            # Axios с interceptors (auto Bearer, auto 401-retry)
        │   └── tarot.api.ts             # Фасад: initAnonymous, checkStatus, interpretReading, getHistory, deleteHistoryItem
        ├── constants/
        │   ├── theme.ts                 # COLORS (глобальная тема — тёмно-синяя палитра)
        │   ├── tarot.ts                 # TAROT_DECK (78 карт), LAYOUT_CONFIG (позиции раскладов)
        │   └── tarotImages.ts           # Маппинг id -> require() для картинок карт
        ├── navigation/
        │   └── AppNavigator.tsx         # Stack Navigator (Splash → Home → SetupReading → VirtualTable/PhysicalInput → Result)
        ├── screens/
        │   ├── SplashScreen.tsx         # Авторизация при старте → Home
        │   ├── HomeScreen.tsx           # Главная (навигация на SetupReading, History, Settings)
        │   ├── SetupReadingScreen.tsx    # Выбор расклада + колоды (модалки с описанием + ввод вопроса)
        │   ├── VirtualTableScreen.tsx   # Виртуальный стол (анимация тасования, PanResponder, haptics, flip-переворот карт)
        │   ├── PhysicalInputScreen.tsx  # Ручной ввод карт (поиск, выбор перевернута/нет)
        │   ├── ResultScreen.tsx         # Отправка на API, показ интерпретации ИИ, обработка 403 (реклама)
        │   └── HistoryScreen.tsx        # Список раскладов (пагинация, expand/collapse, удаление)
        ├── store/
        │   └── useAuthStore.ts          # Zustand + persist → Expo SecureStore
        ├── types/
        │   ├── dto.ts                   # CardInputDto, InterpretReadingDto, LayoutType, DrawSource (интерфейсы)
        │   └── navigation.ts           # RootStackParamList
        └── utils/
            ├── device.ts                # getOrCreateDeviceId() — UUID в SecureStore
            └── secureStorage.ts         # Адаптер StateStorage для Zustand → SecureStore
```

### Архитектура бэкенда (NestJS)

```
Controller → Service → [SupabaseService / GeminiService]
     ↑
  JwtAuthGuard + @GetUser('id')
```

- **Controller** — принимает HTTP-запросы, валидирует DTO через `class-validator`, возвращает типизированные ответы.
- **Service** — содержит бизнес-логику (проверка лимитов, оркестрация ИИ-запроса, сохранение в БД).
- **SupabaseService** — единый Singleton, предоставляет типизированный `SupabaseClient<Database>`.
- **GeminiService** — обёртка над `@google/generative-ai`, системный промпт + промпт расклада.
- **JwtAuthGuard** — проверяет Bearer-токен через `supabase.auth.getUser(token)` и прикрепляет `user` к запросу.

---

## 3. Стек технологий и стандарты кода

### Backend
| Технология | Версия/Примечание |
|---|---|
| **NestJS** | Основной фреймворк |
| **TypeScript** | Strict mode |
| **Supabase** | БД (PostgreSQL) + Auth |
| **Google Gemini** | `@google/generative-ai`, модель `gemini-2.5-flash` |
| **class-validator** | Валидация DTO |
| **class-transformer** | Трансформация вложенных объектов |
| **@nestjs/config** | `.env` через `ConfigModule.forRoot({ isGlobal: true })` |

### Frontend
| Технология | Версия/Примечание |
|---|---|
| **React Native** | Expo managed workflow |
| **TypeScript** | Strict mode |
| **Expo** | expo-secure-store, expo-crypto, expo-haptics, @expo/vector-icons |
| **React Navigation** | `@react-navigation/native-stack` |
| **Zustand** | State management + persist middleware |
| **Axios** | HTTP-клиент с interceptors |

### Строгие правила кода

> ⚠️ **Эти правила обязательны для соблюдения:**

1. **TypeScript strict mode** — используется на обеих сторонах.
2. **Запрет `any`** — все данные должны быть типизированы. Единственное текущее исключение — `HistoryScreen` (`any[]` в стейте — нужно исправить, см. TODO).
3. **Интерфейсы** — все структуры данных описаны через `interface` (фронтенд) или `class` с декораторами валидации (бэкенд DTO).
4. **DTO** — каждый API-эндпоинт принимает/возвращает строго типизированные DTO. На бэкенде `ValidationPipe` с `whitelist: true` и `forbidNonWhitelisted: true`.
5. **Нет прямого SQL** — всё через Supabase JS Client с типизацией `Database`.

---

## 4. API Эндпоинты

### Auth

| Метод | Путь | Защита | Описание |
|---|---|---|---|
| `POST` | `/auth/init-anonymous` | ❌ Нет | Инициализация анонимного пользователя |

**Request Body — `InitAnonymousDto`:**
```typescript
{
    deviceId: string  // @IsString, @IsNotEmpty
}
```

**Response — `AuthResponse`:**
```typescript
{
    accessToken: string,
    user: {
        id: string,
        deviceId: string,
        role: string       // всегда 'anonymous'
    }
}
```

---

### Tarot

| Метод | Путь | Защита | Описание |
|---|---|---|---|
| `GET` | `/tarot/status` | ✅ JWT | Проверка лимита бесплатного расклада |
| `POST` | `/tarot/interpret` | ✅ JWT | Отправка карт на интерпретацию ИИ |

**GET `/tarot/status` Response — `LimitStatusResponse`:**
```typescript
{
    canReadFree: boolean,
    timeUntilNextFree: number | null  // миллисекунды до следующего фри-расклада
}
```

**POST `/tarot/interpret` Request Body — `InterpretReadingDto`:**
```typescript
{
    question: string,              // @IsString, @IsNotEmpty, @MaxLength(500)
    layoutType: LayoutType,        // 'chronological' | 'reflective' | 'partner' | 'daily'
    drawSource: DrawSource,        // 'app' | 'physical'
    isAd?: boolean,                // @IsBoolean, @IsOptional — пропуск лимита через рекламу
    cards: CardInputDto[]          // @IsArray, @ValidateNested, @ArrayMinSize(3), @ArrayMaxSize(4)
}
```

**`CardInputDto`:**
```typescript
{
    id: string,        // Идентификатор карты ('major_0', 'minor_cups_5')
    name: string,      // Название ('Шут', 'Пятерка Кубков')
    position: string,  // Позиция в раскладе ('Прошлое', 'Скрытое влияние')
    isReversed: boolean
}
```

**Response:**
```typescript
{
    cards: CardInputDto[],
    aiResponse: string       // Текст интерпретации от Gemini
}
```

---

### History

| Метод | Путь | Защита | Описание |
|---|---|---|---|
| `GET` | `/history?page=1&limit=10` | ✅ JWT | Получение истории раскладов |
| `DELETE` | `/history/:id` | ✅ JWT | Удаление расклада |

**GET `/history` Response — `PaginatedHistory`:**
```typescript
{
    data: HistoryReadingItem[],
    total: number,
    page: number,
    limit: number
}
```

**`HistoryReadingItem`:**
```typescript
{
    id: string,
    question: string,
    cards: CardInputDto[],
    aiResponse: string,
    drawSource: string,
    createdAt: string
}
```

**DELETE `/history/:id` Response:**
```typescript
{ success: boolean }
```

---

## 5. Модели данных / Схема БД (Supabase PostgreSQL)

### Таблица `users`

| Поле | Тип | Описание |
|---|---|---|
| `id` | `string (UUID)` | PK, берется из `auth.users` |
| `device_id` | `string` | Уникальный идентификатор устройства |
| `email` | `string | null` | Технический email (`{deviceId}@anonymous.tarot.local`) |
| `auth_provider` | `string` | Всегда `'anonymous'` |
| `last_free_reading_at` | `string (timestamp)` | Время последнего бесплатного расклада |
| `created_at` | `string (timestamp)` | Дата регистрации |

### Таблица `readings`

| Поле | Тип | Описание |
|---|---|---|
| `id` | `string (UUID)` | PK, auto-generated |
| `user_id` | `string (UUID)` | FK → `users.id` |
| `question` | `string` | Вопрос пользователя |
| `cards` | `Json` | Массив `CardInputDto[]` в JSON |
| `ai_response` | `string` | Полный текст ответа Gemini |
| `raw_prompt` | `string | null` | Промпт, отправленный в Gemini (для дебага) |
| `is_ad_rewarded` | `boolean` | Был ли расклад "рекламным" |
| `draw_source` | `string` | `'app'` или `'physical'` |
| `created_at` | `string (timestamp)` | Дата расклада |

**Связь:** `readings.user_id` → `users.id` (FK `readings_user_id_fkey`, many-to-one).

---

## 6. Ключевая логика сервисов

### AuthService — Анонимная авторизация

1. Генерирует "фиктивный" `email` и `password` из `deviceId`.
2. Пытается `signInWithPassword()` — если пользователь уже существует, возвращает JWT.
3. Если нет — создает пользователя через `admin.createUser()`, записывает профиль в `public.users`, логинит и возвращает JWT.

### TarotService — Интерпретация расклада

1. Проверяет лимит: разница `Date.now() - last_free_reading_at >= 24h`. Если лимит не истек и `isAd !== true` → `ForbiddenException (403)`.
2. Вызывает `GeminiService.askTarotReader(question, cards)`.
3. Обновляет `last_free_reading_at` (если это не рекламный расклад).
4. Сохраняет расклад в таблицу `readings`.

### GeminiService — ИИ-интерпретация

- **Системный промпт:** AI играет роль эмпатичного таролога-психолога. Жесткие guardrails: нет фаталистических прогнозов, отказ от медицинских/юридических/финансовых тем.
- **Промпт расклада:** формируется из вопроса + описания карт (название, позиция, прямая/перевёрнутая).
- **Параметры генерации:** `maxOutputTokens: 2500`, `temperature: 0.7`.

### Axios Interceptors (фронтенд)

- **Request interceptor:** автоматически добавляет `Authorization: Bearer <token>` из Zustand.
- **Response interceptor:** при `401` автоматически пытается "обновить" токен через повторный вызов `POST /auth/init-anonymous` с `deviceId` из стора, затем повторяет оригинальный запрос.

### VirtualTableScreen — Виртуальный стол

- **Тасование:** анимация с 3 "разлетающимися" картами (`Animated.loop`) + haptic-вибрация каждые 300мс. Длительность рандомная (3.5–5 сек).
- **Вытягивание:** `PanResponder`, палец нужно держать ≥2 сек ("зарядка энергии"), пульсирующая аура. Позиция среза колоды зависит от координаты X касания.
- **Переворот:** 15% вероятность перевернутой карты. Анимация flip через `rotateY`.

---

## 7. Глобальная тема (цвета)

Файл: `src/constants/theme.ts`

```typescript
export const COLORS = {
    background: '#0A1128',                    // Глубокий темно-синий фон
    primary: '#48CAE4',                       // Мистический голубой/циан
    primaryLight: 'rgba(72, 202, 228, 0.1)',  // Полупрозрачный фон
    primaryBorder: 'rgba(72, 202, 228, 0.3)', // Бордеры
    textMain: '#FFFFFF',
    textSecondary: '#8A9BAE',                 // Сине-серый
    cardBackground: 'rgba(255, 255, 255, 0.05)',
    modalBackground: '#111827',
    overlay: 'rgba(0, 0, 0, 0.7)',
    whiteLight: 'rgba(255, 255, 255, 0.1)',
    whiteMedium: 'rgba(255, 255, 255, 0.3)',
    darkTextEnabled: '#0A1128',
};
```

Все экраны используют `COLORS` из этого файла. Для глобальной смены палитры достаточно изменить только `theme.ts`.

---

## 8. Переменные окружения

### Backend (`.env`)
```
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
GEMINI_API_KEY=...
```

### Frontend
```
EXPO_PUBLIC_API_URL=http://192.168.11.11:3000   // или production URL
```

---

## 9. Текущий статус и TODO

### ✅ Полностью реализовано и работает

- [x] Анонимная авторизация (deviceId → Supabase Auth → JWT)
- [x] JWT Guard с автоматической проверкой через Supabase
- [x] Zustand стор с persist в Expo SecureStore
- [x] Axios interceptors (auto Bearer + auto 401-retry)
- [x] 4 типа раскладов с конфигурацией позиций
- [x] Виртуальный стол (тасование, зарядка, анимация вылета и переворота карт, haptics)
- [x] Физический ввод карт (поиск с маппингом цифр → слов, переключатель "перевернута")
- [x] Отправка карт на Gemini для интерпретации
- [x] Системный промпт с guardrails для безопасности
- [x] Лимит 1 бесплатный расклад в 24 часа + обход через `isAd`
- [x] Сохранение всех раскладов в Supabase
- [x] Пагинированная история с expand/collapse и удалением
- [x] Глобальная тема (тёмно-синяя палитра, все цвета вынесены в `theme.ts`)
- [x] Показ картинок карт Таро Райдера-Уэйта

### 🔧 Известные проблемы / TODO

- [ ] **`any` в `HistoryScreen.tsx`** — `useState<any[]>([])` на строке 32 и `renderItem: ({ item }: { item: any })` на строке 117. Нужно заменить на строгий `HistoryReadingItem` интерфейс.
- [ ] **`any` в `ResultScreen.tsx`** — `catch (error: any)` на строке 69. Нужно типизировать AxiosError.
- [ ] **Экран Settings** — заглушка (`SettingsScreen` внутри `AppNavigator.tsx`), нет реальной реализации.
- [ ] **Интеграция реальной рекламы** — `handleWatchAd()` в `ResultScreen` имитирует рекламу через `setTimeout(2000)`.
- [ ] **Описание карт в модалке** — `ResultScreen` использует захардкоженный `MOCK_CARD_DESCRIPTION` вместо реальных описаний карт.
- [ ] **Откат при ошибке регистрации** — в `AuthService` (строка 80) нет удаления из `auth.users` если `INSERT` в `public.users` упал.
- [ ] **console.log в `HistoryService`** — строки 22 и 35, оставлены дебаг-логи.
- [ ] **`PhysicalInputScreen`** не передает `question` при навигации на `Result` (строка 102–106).
- [ ] **Нет тестов** — ни unit, ни e2e тестов не написано.

---

## 10. Ключевые команды

```bash
# Backend
cd fortune-ai-backend
npm run start:dev          # Запуск в dev-режиме (порт 3000)

# Frontend
cd fortune-ai-frontend
npx expo start             # Запуск Expo dev server
```
