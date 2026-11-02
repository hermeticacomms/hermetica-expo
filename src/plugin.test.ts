import { describe, expect, it } from 'vitest';
import withHermetica from './plugin.ts';

describe('withHermetica', () => {
  it('sets push entitlements and permissions, and the site key in extra, keeping what the app had', () => {
    const out = withHermetica(
      { name: 'shop', ios: { bundleIdentifier: 'com.shop', infoPlist: { UIBackgroundModes: ['fetch'] } }, android: { permissions: ['android.permission.CAMERA'] }, extra: { eas: { projectId: 'p' } } },
      { siteKey: 'hm_pk_1', endpoint: 'https://api.test', apsEnvironment: 'development' },
    );
    expect(out['name']).toBe('shop');
    expect(out.ios).toMatchObject({ bundleIdentifier: 'com.shop', entitlements: { 'aps-environment': 'development' }, infoPlist: { UIBackgroundModes: ['fetch', 'remote-notification'] } });
    expect(out.android?.permissions).toEqual(['android.permission.CAMERA', 'android.permission.POST_NOTIFICATIONS']);
    expect(out.extra).toEqual({ eas: { projectId: 'p' }, hermetica: { siteKey: 'hm_pk_1', endpoint: 'https://api.test' } });
  });

  it('is idempotent and adds geofencing only when asked', () => {
    const once = withHermetica({}, { geofencing: { locationUsage: 'Store offers nearby' } });
    const twice = withHermetica(once, { geofencing: { locationUsage: 'Store offers nearby' } });
    expect(twice).toEqual(once);
    expect(once.ios?.infoPlist?.['UIBackgroundModes']).toEqual(['remote-notification', 'location']);
    expect(withHermetica({}, { push: false }).android?.permissions).toEqual([]);
  });

  it('refuses a secret key', () => {
    expect(() => withHermetica({}, { siteKey: 'hm_sk_live' })).toThrow(/public site key/);
  });
});
