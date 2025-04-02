import React, { useMemo, useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import CreateTask from "./pages/CreateTask";
import TaskStatus from "./pages/TaskStatus";
import Analytics from "./pages/Analytics";
import ThemeToggle from "./components/ThemeToggle";
import { ThemeProvider, createTheme, CssBaseline } from "@mui/material";
import "./components/Sidebar.css";

function App() {
  const [mode, setMode] = useState("dark");

  const theme = useMemo(() => {
    return createTheme({
      palette: {
        mode,
        ...(mode === "dark"
          ? {
              background: {
                default: "#010d21", // Deep blue background
                paper: "#010d21", // Cards and surfaces
              },
              primary: {
                main: "#3498db", // Soft blue
              },
              text: {
                primary: "#ffffff",
                secondary: "#a5b3c9",
              },
            }
          : {
              // Light mode customization if needed
              background: {
                default: "#f5f5f5",
                paper: "#ffffff",
              },
            }),
      },
    });
  }, [mode]);

  const toggleTheme = () => {
    setMode((prev) => (prev === "light" ? "dark" : "light"));
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <div style={{ display: "flex" }}>
          <Sidebar mode={mode} />

          <div style={{ marginLeft: "10px", padding: "5px", width: "100%" }}>
            <ThemeToggle toggleTheme={toggleTheme} currentTheme={mode} />
            <Routes>
              <Route path="/" element={<CreateTask />} />
              <Route path="/status" element={<TaskStatus />} />
              <Route path="/analytics" element={<Analytics />} />
            </Routes>
          </div>
        </div>
      </Router>
    </ThemeProvider>
  );
}

export default App;
