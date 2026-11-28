import { useEffect, useState } from "react";
import { firebaseConfigured, getFirebaseServices } from "../firebase";
import { AuthContext } from "./auth-context";

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(firebaseConfigured);
  const [authError, setAuthError] = useState("");

  useEffect(() => {
    if (!firebaseConfigured) return undefined;

    let active = true;
    let unsubscribe;
    let unsubscribeAdmin;

    getFirebaseServices()
      .then(({ auth, db, authSdk, firestoreSdk }) => {
        if (!active) return;

        unsubscribe = authSdk.onAuthStateChanged(auth, (currentUser) => {
          unsubscribeAdmin?.();
          unsubscribeAdmin = undefined;
          setUser(currentUser);
          setAuthError("");
          setLoading(Boolean(currentUser));

          if (!currentUser) {
            setIsAdmin(false);
            setLoading(false);
            return;
          }

          unsubscribeAdmin = firestoreSdk.onSnapshot(
            firestoreSdk.doc(db, "admins", currentUser.uid),
            (adminDocument) => {
              setIsAdmin(currentUser.emailVerified && adminDocument.exists());
              setLoading(false);
            },
            (error) => {
              console.error("No se pudo verificar el acceso de administrador.", error);
              setAuthError("No pudimos verificar tus permisos. Probá de nuevo más tarde.");
              setIsAdmin(false);
              setLoading(false);
            },
          );
        });
      })
      .catch((error) => {
        console.error("No se pudo iniciar Firebase Authentication.", error);
        setAuthError("No se pudo conectar con Firebase Authentication.");
        setLoading(false);
      });

    return () => {
      active = false;
      unsubscribeAdmin?.();
      unsubscribe?.();
    };
  }, []);

  const signIn = async (email, password) => {
    setAuthError("");
    const { auth, authSdk } = await getFirebaseServices();
    return authSdk.signInWithEmailAndPassword(auth, email, password);
  };

  const signInWithGoogle = async () => {
    setAuthError("");
    const { auth, authSdk } = await getFirebaseServices();
    return authSdk.signInWithPopup(auth, new authSdk.GoogleAuthProvider());
  };

  const register = async (email, password) => {
    setAuthError("");
    const { auth, authSdk } = await getFirebaseServices();
    const credential = await authSdk.createUserWithEmailAndPassword(
      auth,
      email,
      password,
    );
    await authSdk.sendEmailVerification(credential.user);
    await authSdk.signOut(auth);
  };

  const signOut = async () => {
    const { auth, authSdk } = await getFirebaseServices();
    return authSdk.signOut(auth);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAdmin,
        loading,
        authError,
        signIn,
        signInWithGoogle,
        register,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
