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
    if (chart.selectedFields.length > 0 && chartData) {
      if (chart.type === "line" && chart.xField && chart.yField) {
        LineChart(svgRef, chartData, chart.xField, chart.yField);
      } else if (chart.type === "bar" && chart.xField && chart.yField) {
        BarChart(svgRef, chartData, chart.xField, chart.yField);
      } else if (chart.type === "pie" && chart.xField) {
        PieChart(svgRef, chartData, chart.xField);
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
          task_id: chart.task_id, // pass correct task ID
        }),
      })
        .then((res) => res.json())
        .then((data) => {
          setChartData(data);
          console.log("ChartCard: ", data);
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

      {/* Chips + Chart Type Dropdown (scrollable area) */}
      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          gap: 2,
          mb: 2,
          pb: 1,
          overflowX: "auto",
          maxHeight: 140,
          alignContent: "flex-start",
        }}
      >
        {columns.map((col) => {
          const isSelected = chart.selectedFields.includes(col.name);

          return (
            <Box
              key={col.name}
              sx={{
                flex: "0 0 auto",
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
      </Box>
      {/* Chart layout + dropdown beside chart */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        {/* Chart SVG */}
        <Box sx={{ flex: 1 }}>{chart.selectedFields.length > 0 && <svg ref={svgRef}></svg>}</Box>

        {/* Centered Chart Type dropdown */}
        {!chart.isAutoChart && (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
              minWidth: 180,
              pl: 3,
            }}
          >
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Chart Type</InputLabel>
              <Select value={chart.type} label="Chart Type" onChange={(e) => onChartTypeChange(chart.id, e.target.value)}>
                <MenuItem value="line">Line</MenuItem>
                <MenuItem value="bar">Bar</MenuItem>
                <MenuItem value="pie">Pie</MenuItem>
              </Select>
            </FormControl>
          </Box>
        )}
      </Box>
    </Paper>
  );
};

export default ChartCard;
