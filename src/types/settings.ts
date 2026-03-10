import { DrawSource } from './dto';

/** Ответ GET /tarot/status */
export interface ILimitStatus {
    canReadFree: boolean;
    timeUntilNextFree: number | null;
}

/** Состояние стора настроек */
export interface ISettingsState {
    hapticsEnabled: boolean;
    defaultDrawSource: DrawSource;

    toggleHaptics: () => void;
    setDefaultDrawSource: (source: DrawSource) => void;
}
