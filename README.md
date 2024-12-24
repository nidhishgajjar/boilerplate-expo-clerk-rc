**Setup Instructions**
================================

### 1. Initial Setup

* Run `npm install` to install dependencies
* Run `npx expo install expo` to setup Expo

### 2. Configuration

* Open `app.json` and update:
  + `bundleIdentifier` (iOS) / `package` (Android) to your desired bundle ID
  + `name` and `displayName` to your app name
  + `runtimeVersion` to use the app version policy for cloud updates:
    ```
    "runtimeVersion": {
      "policy": "appVersion"
    }
    ```

### 3. Authentication (Clerk)

* Already integrated
* Setup steps:
  1. Create a Clerk account and project
  2. Enable Sign In with Email authentication
  3. Get your Clerk keys (publishableKey)
  4. Add to your environment variables:
     `CLERK_PUBLISHABLE_KEY=your_key_here`
  5. To ensure magic email signin/signup works:
    * Go to bolt.new and ask it to create a simple redirect page like the one given in the code snippet.
    * Replace `tbdnd` in the HTML code with the scheme name of your app from `app.json`.
    * Deploy it via Netlify from bolt itself and replace the URL given by bolt/netlify with `https://candid-narwhal-0e73f4.netlify.app`.
    * Make sure to not to put this setup in the end of docs, but where we tell users/devs to setup Clerk.
    * Here is the sample code for the redirect page:
    ```
    <!DOCTYPE html>
    <html>
    <head>
        <title>Redirecting...</title>
        <script>
            window.location.href = 'tbdnd://auth' + window.location.search;
        </script>
    </head>
    <body>
        <p>Redirecting to app...</p>
    </body>
    </html>
    ```

### 4. In-App Purchases (RevenueCat)

* Already integrated
* Setup steps:
  1. Create a RevenueCat account and project
  2. Configure your products in App Store Connect and RevenueCat
  3. Configure paywall to present in RevenueCat
  4. Ensure bundle ID matches your app's bundle ID
  5. Get your API keys
  6. Add to your environment variables:
     `REVENUECAT_PUBLIC_SDK_KEY=your_key_here`

### 5. Over-the-Air Updates

* Already configured with Expo OTA

### 6. Development

* Local Development:
  - iOS: `npx expo run:ios --device`
  - Android: `npx expo run:android --device`

### 7. Deployment

* EAS Build & Preview:
  ```
  // Create preview build
  eas build --profile preview --platform ios
  
  // Push OTA update to preview channel
  eas update --channel preview --message "Your update message"
  ```

**Additional Notes**
--------------------

* Ensure you have Expo CLI installed globally: `npm install -g expo-cli`
* For iOS development, Xcode is required
* For Android development, Android Studio is required
* Keep your environment variables secure and never commit them to version control
* Regular OTA updates can be pushed without rebuilding the entire app
* Use different channels (preview, production) for different deployment stages

**Troubleshooting**
-------------------

* If builds fail, ensure all environment variables are properly set
* For iOS builds, verify your Apple Developer account is properly configured
* For Android builds, ensure your keystore information is correctly set up
* If you see an error related to RevenueCat, such as "There is an issue with your configuration. Check the underlying error for more details. There's a problem with your configuration. None of the products registered in the RevenueCat dashboard could be fetched from App Store Connect (or the StoreKit Configuration file if one is being used).", ensure you have set up your products in App Store Connect and RevenueCat, and that your bundle ID matches in both places. To resolve this issue, follow these steps:
  1. Create subscription products inside App Store Connect and Google Play Store.
  2. Follow the RevenueCat guide to connect to App Store and Google Play Store.
  3. Import product IDs from App Store and Google Play Store in RevenueCat.
  4. Attach them to entitlements, then create offerings.
  5. Add a paywall to offerings.
  Ensure to rebuild the app locally or via EAS after making any changes in app.json like bundle ID.

**Environment Variables Required**
-----------------------------------

* `CLERK_PUBLISHABLE_KEY`
* `REVENUECAT_PUBLIC_SDK_KEY`
# boilerplate-expo-clerk-rc
