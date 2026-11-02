# @hermeticacomms/sdk-expo

Expo config plugin for Hermetica. At `expo prebuild` it sets what push needs natively (the `aps-environment` entitlement,
background remote notifications, Android 13's `POST_NOTIFICATIONS`), optionally the geofencing permissions, and stores the site
key and endpoint in `extra.hermetica`. The runtime SDK is `@hermeticacomms/sdk-react-native`.

```json
{
  "expo": {
    "plugins": [
      ["@hermeticacomms/sdk-expo", { "siteKey": "hm_pk_...", "endpoint": "https://api.example.com", "apsEnvironment": "production" }]
    ]
  }
}
```

```ts
import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createReactNativeClient } from '@hermeticacomms/sdk-react-native';

const { siteKey, endpoint } = Constants.expoConfig!.extra!.hermetica;
const hm = await createReactNativeClient({ siteKey, endpoint, storage: AsyncStorage, platform: Platform.OS === 'ios' ? 'ios' : 'android' });
const { data: token } = await Notifications.getDevicePushTokenAsync(); // APNs / FCM token
await hm.setPushToken(token, { platform: Platform.OS, vendor: Platform.OS === 'ios' ? 'apns' : 'fcm', environment: 'release', enablementStatus: 'AUTHORIZED', background: 'AVAILABLE' });
```

Options: `push` (default true), `apsEnvironment` (`development` | `production`), `geofencing: { locationUsage }` (adds the location
permissions and the iOS prompt text). A secret `hm_sk_` key is refused. Running the plugin twice changes nothing.
