import { useState } from "react";
import ItemList from "./ItemList";
import useProductos from "../hooks/useProductos";

const PAGE_SIZE = 8;

const ItemListContainer = ({ categoria = "Todos", busqueda = "" }) => {
  const { productos, cargando, error } = useProductos();
  const [pagination, setPagination] = useState({ filter: "", page: 1 });
  const productosFiltrados = productos.filter((producto) => {
    const coincideCategoria = categoria === "Todos" || producto.categoria === categoria;
    const texto = `${producto.nombre} ${producto.descripcion} ${producto.categoria}`.toLocaleLowerCase("es");
    return coincideCategoria && texto.includes(busqueda.trim().toLocaleLowerCase("es"));
  });
  const totalPaginas = Math.ceil(productosFiltrados.length / PAGE_SIZE);
  const filtro = `${categoria}\u0000${busqueda}`;
  const pagina = pagination.filter === filtro ? pagination.page : 1;
  const paginaVisible = Math.min(pagina, Math.max(totalPaginas, 1));
  const productosVisibles = productosFiltrados.slice(
    (paginaVisible - 1) * PAGE_SIZE,
    paginaVisible * PAGE_SIZE,
  );

  if (cargando) {
    return <p className="catalog-feedback" role="status">Cargando el menú...</p>;
  }

  if (error) {
    return <p className="catalog-feedback catalog-error" role="alert">{error}</p>;
  }

  return (
    <>
      <ItemList productos={productosVisibles} />
      {totalPaginas > 1 && (
        <nav className="pagination" aria-label="Páginas del catálogo">
          <button
            type="button"
            onClick={() => setPagination({ filter: filtro, page: paginaVisible - 1 })}
            disabled={paginaVisible === 1}
          >
            Anterior
          </button>
          <span aria-live="polite">
            Página {paginaVisible} de {totalPaginas}
          </span>
          <button
            type="button"
            onClick={() => setPagination({ filter: filtro, page: paginaVisible + 1 })}
            disabled={paginaVisible === totalPaginas}
          >
            Siguiente
          </button>
        </nav>
      )}
    </>
  );
};

export default ItemListContainer;
