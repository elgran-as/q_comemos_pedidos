import { useState } from "react";
import { FcGoogle } from "react-icons/fc";
import { Col, Container, Row } from "react-bootstrap";
import { toast } from "react-toastify";
import { firebaseConfigured, getFirebaseServices } from "../firebase";
import { useAuth } from "../context/useAuth";
import useProductos from "../hooks/useProductos";

const CATEGORIAS = [
  "Hamburguesas",
  "Pizzas",
  "Papas fritas",
  "Empanadas",
  "Bebidas",
];

const FORMULARIO_VACIO = {
  nombre: "",
  precio: "",
  categoria: CATEGORIAS[0],
  imagen: "",
  descripcion: "",
  tiempo: "",
  destacada: false,
};

const AdminPage = () => {
  const {
    user,
    isAdmin,
    loading,
    authError,
    signIn,
    signInWithGoogle,
    register,
    signOut,
  } =
    useAuth();
  const [modo, setModo] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [formError, setFormError] = useState("");
  const [notice, setNotice] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleAuth = async (event) => {
    event.preventDefault();
    setFormError("");
    setNotice("");
    setSubmitting(true);

    try {
      if (modo === "register") {
        await register(email.trim(), password);
        setNotice("Te enviamos un correo para verificar tu cuenta.");
        toast.success("Te enviamos un correo para verificar tu cuenta.");
        setModo("login");
        setPassword("");
      } else {
        await signIn(email.trim(), password);
        toast.success("Sesión iniciada.");
      }
    } catch (error) {
      console.error("No se pudo completar la autenticación.", error);
      toast.error(error.message || "No se pudo completar la autenticación.");
      setFormError(error.message || "No se pudo completar la autenticación.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setFormError("");
    setSubmitting(true);
    try {
      await signInWithGoogle();
      toast.success("Sesión iniciada con Google.");
    } catch (error) {
      console.error("No se pudo iniciar sesión con Google.", error);
      toast.error(error.message || "No se pudo iniciar sesión con Google.");
      setFormError(error.message || "No se pudo iniciar sesión con Google.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!firebaseConfigured) {
    return (
      <Container as="section" className="admin-page">
        <div className="admin-card">
          <span className="eyebrow">PANEL DE GESTIÓN</span>
          <h1>Configurá Firebase</h1>
          <p>
            El acceso de administración requiere las variables de Firebase.
            Seguí los pasos de configuración documentados en el README.
          </p>
        </div>
      </Container>
    );
  }

  if (loading) {
    return <p className="catalog-feedback" role="status">Verificando acceso...</p>;
  }

  if (user && isAdmin) {
    return <AdminDashboard user={user} signOut={signOut} />;
  }

  if (user) {
    return (
      <Container as="section" className="admin-page">
        <div className="admin-card">
          <span className="eyebrow">PANEL DE GESTIÓN</span>
          <h1>Tu cuenta no tiene acceso de administrador</h1>
          <p>
            {authError || "Verificá tu correo y pedí que habiliten tu UID en la lista de administradores de Firestore."}
          </p>
          <p className="admin-uid">
            UID de esta cuenta: <code>{user.uid}</code>
          </p>
          <button className="btn" type="button" onClick={signOut}>Cerrar sesión</button>
        </div>
      </Container>
    );
  }

  return (
    <Container as="section" className="admin-page">
      <form className="admin-card admin-auth-form" onSubmit={handleAuth}>
        <span className="eyebrow">PANEL DE GESTIÓN</span>
        <h1>{modo === "login" ? "Iniciar sesión" : "Crear cuenta"}</h1>
        <p>
          {modo === "login"
            ? "Ingresá con tu cuenta autorizada para administrar el catálogo."
            : "La cuenta deberá verificar su correo y ser autorizada por un administrador."}
        </p>
        <label>
          Correo electrónico
          <input
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </label>
        <label>
          Contraseña
          <input
            type="password"
            autoComplete={modo === "login" ? "current-password" : "new-password"}
            minLength={6}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </label>
        {formError && <p className="form-feedback form-error" role="alert">{formError}</p>}
        {authError && <p className="form-feedback form-error" role="alert">{authError}</p>}
        {notice && <p className="form-feedback" role="status">{notice}</p>}
        <button className="btn" type="submit" disabled={submitting}>
          {submitting
            ? "Procesando..."
            : modo === "login"
              ? "Ingresar"
              : "Crear cuenta"}
        </button>
        <button
          className="google-signin"
          type="button"
          onClick={handleGoogleSignIn}
          disabled={submitting}
        >
          <FcGoogle aria-hidden="true" size={20} />
          Continuar con Google
        </button>
        <button
          className="text-button"
          type="button"
          onClick={() => {
            setModo((actual) => actual === "login" ? "register" : "login");
            setFormError("");
            setNotice("");
          }}
        >
          {modo === "login" ? "Crear una cuenta" : "Ya tengo una cuenta"}
        </button>
      </form>
    </Container>
  );
};

const AdminDashboard = ({ user, signOut }) => {
  const { productos, cargando, error } = useProductos();
  const [productoEditado, setProductoEditado] = useState(null);
  const [formulario, setFormulario] = useState(FORMULARIO_VACIO);
  const [formError, setFormError] = useState("");
  const [notice, setNotice] = useState("");
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState("");
  const [seeding, setSeeding] = useState(false);

  const updateField = (event) => {
    const { name, value, checked, type } = event.target;
    setFormulario((actual) => ({
      ...actual,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const resetForm = () => {
    setProductoEditado(null);
    setFormulario(FORMULARIO_VACIO);
    setFormError("");
  };

  const startEditing = (producto) => {
    setProductoEditado(producto.id);
    setFormulario({
      nombre: producto.nombre,
      precio: String(producto.precio),
      categoria: producto.categoria,
      imagen: producto.imagen,
      descripcion: producto.descripcion,
      tiempo: producto.tiempo || "",
      destacada: Boolean(producto.destacada),
    });
    setFormError("");
    setNotice("");
  };

  const saveProduct = async (event) => {
    event.preventDefault();
    setFormError("");
    setNotice("");

    const productData = {
      nombre: formulario.nombre.trim(),
      precio: Number(formulario.precio),
      categoria: formulario.categoria,
      imagen: formulario.imagen.trim(),
      descripcion: formulario.descripcion.trim(),
      tiempo: formulario.tiempo.trim(),
      destacada: formulario.destacada,
    };

    if (!productData.nombre || !productData.descripcion || !productData.imagen) {
      setFormError("Completá el nombre, la descripción y la URL de imagen.");
      return;
    }

    if (!Number.isFinite(productData.precio) || productData.precio <= 0) {
      setFormError("El precio debe ser un número mayor que cero.");
      return;
    }

    setSaving(true);
    try {
      const { db, firestoreSdk } = await getFirebaseServices();
      if (productoEditado) {
        await firestoreSdk.updateDoc(
          firestoreSdk.doc(db, "products", productoEditado),
          productData,
        );
        setNotice("Producto actualizado.");
        toast.success("Producto actualizado.");
      } else {
        await firestoreSdk.addDoc(
          firestoreSdk.collection(db, "products"),
          productData,
        );
        setNotice("Producto agregado.");
        toast.success("Producto agregado.");
      }
      resetForm();
    } catch (errorGuardar) {
      console.error("No se pudo guardar el producto.", errorGuardar);
      toast.error(errorGuardar.message || "No se pudo guardar el producto.");
      setFormError(errorGuardar.message || "No se pudo guardar el producto.");
    } finally {
      setSaving(false);
    }
  };

  const deleteProduct = async (producto) => {
    if (!window.confirm(`¿Querés eliminar "${producto.nombre}"? Esta acción no se puede deshacer.`)) {
      return;
    }

    setDeletingId(producto.id);
    setNotice("");
    try {
      const { db, firestoreSdk } = await getFirebaseServices();
      await firestoreSdk.deleteDoc(
        firestoreSdk.doc(db, "products", producto.id),
      );
      setNotice("Producto eliminado.");
      toast.success("Producto eliminado.");
    } catch (errorEliminar) {
      console.error("No se pudo eliminar el producto.", errorEliminar);
      toast.error(errorEliminar.message || "No se pudo eliminar el producto.");
      setFormError(errorEliminar.message || "No se pudo eliminar el producto.");
    } finally {
      setDeletingId("");
    }
  };

  const seedCatalog = async () => {
    setSeeding(true);
    setFormError("");
    setNotice("");
    try {
      const { db, firestoreSdk } = await getFirebaseServices();
      const currentProducts = await firestoreSdk.getDocs(
        firestoreSdk.collection(db, "products"),
      );
      if (!currentProducts.empty) {
        throw new Error("La colección ya tiene productos; no se importó el catálogo inicial.");
      }

      const response = await fetch(`${import.meta.env.BASE_URL}productos.json`);
      if (!response.ok) {
        throw new Error(`No se pudo leer el catálogo inicial (estado ${response.status}).`);
      }

      const initialProducts = await response.json();
      if (!Array.isArray(initialProducts) || initialProducts.length === 0) {
        throw new Error("El catálogo inicial no tiene el formato esperado.");
      }

      const batch = firestoreSdk.writeBatch(db);
      initialProducts.forEach(({ id, ...productData }) => {
        batch.set(
          firestoreSdk.doc(db, "products", String(id)),
          productData,
        );
      });
      await batch.commit();
      setNotice(`Se importaron ${initialProducts.length} productos.`);
      toast.success(`Se importaron ${initialProducts.length} productos.`);
    } catch (errorImport) {
      console.error("No se pudo importar el catálogo inicial.", errorImport);
      toast.error(errorImport.message || "No se pudo importar el catálogo inicial.");
      setFormError(errorImport.message || "No se pudo importar el catálogo inicial.");
    } finally {
      setSeeding(false);
    }
  };

  return (
    <Container as="section" fluid className="admin-page admin-dashboard">
      <div className="admin-heading">
        <div>
          <span className="eyebrow">PANEL DE GESTIÓN</span>
          <h1>Productos</h1>
          <p>Sesión iniciada como {user.email}</p>
        </div>
        <button className="text-button" type="button" onClick={signOut}>Cerrar sesión</button>
      </div>

      <Row className="g-4 admin-grid align-items-start">
        <Col xs={12} lg={5}>
          <form className="admin-card admin-product-form" onSubmit={saveProduct}>
            <h2>{productoEditado ? "Editar producto" : "Agregar producto"}</h2>
            <label>
              Nombre
              <input name="nombre" value={formulario.nombre} onChange={updateField} required />
            </label>
            <div className="admin-form-row">
              <label>
                Precio
                <input
                  name="precio"
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={formulario.precio}
                  onChange={updateField}
                  required
                />
              </label>
              <label>
                Categoría
                <select name="categoria" value={formulario.categoria} onChange={updateField}>
                  {CATEGORIAS.map((categoria) => (
                    <option key={categoria}>{categoria}</option>
                  ))}
                </select>
              </label>
            </div>
            <label>
              URL de imagen
              <input name="imagen" type="url" value={formulario.imagen} onChange={updateField} required />
            </label>
            <label>
              Descripción
              <textarea name="descripcion" value={formulario.descripcion} onChange={updateField} required rows="3" />
            </label>
            <label>
              Tiempo de preparación
              <input name="tiempo" value={formulario.tiempo} onChange={updateField} />
            </label>
            <label className="admin-checkbox">
              <input
                name="destacada"
                type="checkbox"
                checked={formulario.destacada}
                onChange={updateField}
              />
              Marcar como favorito
            </label>
            {formError && <p className="form-feedback form-error" role="alert">{formError}</p>}
            {notice && <p className="form-feedback" role="status">{notice}</p>}
            <div className="admin-form-actions">
              <button className="btn" type="submit" disabled={saving}>
                {saving ? "Guardando..." : productoEditado ? "Guardar cambios" : "Agregar producto"}
              </button>
              {productoEditado && (
                <button className="text-button" type="button" onClick={resetForm}>
                  Cancelar edición
                </button>
              )}
            </div>
            {!cargando && !error && productos.length === 0 && (
              <button className="text-button seed-button" type="button" onClick={seedCatalog} disabled={seeding}>
                {seeding ? "Importando catálogo..." : "Importar catálogo inicial"}
              </button>
            )}
          </form>
        </Col>

        <Col xs={12} lg={7}>
          <div className="admin-card admin-product-list">
            <h2>Catálogo ({productos.length})</h2>
            {cargando && <p role="status">Cargando productos...</p>}
            {error && <p className="form-feedback form-error" role="alert">{error}</p>}
            {!cargando && !error && productos.length === 0 && (
              <p>Aún no hay productos. Importá el catálogo inicial para comenzar.</p>
            )}
            {productos.length > 0 && (
              <ul>
                {productos.map((producto) => (
                  <li key={producto.id}>
                    <div>
                      <strong>{producto.nombre}</strong>
                      <span>{producto.categoria} · ${Number(producto.precio).toLocaleString("es-AR")}</span>
                    </div>
                    <div className="admin-item-actions">
                      <button className="text-button" type="button" onClick={() => startEditing(producto)}>
                        Editar
                      </button>
                      <button
                        className="text-button danger-button"
                        type="button"
                        onClick={() => deleteProduct(producto)}
                        disabled={deletingId === producto.id}
                      >
                        {deletingId === producto.id ? "Eliminando..." : "Eliminar"}
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Col>
      </Row>
    </Container>
  );
};

export default AdminPage;
