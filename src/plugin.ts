/**
 * Expo config plugin for Hermetica: sets the native config push (and optionally geofencing) need at `expo prebuild`, and puts the
 * site key and endpoint in `extra.hermetica` for the app to read. It edits only the app config fields Expo already applies
 * (`ios.entitlements`, `ios.infoPlist`, `android.permissions`, `extra`), so it needs no dependency on @expo/config-plugins.
 * The runtime SDK is @hermetica/sdk-react-native.
 */
export interface HermeticaPluginProps {
  /** Public site key (never a secret key). Read back with `Constants.expoConfig.extra.hermetica.siteKey`. */
  siteKey?: string;
  endpoint?: string;
  /** APNs environment of the build (default production; development for dev-client builds signed for development). */
  apsEnvironment?: 'development' | 'production';
  /** Push setup: aps-environment, background remote notifications, Android 13 POST_NOTIFICATIONS. Default true. */
  push?: boolean;
  /** Geofencing permissions; the string is the iOS "always" location prompt. Off unless given. */
  geofencing?: { locationUsage: string };
}

type Dict = Record<string, unknown>;
/** The parts of Expo's app config this plugin reads and writes. */
export interface ExpoConfig {
  ios?: { entitlements?: Dict; infoPlist?: Dict } & Dict;
  android?: { permissions?: string[] } & Dict;
  extra?: Dict;
  [k: string]: unknown;
}

const add = (list: unknown, ...items: string[]): string[] => {
  const out = Array.isArray(list) ? list.filter((x): x is string => typeof x === 'string') : [];
  for (const i of items) if (!out.includes(i)) out.push(i);
  return out;
};

export default function withHermetica(config: ExpoConfig, props: HermeticaPluginProps = {}): ExpoConfig {
  if (props.siteKey?.startsWith('hm_sk_')) throw new Error('withHermetica: use the public site key, never a secret hm_sk_ key, in an app');
  const ios = { ...config.ios, entitlements: { ...config.ios?.entitlements }, infoPlist: { ...config.ios?.infoPlist } };
  const android = { ...config.android, permissions: [...(config.android?.permissions ?? [])] };
  if (props.push !== false) {
    ios.entitlements['aps-environment'] = props.apsEnvironment ?? 'production';
    ios.infoPlist['UIBackgroundModes'] = add(ios.infoPlist['UIBackgroundModes'], 'remote-notification');
    android.permissions = add(android.permissions, 'android.permission.POST_NOTIFICATIONS');
  }
  if (props.geofencing) {
    ios.infoPlist['NSLocationAlwaysAndWhenInUseUsageDescription'] ??= props.geofencing.locationUsage;
    ios.infoPlist['NSLocationWhenInUseUsageDescription'] ??= props.geofencing.locationUsage;
    ios.infoPlist['UIBackgroundModes'] = add(ios.infoPlist['UIBackgroundModes'], 'location');
    android.permissions = add(android.permissions, 'android.permission.ACCESS_FINE_LOCATION', 'android.permission.ACCESS_BACKGROUND_LOCATION');
  }
  const hermetica = { ...(props.siteKey ? { siteKey: props.siteKey } : {}), ...(props.endpoint ? { endpoint: props.endpoint } : {}) };
  return { ...config, ios, android, extra: { ...config.extra, hermetica: { ...(config.extra?.['hermetica'] as Dict | undefined), ...hermetica } } };
}
