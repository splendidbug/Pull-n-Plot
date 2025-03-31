// components/ThemeToggle.js
import React from "react";
import { Box, IconButton, useTheme } from "@mui/material";
import Brightness4Icon from "@mui/icons-material/Brightness4";
import Brightness7Icon from "@mui/icons-material/Brightness7";

const ThemeToggle = ({ toggleTheme, currentTheme }) => {
  const theme = useTheme();

  return (
    <Box
      sx={{
        position: "fixed",
        top: 16,
        right: 16,
        zIndex: 2000,
        backgroundColor: theme.palette.background.paper,
        borderRadius: "20px",
        padding: "4px 6px",
        boxShadow: 3,
        display: "flex",
        alignItems: "center",
      }}
    >
      <IconButton onClick={toggleTheme} color="inherit">
        {currentTheme === "dark" ? <Brightness7Icon /> : <Brightness4Icon />}
      </IconButton>
    </Box>
  );
};

export default ThemeToggle;
