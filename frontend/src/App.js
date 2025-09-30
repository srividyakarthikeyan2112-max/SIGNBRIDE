import React from "react";
import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import HomePage from "./components/HomePage";
import SignToTextPage from "./components/SignToTextPage";
import TextToSignPage from "./components/TextToSignPage";
import { Toaster } from "./components/ui/sonner";

function App() {
  return (
    <div className="App min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Toaster position="top-right" />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/sign-to-text" element={<SignToTextPage />} />
          <Route path="/text-to-sign" element={<TextToSignPage />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;