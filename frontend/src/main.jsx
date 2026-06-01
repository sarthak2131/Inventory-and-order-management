import React from "react";
import ReactDOM from "react-dom/client";
import { Toaster } from "react-hot-toast";

import App from "./App";
import "./styles.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Toaster
      position="top-right"
      containerClassName="app-toaster"
      gutter={14}
      toastOptions={{
        duration: 3600,
        style: {
          background: "#ffffff",
          color: "#162133",
          border: "1px solid #e4e9f1",
          borderRadius: "16px",
          boxShadow: "0 24px 60px rgba(16, 24, 40, 0.14)",
          padding: "14px 16px",
        },
        success: {
          iconTheme: {
            primary: "#10b981",
            secondary: "#ffffff",
          },
        },
        error: {
          iconTheme: {
            primary: "#dc2626",
            secondary: "#ffffff",
          },
        },
      }}
    />
    <App />
  </React.StrictMode>,
);
