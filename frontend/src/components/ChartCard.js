import React, { useEffect, useRef, useState } from "react";
import { Box, Chip, Paper, TextField, IconButton, Select, MenuItem, FormControl, InputLabel, Typography } from "@mui/material";
import { LineChart } from "../utils/charts/LineChart";
import { BarChart } from "../utils/charts/BarChart";
import { PieChart } from "../utils/charts/PieChart";
import CloseIcon from "@mui/icons-material/Close";

const ChartCard = ({ chart, columns, onFieldToggle, onFilterChange, onRemove, onAxisChange, onChartTypeChange }) => {
  const svgRef = useRef();
  const [chartData, setChartData] = useState(null);

  useEffect(() => {
    if (chart.selectedFields.length > 0) {
      if (chartData && chart.xField && chart.yField) {
        if (chart.type === "line") {
          LineChart(svgRef, chartData, chart.xField, chart.yField);
        } else if (chart.type === "bar") {
          BarChart(svgRef, chartData, chart.xField, chart.yField);
        } else if (chart.type === "pie" && chart.xField) {
          PieChart(svgRef, chartData, chart.xField);
        }
      }
    }
  }, [chartData, chart.xField, chart.yField, chart.selectedFields, chart.type]);

  useEffect(() => {
    if (chart.selectedFields.length === 0) return;

    const timeoutId = setTimeout(() => {
      fetch("http://localhost:5000/api/filtered-values", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fields: chart.selectedFields,
          filters: chart.fieldFilters,
          task_id: 1,
        }),
      })
        .then((res) => res.json())
        .then((data) => {
          setChartData(data);
        })
        .catch((err) => console.error("Failed to fetch filtered values:", err));
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [chart.selectedFields, chart.fieldFilters]);

  const handleAxisSelection = (axis, fieldName) => {
    if (chart[axis] === fieldName) {
      onAxisChange(chart.id, axis, null);
    } else {
      onAxisChange(chart.id, axis, fieldName);
    }
  };

  return (
    <Paper elevation={3} sx={{ p: 3, mb: 4, position: "relative" }}>
      {/* Close icon */}
      <IconButton
        size="small"
        onClick={() => onRemove(chart.id)}
        sx={{
          position: "absolute",
          top: 10,
          right: 10,
          color: "red",
          zIndex: 1,
        }}
      >
        <CloseIcon />
      </IconButton>

      {/* Chips + Chart Type Dropdown */}
      <Box
        sx={{
          display: "flex",
          gap: 2,
          flexWrap: "wrap",
          alignItems: "flex-start",
          mb: 2,
        }}
      >
        {columns.map((col) => {
          const isSelected = chart.selectedFields.includes(col.name);

          return (
            <Box
              key={col.name}
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                mb: 1,
                mr: 2,
                minWidth: "200px",
              }}
            >
              <Chip
                label={col.name}
                clickable
                sx={{
                  borderRadius: "16px",
                  px: 2,
                  justifyContent: "center",
                  color: isSelected ? "white" : "black",
                  backgroundColor: isSelected ? "primary.main" : "grey.300",
                  "&:hover": {
                    backgroundColor: isSelected ? "primary.dark" : "grey.400",
                  },
                }}
                onClick={() => onFieldToggle(chart.id, col.name)}
                onDelete={isSelected ? () => onFieldToggle(chart.id, col.name) : undefined}
              />

              {isSelected && (
                <Box sx={{ mt: 1 }}>
                  {col.type === "numeric" ? (
                    <Box sx={{ display: "flex", gap: 1 }}>
                      <TextField label="From" type="number" size="small" sx={{ width: 100 }} value={chart.fieldFilters[col.name]?.from || ""} onChange={(e) => onFilterChange(chart.id, col.name, "from", e.target.value)} />
                      <TextField label="To" type="number" size="small" sx={{ width: 100 }} value={chart.fieldFilters[col.name]?.to || ""} onChange={(e) => onFilterChange(chart.id, col.name, "to", e.target.value)} />
                    </Box>
                  ) : (
                    <TextField
                      size="small"
                      placeholder=", separated values"
                      defaultValue={chart.fieldFilters[col]?.values?.join(", ") || ""}
                      sx={{ width: 200 }}
                      onChange={(e) => {
                        const raw = e.target.value;
                        const parsed = raw
                          .split(",")
                          .map((v) => v.trim())
                          .filter(Boolean);
                        onFilterChange(chart.id, col.name, "values", parsed);
                      }}
                    />
                  )}

                  {!chart.isAutoChart && (
                    <Box sx={{ display: "flex", gap: 2, mt: 1 }}>
                      <label>
                        <input type="checkbox" checked={chart.xField === col.name} disabled={chart.xField && chart.xField !== col.name} onChange={() => handleAxisSelection("xField", col.name)} /> X Axis
                      </label>
                      <label>
                        <input type="checkbox" checked={chart.yField === col.name} disabled={chart.yField && chart.yField !== col.name} onChange={() => handleAxisSelection("yField", col.name)} /> Y Axis
                      </label>
                    </Box>
                  )}
                </Box>
              )}
            </Box>
          );
        })}

        {/* Chart type dropdown */}
        {!chart.isAutoChart && (
          <FormControl size="small" sx={{ minWidth: 150 }} disabled={chart.isAutoChart}>
            <InputLabel>Chart Type</InputLabel>
            <Select value={chart.type} label="Chart Type" onChange={(e) => onChartTypeChange(chart.id, e.target.value)}>
              <MenuItem value="line">Line</MenuItem>
              <MenuItem value="bar">Bar</MenuItem>
              <MenuItem value="pie">Pie</MenuItem>
            </Select>
          </FormControl>
        )}
      </Box>

      {/* Chart SVG */}
      {chart.selectedFields.length > 0 && <svg ref={svgRef}></svg>}
    </Paper>
  );
};

export default ChartCard;
