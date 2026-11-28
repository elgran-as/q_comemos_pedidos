const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const firebaseConfigured = Object.values(firebaseConfig).every(Boolean);

let servicesPromise;
let cartServicesPromise;

const loadFirebaseModules = () => Promise.all([
  import("firebase/app"),
  import("firebase/auth"),
  import("firebase/firestore"),
]);

const getApp = (appSdk, name) => {
  const existingApp = appSdk.getApps().find((app) => app.name === name);
  return existingApp || appSdk.initializeApp(firebaseConfig, name);
};

export const getFirebaseServices = () => {
  if (!firebaseConfigured) {
    return Promise.reject(new Error("Firebase no está configurado."));
  }

  if (!servicesPromise) {
    servicesPromise = loadFirebaseModules().then(([appSdk, authSdk, firestoreSdk]) => {
      const app = getApp(appSdk, "[DEFAULT]");
      return {
        auth: authSdk.getAuth(app),
        db: firestoreSdk.getFirestore(app),
        authSdk,
        firestoreSdk,
      };
    });
  }

  return servicesPromise;
};

export const getCartServices = () => {
  if (!firebaseConfigured) {
    return Promise.reject(new Error("Firebase no está configurado."));
  }

  if (!cartServicesPromise) {
    cartServicesPromise = loadFirebaseModules().then(
      ([appSdk, authSdk, firestoreSdk]) => {
        const app = getApp(appSdk, "q-comemos-cart");
        return {
          auth: authSdk.getAuth(app),
          db: firestoreSdk.getFirestore(app),
          authSdk,
          firestoreSdk,
        };
      },
    );
  }

  return cartServicesPromise;
};
