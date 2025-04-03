import React, { useEffect, useRef, useState } from "react";
import { Box, Paper, IconButton, FormControl, InputLabel, MenuItem, Select, Button } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { LineChart } from "../utils/charts/LineChart";
import { BarChart } from "../utils/charts/BarChart";
import { PieChart } from "../utils/charts/PieChart";
import FieldCard from "./FieldCard";

const ChartCard = ({ chart, columns, onFieldToggle, onFilterChange, onRemove, onAxisChange, onChartTypeChange }) => {
  const svgRef = useRef();
  const [chartData, setChartData] = useState(null);

  /**
   * Renders the chart whenever chart data or chart config changes
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
   * Fetch data from backend when fields/filters change
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
  }, [chart.selectedFields, chart.fieldFilters, chart.task_id]);

  /**
   * Downloads the current SVG as a PNG
   */
  const handleDownloadPNG = () => {
    if (!svgRef.current) return;

    const svgElement = svgRef.current;
    // Make sure your SVG has an explicit width/height or we can derive it from getBoundingClientRect()
    const { width, height } = svgElement.getBoundingClientRect();

    // Serialize the SVG to a string
    const serializer = new XMLSerializer();
    let source = serializer.serializeToString(svgElement);

    // Add name spaces.
    if (!source.match(/^<svg[^>]+xmlns="http:\/\/www\.w3\.org\/2000\/svg"/)) {
      source = source.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
    }
    if (!source.match(/^<svg[^>]+"http:\/\/www\.w3\.org\/1999\/xlink"/)) {
      source = source.replace(/^<svg/, '<svg xmlns:xlink="http://www.w3.org/1999/xlink"');
    }

    // Create a data URL from the SVG string
    const svgDataUrl = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(source);

    // Create an <img> element to load the data URL
    const img = new Image();
    img.onload = () => {
      // Create a temporary <canvas> to draw the image
      const canvas = document.createElement("canvas");
      canvas.width = width || 800; // fallback if bounding box is 0
      canvas.height = height || 600; // fallback if bounding box is 0

      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0);

      // Convert canvas to PNG data URL
      const pngFile = canvas.toDataURL("image/png");

      // Download link
      const downloadLink = document.createElement("a");
      downloadLink.href = pngFile;
      downloadLink.download = "chart.png";
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    };

    img.src = svgDataUrl;
  };

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

      {/* Chart + Controls Row */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mt: 2,
        }}
      >
        {/* Chart SVG */}
        <Box sx={{ flex: 1 }}>{chart.selectedFields.length > 0 && <svg ref={svgRef}></svg>}</Box>

        {/* Right-side Controls */}
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            justifyContent: "center",
            height: "100%",
            pl: 3,
            gap: 2,
          }}
        >
          {/* Chart Type Dropdown */}
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Chart Type</InputLabel>
            <Select value={chart.type} label="Chart Type" onChange={(e) => onChartTypeChange(chart.id, e.target.value)}>
              <MenuItem value="line">Line</MenuItem>
              <MenuItem value="bar">Bar</MenuItem>
              <MenuItem value="pie">Pie</MenuItem>
            </Select>
          </FormControl>

          {/* Download PNG Button */}
          <Button variant="contained" size="small" onClick={handleDownloadPNG}>
            Download Chart
          </Button>
        </Box>
      </Box>
    </Paper>
  );
};

export default ChartCard;
