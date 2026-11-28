import React from "react";
import ReactDOM from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import { ToastContainer } from "react-toastify";

import App from "./App";
import { CartProvider } from "./context/CartContext";
import { AuthProvider } from "./context/AuthContext";

import "bootstrap/dist/css/bootstrap.min.css";
import "./App.css";
import "./index.css";
import "react-toastify/dist/ReactToastify.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <HelmetProvider>
      <AuthProvider>
        <CartProvider>
          <App />
          <ToastContainer position="top-right" autoClose={3500} />
        </CartProvider>
      </AuthProvider>
    </HelmetProvider>
  </React.StrictMode>
);
