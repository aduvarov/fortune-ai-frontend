// src/constants/tarot.ts
import { LayoutType } from '../types/dto'

// --- 1. ГЕНЕРАЦИЯ КОЛОДЫ ИЗ 78 КАРТ ---
export interface TarotCardDef {
    id: string
    name: string
}

const MAJOR_ARCANA = [
    'Шут',
    'Маг',
    'Верховная Жрица',
    'Императрица',
    'Император',
    'Иерофант',
    'Влюбленные',
    'Колесница',
    'Сила',
    'Отшельник',
    'Колесо Фортуны',
    'Справедливость',
    'Повешенный',
    'Смерть',
    'Умеренность',
    'Дьявол',
    'Башня',
    'Звезда',
    'Луна',
    'Солнце',
    'Суд',
    'Мир',
]

const SUITS = [
    { id: 'wands', name: 'Жезлов' },
    { id: 'cups', name: 'Кубков' },
    { id: 'swords', name: 'Мечей' },
    { id: 'pentacles', name: 'Пентаклей' },
]

const MINOR_VALUES = [
    'Туз',
    'Двойка',
    'Тройка',
    'Четверка',
    'Пятерка',
    'Шестерка',
    'Семерка',
    'Восьмерка',
    'Девятка',
    'Десятка',
    'Паж',
    'Рыцарь',
    'Королева',
    'Король',
]

export const TAROT_DECK: TarotCardDef[] = [
    ...MAJOR_ARCANA.map((name, index) => ({ id: `major_${index}`, name })),
    ...SUITS.flatMap(suit =>
        MINOR_VALUES.map((value, index) => ({
            id: `minor_${suit.id}_${index + 1}`,
            name: `${value} ${suit.name}`,
        })),
    ),
]

// --- 2. КОНФИГУРАЦИЯ РАСКЛАДОВ (Позиции) ---
export interface LayoutPosition {
    id: string
    title: string
}

export const LAYOUT_CONFIG: Record<LayoutType, LayoutPosition[]> = {
    daily: [
        { id: 'pos_1', title: 'Энергия дня' },
        { id: 'pos_2', title: 'Совет' },
        { id: 'pos_3', title: 'Вызов' },
    ],
    chronological: [
        { id: 'pos_1', title: 'Прошлое' },
        { id: 'pos_2', title: 'Настоящее' },
        { id: 'pos_3', title: 'Будущее' },
    ],
    partner: [
        { id: 'pos_1', title: 'Ваша энергия' },
        { id: 'pos_2', title: 'Энергия партнера' },
        { id: 'pos_3', title: 'Связь между вами' },
    ],
    reflective: [
        { id: 'pos_1', title: 'Суть проблемы' },
        { id: 'pos_2', title: 'Скрытое влияние' },
        { id: 'pos_3', title: 'Совет' },
        { id: 'pos_4', title: 'Возможный исход' },
    ],
}
