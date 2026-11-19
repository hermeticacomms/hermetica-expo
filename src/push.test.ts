import { describe, expect, it, vi } from 'vitest';
import { registerExpoPushToken } from './plugin.ts';

const notifications = (status: string, iosStatus?: number) => ({
  getExpoPushTokenAsync: vi.fn(async () => ({ data: 'ExponentPushToken[abc]' })),
  getPermissionsAsync: vi.fn(async () => ({ status, ...(iosStatus === undefined ? {} : { ios: { status: iosStatus } }) })),
});

describe('registerExpoPushToken', () => {
  it('registers the Expo token as vendor expo with the permission state', async () => {
    const client = { setPushToken: vi.fn(async () => true) };
    const n = notifications('granted');
    const out = await registerExpoPushToken(client, n, { platform: 'android', projectId: 'eas-1' });
    expect(out).toEqual({ token: 'ExponentPushToken[abc]', ok: true });
    expect(n.getExpoPushTokenAsync).toHaveBeenCalledWith({ projectId: 'eas-1' });
    expect(client.setPushToken).toHaveBeenCalledWith('ExponentPushToken[abc]', { platform: 'android', vendor: 'expo', environment: 'release', enablementStatus: 'AUTHORIZED', background: 'AVAILABLE' });
  });

  it('maps iOS provisional and undetermined permissions, and passes the refusal through', async () => {
    const client = { setPushToken: vi.fn(async () => false) };
    expect((await registerExpoPushToken(client, notifications('granted', 3), { platform: 'ios', environment: 'debug' })).ok).toBe(false);
    expect(client.setPushToken).toHaveBeenLastCalledWith('ExponentPushToken[abc]', expect.objectContaining({ platform: 'ios', environment: 'debug', enablementStatus: 'PROVISIONAL' }));
    await registerExpoPushToken(client, notifications('undetermined'), { platform: 'ios' });
    expect(client.setPushToken).toHaveBeenLastCalledWith('ExponentPushToken[abc]', expect.objectContaining({ enablementStatus: 'NOT_DETERMINED' }));
  });
});
