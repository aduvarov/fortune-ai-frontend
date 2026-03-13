import { DrawSource } from './dto';

/** Состояние стора настроек */
export interface ISettingsState {
    hapticsEnabled: boolean;
    defaultDrawSource: DrawSource;
    aiConsentAccepted: boolean;

    toggleHaptics: () => void;
    setDefaultDrawSource: (source: DrawSource) => void;
    setAiConsentAccepted: (accepted: boolean) => void;
}
