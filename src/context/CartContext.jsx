import { useEffect, useRef, useState } from "react";
import { CartContext } from "./cart-context";
import { firebaseConfigured, getCartServices } from "../firebase";

const CART_STORAGE_KEY = "q-comemos-cart";
const LEGACY_CART_STORAGE_KEY = "miga-fuego-cart";

const isValidCartItem = (item) =>
  (Number.isInteger(item?.id) ||
    (typeof item?.id === "string" && item.id.length > 0)) &&
  Number.isFinite(item?.precio) &&
  Number.isInteger(item?.quantity) &&
  item.quantity > 0;

const getSavedItems = (document) => {
  if (!document.exists()) return [];

  const items = document.data().items;
  if (!Array.isArray(items)) {
    throw new TypeError("El carrito guardado en Firestore no tiene un formato válido.");
  }

  return items.filter(isValidCartItem);
};

const getInitialCart = () => {
  try {
    const savedCart =
      localStorage.getItem(CART_STORAGE_KEY) ??
      localStorage.getItem(LEGACY_CART_STORAGE_KEY);
    if (!savedCart) {
      return [];
    }

    const parsedCart = JSON.parse(savedCart);
    if (!Array.isArray(parsedCart)) {
      throw new TypeError("El carrito guardado no tiene un formato válido.");
    }

    return parsedCart.filter(isValidCartItem);
  } catch (error) {
    console.error("No se pudo recuperar el carrito guardado.", error);
    return [];
  }
};

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState(getInitialCart);
  const [firebaseUid, setFirebaseUid] = useState("");
  const [firebaseReady, setFirebaseReady] = useState(!firebaseConfigured);
  const [persistenceError, setPersistenceError] = useState("");
  const lastSyncedCart = useRef("");
  const persistenceQueue = useRef(Promise.resolve());
  const cartRef = useRef(cart);
  const localChanges = useRef(false);

  useEffect(() => {
    cartRef.current = cart;
  }, [cart]);

  useEffect(() => {
    if (!firebaseConfigured) return undefined;

    let active = true;
    let unsubscribe;

    const loadCart = async () => {
      try {
        const services = await getCartServices();
        await services.auth.authStateReady();
        let currentUser = services.auth.currentUser;

        if (!currentUser) {
          const credential = await services.authSdk.signInAnonymously(services.auth);
          currentUser = credential.user;
        }

        if (!active) return;

        const cartDocument = services.firestoreSdk.doc(
          services.db,
          "carts",
          currentUser.uid,
        );
        const savedCart = await services.firestoreSdk.getDoc(cartDocument);

        if (!active) return;

        const items = getSavedItems(savedCart);
        lastSyncedCart.current = JSON.stringify(items);
        setCart(
          localChanges.current
            ? cartRef.current
            : savedCart.exists()
              ? items
              : getInitialCart(),
        );
        setFirebaseUid(currentUser.uid);

        unsubscribe = services.firestoreSdk.onSnapshot(
          cartDocument,
          (snapshot) => {
            if (!snapshot.exists()) return;
            try {
              const remoteItems = getSavedItems(snapshot);
              const serializedItems = JSON.stringify(remoteItems);
              lastSyncedCart.current = serializedItems;
              setCart((currentCart) =>
                JSON.stringify(currentCart) === serializedItems
                  ? currentCart
                  : remoteItems,
              );
              setPersistenceError("");
            } catch (error) {
              console.error("El carrito de Firestore tiene un formato inválido.", error);
              setPersistenceError("No pudimos leer tu carrito guardado.");
            }
          },
          (error) => {
            console.error("No se pudo sincronizar el carrito con Firestore.", error);
            setPersistenceError("No pudimos sincronizar tu carrito con la base de datos.");
          },
        );
        setFirebaseReady(true);
      } catch (error) {
        console.error("No se pudo cargar el carrito de Firestore.", error);
        setPersistenceError("No pudimos conectar el carrito con la base de datos.");
        setFirebaseReady(true);
      }
    };

    loadCart();
    return () => {
      active = false;
      unsubscribe?.();
    };
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    } catch (error) {
      console.error("No se pudo guardar el carrito.", error);
    }
  }, [cart]);

  useEffect(() => {
    const serializedCart = JSON.stringify(cart);
    if (
      !firebaseConfigured ||
      !firebaseReady ||
      !firebaseUid ||
      serializedCart === lastSyncedCart.current
    ) {
      return undefined;
    }

    let active = true;
    const timeout = setTimeout(() => {
      persistenceQueue.current = persistenceQueue.current
        .then(async () => {
          if (!active) return;
          const services = await getCartServices();
          await services.firestoreSdk.setDoc(
            services.firestoreSdk.doc(services.db, "carts", firebaseUid),
            {
              items: cart,
              updatedAt: services.firestoreSdk.serverTimestamp(),
            },
          );
          lastSyncedCart.current = serializedCart;
          setPersistenceError("");
        })
        .catch((error) => {
          console.error("No se pudo guardar el carrito en Firestore.", error);
          if (active) {
            setPersistenceError("No pudimos guardar tu carrito en la base de datos.");
          }
        });
    }, 250);

    return () => {
      active = false;
      clearTimeout(timeout);
    };
  }, [cart, firebaseReady, firebaseUid]);

  const addToCart = (product, quantity) => {
    if (
      !product ||
      (typeof product.id !== "string" && !Number.isInteger(product.id)) ||
      !Number.isInteger(quantity) ||
      quantity < 1
    ) {
      return;
    }

    localChanges.current = true;
    setCart((currentCart) => {
      const existingProduct = currentCart.find((item) => item.id === product.id);

      if (existingProduct) {
        return currentCart.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }

      return [...currentCart, { ...product, quantity }];
    });
  };

  const removeFromCart = (id) => {
    localChanges.current = true;
    setCart((currentCart) => currentCart.filter((item) => item.id !== id));
  };

  const updateQuantity = (id, quantity) => {
    if (!Number.isInteger(quantity)) {
      return;
    }

    localChanges.current = true;
    if (quantity < 1) {
      removeFromCart(id);
      return;
    }

    setCart((currentCart) =>
      currentCart.map((item) =>
        item.id === id ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => {
    localChanges.current = true;
    setCart([]);
  };
  const getTotalQuantity = () =>
    cart.reduce((total, item) => total + item.quantity, 0);
  const getTotalPrice = () =>
    cart.reduce((total, item) => total + item.precio * item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        persistenceError,
        cartLoading: firebaseConfigured && !firebaseReady,
        getTotalQuantity,
        getTotalPrice,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};
