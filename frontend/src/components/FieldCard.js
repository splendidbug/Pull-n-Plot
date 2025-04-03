import React, { useState } from "react";
import { Box, Chip, TextField } from "@mui/material";

const FieldCard = ({ col, isSelected, filters, onToggle, onFilterChange, xField, yField, onAxisChange, chartType }) => {
  const isX = xField === col.name;
  const isY = yField === col.name;

  // Local state for the raw text in the TextField (used only if col.type is not "numeric").
  // Initialize it from filters?.values, joined by comma.
  const [textValue, setTextValue] = useState((filters?.values || []).join(", "));

  const handleCheckbox = (axis) => () => {
    onAxisChange(axis, isX || isY ? null : col.name);
  };

  // Only parse and send to onFilterChange when user leaves the text field
  const handleBlur = () => {
    onFilterChange(
      "values",
      textValue
        .split(",")
        .map((v) => v.trim())
        .filter(Boolean)
    );
  };

  return (
    <Box
      sx={{
        width: 240,
        p: 2,
        borderRadius: 2,
        backgroundColor: "#1c1c2b",
        border: isSelected ? "2px solid #2196f3" : "1px solid #444",
        display: "flex",
        flexDirection: "column",
        gap: 1.5,
      }}
    >
      <Chip label={col.name} color={isSelected ? "primary" : "default"} onClick={onToggle} onDelete={isSelected ? onToggle : undefined} sx={{ width: "fit-content", minWidth: "200px" }} />

      {isSelected && (
        <>
          {col.type === "numeric" ? (
            <Box sx={{ display: "flex", gap: 1 }}>
              <TextField label="From" size="small" type="number" value={filters?.from || ""} onChange={(e) => onFilterChange("from", e.target.value)} />
              <TextField label="To" size="small" type="number" value={filters?.to || ""} onChange={(e) => onFilterChange("to", e.target.value)} />
            </Box>
          ) : (
            <TextField size="small" label="Values" placeholder="e.g. BMW, Audi" value={textValue} onChange={(e) => setTextValue(e.target.value)} onBlur={handleBlur} />
          )}

          <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            <label>
              <input type="checkbox" checked={isX} disabled={xField && !isX} onChange={handleCheckbox("xField")} /> {chartType === "pie" ? "Group by this field" : "X Axis"}
            </label>

            {chartType !== "pie" && (
              <label>
                <input type="checkbox" checked={isY} disabled={yField && !isY} onChange={handleCheckbox("yField")} /> Y Axis
              </label>
            )}
          </Box>
        </>
      )}
    </Box>
  );
};

export default FieldCard;
