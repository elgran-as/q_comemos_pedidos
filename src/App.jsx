import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { Helmet } from "react-helmet-async";

import Layout from "./components/Layout";

import Home from "./pages/Home";
import Productos from "./pages/Productos";
import ProductoDetail from "./pages/ProductoDetail";
import Carrito from "./pages/Carrito";
const AdminPage = lazy(() => import("./pages/AdminPage"));

const RouteMetadata = () => {
  const { pathname } = useLocation();
  const isAdminPage = pathname.startsWith("/admin");
  const isCatalogPage = pathname === "/productos";
  const title = isAdminPage
    ? "Gestión | Q´ Comemos"
    : isCatalogPage
      ? "La carta | Q´ Comemos"
      : "Q´ Comemos | Algo rico para compartir";
  const description = isAdminPage
    ? "Panel de gestión del catálogo de Q´ Comemos."
    : "Pedí hamburguesas, pizzas, papas fritas y empanadas bien argentinas en Q´ Comemos.";

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="robots" content={isAdminPage ? "noindex, nofollow" : "index, follow"} />
    </Helmet>
  );
};

const App = () => {
  return (
    <BrowserRouter basename={import.meta.env.DEV ? "/" : import.meta.env.BASE_URL}>
      <RouteMetadata />
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/productos" element={<Productos />} />
          <Route path="/producto/:id" element={<ProductoDetail />} />
          <Route path="/carrito" element={<Carrito />} />
          <Route
            path="/admin"
            element={
              <Suspense fallback={<p className="catalog-feedback" role="status">Cargando el panel...</p>}>
                <AdminPage />
              </Suspense>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default App;