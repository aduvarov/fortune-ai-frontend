import { DrawSource } from './dto';

/** Состояние стора настроек */
export interface ISettingsState {
    hapticsEnabled: boolean;
    defaultDrawSource: DrawSource;

    toggleHaptics: () => void;
    setDefaultDrawSource: (source: DrawSource) => void;
}
