import React from "react";
import ReactDOM from "react-dom/client";
import PopUp from "./popup.tsx";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <div className="fake-bg" />
    <PopUp />
  </React.StrictMode>
);
