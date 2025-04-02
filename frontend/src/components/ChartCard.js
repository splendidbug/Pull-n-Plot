import React, { useEffect, useRef, useState } from "react";
import { Box, Chip, Paper, TextField, Typography, IconButton } from "@mui/material";
import { LineChart } from "../utils/charts/LineChart";
import { BarChart } from "../utils/charts/BarChart";
import CloseIcon from "@mui/icons-material/Close"; // Import the CloseIcon

const ChartCard = ({ chart, columns, onFieldToggle, onFilterChange, onRemove }) => {
  const svgRef = useRef();
  const [chartData, setChartData] = useState(null);

  useEffect(() => {
    console.log("use effect is called bitch");
    // console.log(chart.selectedFields);
    console.log(chart.xField);
    console.log(chart.yField);

    if (chart.selectedFields.length > 0) {
      if (chartData && chart.xField && chart.yField) {
        if (chart.type === "line") {
          console.log("inside line if; chartData: ", chartData);
          LineChart(svgRef, chartData, chart.xField, chart.yField);
        } else if (chart.type === "bar") {
          BarChart(svgRef, chartData, chart.xField, chart.yField);
        }
      }
    }
  }, [chartData, chart.xField, chart.yField, chart.selectedFields]);

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
          task_id: 1, // optional, if you're filtering by task
        }),
      })
        .then((res) => res.json())
        .then((data) => {
          setChartData(data);
          console.log("data: ", data);
        })
        .catch((err) => console.error("Failed to fetch filtered values:", err));
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [chart.selectedFields, chart.fieldFilters]);

  return (
    <Paper elevation={3} sx={{ p: 3, mb: 4, position: "relative" }}>
      {/* Close icon */}
      <IconButton
        size="small"
        onClick={() => onRemove(chart.id)} // Trigger the onRemove function
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

      <Box sx={{ display: "flex", gap: 1, mb: 2, flexWrap: "wrap" }}>
        {columns.map((col) => {
          const isSelected = chart.selectedFields.includes(col.name);
          return (
            <Box key={col.name}>
              <Chip
                label={col.name}
                clickable
                sx={{
                  borderRadius: "16px",
                  px: 2,
                  minWidth: "200px",
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
                <Box sx={{ mt: 1, mb: 2 }}>
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
                </Box>
              )}
            </Box>
          );
        })}
      </Box>

      {chart.selectedFields.length > 0 && <svg ref={svgRef}></svg>}
    </Paper>
  );
};

export default ChartCard;
