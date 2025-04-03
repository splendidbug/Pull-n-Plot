import React, { useEffect, useRef, useState } from "react";
import { Box, Paper, IconButton, FormControl, InputLabel, MenuItem, Select } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { LineChart } from "../utils/charts/LineChart";
import { BarChart } from "../utils/charts/BarChart";
import { PieChart } from "../utils/charts/PieChart";
import FieldCard from "./FieldCard";

/**
 * Renders a chart with configurable fields, filters, chart type
 * Provides the ability to toggle fields, apply filters, and switch chart types
 *
 * @component
 * <ChartCard
 *   chart={chart}
 *   columns={columns}
 *   onFieldToggle={handleFieldToggle}
 *   onFilterChange={handleFilterChange}
 *   onRemove={handleRemoveChart}
 *   onAxisChange={handleAxisChange}
 *   onChartTypeChange={handleChartTypeChange}
 * />
 */
const ChartCard = ({ chart, columns, onFieldToggle, onFilterChange, onRemove, onAxisChange, onChartTypeChange }) => {
  const svgRef = useRef();
  const [chartData, setChartData] = useState(null);

  /**
   * renders the chart when the chart data is updated
   * runs whenever `chartData`, `chart.xField`, `chart.yField`, or `chart.type` changes
   */
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

  /**
   * useEffect to fetch filtered data when fields or filters change
   * data is fetched from the backend API and then used to update the `chartData` state
   */
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
          task_id: chart.task_id,
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

  return (
    <Paper elevation={3} sx={{ p: 3, mb: 4, position: "relative" }}>
      {/* Close Icon */}
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

      {/* Field Selectors */}
      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          gap: 2,
          maxHeight: 280,
          overflowY: "auto",
          pb: 1,
        }}
      >
        {columns.map((col) => {
          const isSelected = chart.selectedFields.includes(col.name);

          return <FieldCard key={col.name} col={col} isSelected={isSelected} filters={chart.fieldFilters[col.name]} onToggle={() => onFieldToggle(chart.id, col.name)} onFilterChange={(key, value) => onFilterChange(chart.id, col.name, key, value)} xField={chart.xField} yField={chart.yField} onAxisChange={(axis, value) => onAxisChange(chart.id, axis, value)} chartType={chart.type} />;
        })}
      </Box>

      {/* Chart + Dropdown Row */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mt: 2,
        }}
      >
        {/* Chart SVG */}
        <Box sx={{ flex: 1, pl: 5 }}>{chart.selectedFields.length > 0 && <svg ref={svgRef}></svg>}</Box>

        {/* Chart Type Dropdown */}

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
      </Box>
    </Paper>
  );
};

export default ChartCard;
