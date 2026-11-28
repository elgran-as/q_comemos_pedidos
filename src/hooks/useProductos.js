import { useEffect, useState } from "react";
import { firebaseConfigured, getFirebaseServices } from "../firebase";

const useProductos = () => {
  const [productos, setProductos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    if (firebaseConfigured) {
      let unsubscribe;

      getFirebaseServices()
        .then(({ db, firestoreSdk }) => {
          if (controller.signal.aborted) return;

          unsubscribe = firestoreSdk.onSnapshot(
            firestoreSdk.query(firestoreSdk.collection(db, "products")),
            (snapshot) => {
              const items = snapshot.docs
                .map((productDocument) => ({
                  ...productDocument.data(),
                  id: productDocument.id,
                }))
                .sort((a, b) => {
                  const numericDifference = Number(a.id) - Number(b.id);
                  return Number.isFinite(numericDifference) && numericDifference !== 0
                    ? numericDifference
                    : String(a.nombre || "").localeCompare(String(b.nombre || ""), "es");
                });

              setProductos(items);
              setError("");
              setCargando(false);
            },
            (errorCarga) => {
              console.error("No se pudo cargar el catálogo de Firestore:", errorCarga);
              setError("No pudimos cargar el menú. Revisá la configuración de Firebase e intentá de nuevo.");
              setCargando(false);
            },
          );
        })
        .catch((errorCarga) => {
          if (controller.signal.aborted) return;
          console.error("No se pudo iniciar el catálogo de Firestore:", errorCarga);
          setError("No pudimos conectar con Firebase para cargar el menú.");
          setCargando(false);
        });

      return () => {
        controller.abort();
        unsubscribe?.();
      };
    }

    const cargarProductos = async () => {
      try {
        const respuesta = await fetch(
          `${import.meta.env.BASE_URL}productos.json`,
          { signal: controller.signal },
        );

        if (!respuesta.ok) {
          throw new Error(`La solicitud respondió con estado ${respuesta.status}.`);
        }

        const datos = await respuesta.json();
        if (!Array.isArray(datos)) {
          throw new Error("El archivo de productos no tiene el formato esperado.");
        }

        setProductos(datos);
      } catch (errorCarga) {
        if (errorCarga.name === "AbortError") return;

        console.error("No se pudo cargar el catálogo de productos:", errorCarga);
        setError("No pudimos cargar el menú. Probá recargar la página.");
      } finally {
        if (!controller.signal.aborted) setCargando(false);
      }
    };

    cargarProductos();
    return () => controller.abort();
  }, []);

  return { productos, cargando, error };
};

export default useProductos;
