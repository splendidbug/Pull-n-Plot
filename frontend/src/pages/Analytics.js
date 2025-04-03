import React, { useEffect, useState } from "react";
import { Box, Button, Typography, MenuItem, FormControl, Select, InputLabel } from "@mui/material";
import ChartCard from "../components/ChartCard";

let chartIdCounter = 1;

const Analytics = () => {
  const [columns, setColumns] = useState([]); // [{ name, type }]
  const [charts, setCharts] = useState([]);
  const [xFields, setxField] = useState("");
  const [yFields, setyField] = useState("");
  const [tasks, setTasks] = useState([]);
  const [selectedTaskId, setSelectedTaskId] = useState("");

  // Load completed tasks
  useEffect(() => {
    fetch("http://localhost:5000/api/tasks/completed")
      .then((res) => res.json())
      .then(setTasks)
      .catch((err) => console.error("Error loading tasks:", err));
  }, []);

  const handleAxisChange = (chartId, axis, fieldName) => {
    setCharts((prev) =>
      prev.map((chart) => {
        if (chart.id !== chartId) return chart;
        return {
          ...chart,
          [axis]: fieldName,
        };
      })
    );
  };

  const handleChartTypeChange = (chartId, newType) => {
    setCharts((prev) => prev.map((chart) => (chart.id === chartId ? { ...chart, type: newType } : chart)));
  };

  // Fetch column metadata (name & type)
  useEffect(() => {
    if (!selectedTaskId) return;

    fetch(`http://localhost:5000/api/task_fields?task_id=${selectedTaskId}`)
      .then((res) => res.json())
      .then((data) => {
        setColumns(data);
        setCharts([]);
        const fieldNames = new Set(data.map((col) => col.name));
        const autoCharts = [];

        if (fieldNames.has("year") && fieldNames.has("price_in_euro")) {
          setxField("year");
          setyField("price_in_euro");
          autoCharts.push({
            id: chartIdCounter++,
            selectedFields: ["year", "price_in_euro"],
            fieldFilters: {
              year: {},
              price_in_euro: {},
            },
            type: "line",
            xField: "year",
            yField: "price_in_euro",
            isAutoChart: true,
          });
        }

        if (fieldNames.has("Manufacturer") && fieldNames.has("Sales")) {
          setxField("Manufacturer");
          setyField("Sales");
          autoCharts.push({
            id: chartIdCounter++,
            selectedFields: ["Manufacturer", "Sales"],
            fieldFilters: {
              Manufacturer: {},
              Sales: {},
            },
            type: "bar",
            xField: "Manufacturer",
            yField: "Sales",
            isAutoChart: true,
          });
        }

        if (autoCharts.length > 0) {
          setCharts(autoCharts);
        }
      })
      .catch((err) => console.error("Error fetching column names:", err));
  }, [selectedTaskId]);

  // Add a new chart
  const handleAddChart = () => {
    setCharts((prev) => [
      ...prev,
      {
        id: chartIdCounter++,
        selectedFields: [],
        fieldFilters: {},
        type: "line", // default chart type
      },
    ]);
  };

  const handleRemoveChart = (chartId) => {
    setCharts((prevCharts) => prevCharts.filter((chart) => chart.id !== chartId));
  };

  // Toggle chip selection
  const handleFieldToggle = (chartId, field) => {
    setCharts((prev) =>
      prev.map((chart) => {
        if (chart.id !== chartId) return chart;

        const selected = chart.selectedFields.includes(field);
        const updatedFields = selected ? chart.selectedFields.filter((f) => f !== field) : [...chart.selectedFields, field];

        const updatedFilters = { ...chart.fieldFilters };
        if (selected) {
          delete updatedFilters[field];
        } else {
          updatedFilters[field] = {};
        }

        const updatedChart = {
          ...chart,
          selectedFields: updatedFields,
          fieldFilters: updatedFilters,
        };

        if (selected) {
          if (chart.xField === field) updatedChart.xField = null;
          if (chart.yField === field) updatedChart.yField = null;
        }

        return updatedChart;
      })
    );
  };

  // Update filters (range or categorical)
  const handleFilterChange = (chartId, field, key, value) => {
    setCharts((prev) =>
      prev.map((chart) => {
        if (chart.id !== chartId) return chart;
        return {
          ...chart,
          fieldFilters: {
            ...chart.fieldFilters,
            [field]: {
              ...chart.fieldFilters[field],
              [key]: value,
            },
          },
        };
      })
    );
  };

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h5" gutterBottom>
        Analytics Dashboard
      </Typography>

      {/* Task Selector */}
      <FormControl fullWidth sx={{ mb: 3 }}>
        <InputLabel>Select Task</InputLabel>
        <Select value={selectedTaskId} label="Select Task" onChange={(e) => setSelectedTaskId(e.target.value)}>
          {tasks.map((task) => (
            <MenuItem key={task.id} value={task.id}>
              {task.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {/* Render each chart */}
      {charts.map((chart) => (
        <ChartCard key={chart.id} chart={chart} columns={columns} onFieldToggle={handleFieldToggle} onFilterChange={handleFilterChange} onRemove={handleRemoveChart} onAxisChange={handleAxisChange} onChartTypeChange={handleChartTypeChange} />
      ))}

      {/* Add Chart Button */}
      <Box sx={{ textAlign: "center" }}>
        <Button variant="contained" onClick={handleAddChart} sx={{ mt: charts.length > 0 ? 2 : 8 }}>
          + Add Chart
        </Button>
      </Box>
    </Box>
  );
};

export default Analytics;
