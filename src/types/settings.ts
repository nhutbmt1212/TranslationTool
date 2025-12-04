export type TabType = 'apiKey' | 'update' | 'shortcuts' | 'textSelectionIgnore' | 'features';

export interface FeaturesConfig {
  quickCaptureEnabled: boolean;
  textSelectionEnabled: boolean;
  textSelectionIgnoreEnabled: boolean;
}
