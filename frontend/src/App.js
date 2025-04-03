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

  /**
   * Handles the theme of the app. `theme` is created using the `createTheme` function from MUI
   */
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

  /**
   * The `toggleTheme` function toggles between 'dark' and 'light' modes.
   *
   * @returns {void}
   */
  const toggleTheme = () => {
    setMode((prev) => (prev === "light" ? "dark" : "light"));
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <div style={{ marginLeft: "250px", display: "flex", minHeight: "100vh", height: "100%" }}>
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
