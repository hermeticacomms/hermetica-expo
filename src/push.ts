/**
 * Registers the device's Expo push token (`ExponentPushToken[...]`, vendor `expo`) with Hermeticor. The app passes in its
 * `expo-notifications` module (an optional peer dependency) so the config plugin, which Node loads at prebuild, never imports it.
 */
type EnablementStatus = 'AUTHORIZED' | 'DENIED' | 'NOT_DETERMINED' | 'PROVISIONAL' | 'UNAUTHORIZED';

/** The slice of the React Native client (`@hermeticor/sdk-react-native`) this uses. */
export interface PushTokenClient {
  setPushToken(token: string, o: { platform: 'ios' | 'android'; vendor: 'expo'; environment: 'debug' | 'release'; enablementStatus: EnablementStatus; background: 'AVAILABLE' | 'DENIED' | 'RESTRICTED' }): Promise<boolean>;
}

/** The slice of `expo-notifications` this uses. */
export interface ExpoNotificationsModule {
  getExpoPushTokenAsync(o?: { projectId?: string }): Promise<{ data: string }>;
  getPermissionsAsync(): Promise<{ status: string; ios?: { status?: number } }>;
}

export interface RegisterExpoPushTokenOptions {
  /** `Platform.OS` from react-native. */
  platform: 'ios' | 'android';
  /** The EAS project id; Expo needs it outside Expo Go (`Constants.expoConfig.extra.eas.projectId`). */
  projectId?: string;
  /** `__DEV__ ? 'debug' : 'release'`. Default release. */
  environment?: 'debug' | 'release';
}

// expo-notifications' IosAuthorizationStatus: 3 is PROVISIONAL (quiet delivery without a prompt).
const IOS_PROVISIONAL = 3;

const enablementOf = (p: { status: string; ios?: { status?: number } }): EnablementStatus =>
  p.ios?.status === IOS_PROVISIONAL ? 'PROVISIONAL' : p.status === 'granted' ? 'AUTHORIZED' : p.status === 'denied' ? 'DENIED' : 'NOT_DETERMINED';

/** Gets the Expo push token and registers it with the current profile. `ok` is false when the server refused it; keep `token` to unregister on logout. */
export async function registerExpoPushToken(client: PushTokenClient, notifications: ExpoNotificationsModule, o: RegisterExpoPushTokenOptions): Promise<{ token: string; ok: boolean }> {
  const [{ data: token }, perms] = await Promise.all([notifications.getExpoPushTokenAsync(o.projectId ? { projectId: o.projectId } : undefined), notifications.getPermissionsAsync()]);
  const ok = await client.setPushToken(token, { platform: o.platform, vendor: 'expo', environment: o.environment ?? 'release', enablementStatus: enablementOf(perms), background: 'AVAILABLE' });
  return { token, ok };
}
