import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import ExcelInsertPage from "./pages/ExelInsertPage";
import NewCompaniesPage from "./pages/NewCompaniesPage";

export default function App() {
  //need splash
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/excel" replace />} />
      <Route path="/excel" element={<ExcelInsertPage />} />
      <Route path="/excel/new" element={<NewCompaniesPage />} />
    </Routes>
  );
}
