import React, { useEffect, useState } from "react";
import { Box, Button, Typography, MenuItem, FormControl, Select, InputLabel } from "@mui/material";
import ChartCard from "../components/ChartCard";

let chartIdCounter = 1;

/**
 * Analytics component for displaying the analytics dashboard
 * Selects a task, create charts based on task data, visualize relationships between task fields using different chart types.
 *
 * @component
 * <Analytics />
 */
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

  /**
   * Handles changes to the chart's axis (either x or y)
   * Updates the chart's xField or yField accordingly
   *
   * @param {number} chartId - chart id
   * @param {string} axis - the axis to update ("xField"/"yField")
   * @param {string} fieldName - field name to set on the axis
   *
   * @returns {void}
   */
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

  /**
   * Handles changes to the chart type (e.g., line, bar)
   *
   * @param {number} chartId - chart id
   * @param {string} newType - The new chart type (e.g., "line", "bar")
   *
   * @returns {void}
   */
  const handleChartTypeChange = (chartId, newType) => {
    setCharts((prev) => prev.map((chart) => (chart.id === chartId ? { ...chart, type: newType } : chart)));
  };

  /**
   * Fetch column metadata (name & type)
   */
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

  /**
   * Adds a new chart to the charts state
   *
   * @returns {void}
   */
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

  /**
   * Removes a chart from the charts state based on its ID.
   *
   * @param {number} chartId - chart id to remove
   * @returns {void}
   */
  const handleRemoveChart = (chartId) => {
    setCharts((prevCharts) => prevCharts.filter((chart) => chart.id !== chartId));
  };

  /**
   * Toggles field selection for a specific chart
   *
   * @param {number} chartId - chart id to update
   * @param {string} field - field to toggle
   * @returns {void}
   */
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

  /**
   * Handles changes to the filter for a field (numerical/categorical).
   *
   * @param {number} chartId - chart id to update
   * @param {string} field - field whose filter is being updated
   * @param {string} key - filter key ("from", "to"/ "values").
   * @param {string|Array} value - new filter value
   *
   * @returns {void}
   */
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
