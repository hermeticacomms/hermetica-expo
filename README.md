# @hermeticor/sdk-expo

Expo config plugin for Hermeticor. At `expo prebuild` it sets what push needs natively (the `aps-environment` entitlement,
background remote notifications, Android 13's `POST_NOTIFICATIONS`), optionally the geofencing permissions, and stores the site
key and endpoint in `extra.hermetica`. At runtime, `registerExpoPushToken` registers the Expo push token. The runtime SDK is `@hermeticor/sdk-react-native`.

```json
{
  "expo": {
    "plugins": [
      ["@hermeticor/sdk-expo", { "siteKey": "hm_pk_...", "endpoint": "https://api.example.com", "apsEnvironment": "production" }]
    ]
  }
}
```

```ts
import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { createReactNativeClient } from '@hermeticor/sdk-react-native';
import { registerExpoPushToken } from '@hermeticor/sdk-expo';

const { siteKey, endpoint } = Constants.expoConfig!.extra!.hermetica;
const platform = Platform.OS === 'ios' ? 'ios' : 'android';
const hm = await createReactNativeClient({ siteKey, endpoint, storage: AsyncStorage, platform });
await Notifications.requestPermissionsAsync();
const { token, ok } = await registerExpoPushToken(hm, Notifications, {
  platform, projectId: Constants.expoConfig?.extra?.eas?.projectId, environment: __DEV__ ? 'debug' : 'release',
});
// on logout: await hm.unregisterPushToken(token, { platform, vendor: 'expo', ... })
```

`registerExpoPushToken` gets the Expo push token (`ExponentPushToken[...]`) with `getExpoPushTokenAsync`, reads the permission state
(granted, denied, undetermined, iOS provisional) and registers it as vendor `expo`, which a `push_expo` connection sends to. Pass your
`expo-notifications` module in (an optional peer dependency; the plugin never imports it). `ok` is false when the server refused the
token. For native tokens instead (a `push_apns` or `push_fcm` connection), call `hm.setPushToken` with
`Notifications.getDevicePushTokenAsync()` and vendor `apns` or `fcm`.

Options: `push` (default true), `apsEnvironment` (`development` | `production`), `geofencing: { locationUsage }` (adds the location
permissions and the iOS prompt text). A secret `hm_sk_` key is refused. Running the plugin twice changes nothing.
