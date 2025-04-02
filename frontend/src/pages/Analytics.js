import React, { useEffect, useState } from "react";
import { Box, Button, Typography } from "@mui/material";
import ChartCard from "../components/ChartCard";

let chartIdCounter = 1;

const Analytics = () => {
  const [columns, setColumns] = useState([]); // [{ name, type }]
  const [charts, setCharts] = useState([]);
  const [xFields, setxField] = useState("");
  const [yFields, setyField] = useState("");

  // Fetch column metadata (name & type)
  useEffect(() => {
    fetch("http://localhost:5000/api/task_fields")
      .then((res) => res.json())
      .then((data) => {
        setColumns(data);

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
          });
        }

        if (autoCharts.length > 0) {
          setCharts(autoCharts);
        }
      })
      .catch((err) => console.error("Error fetching column names:", err));
  }, []);

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

        // Auto-assign chart type based on selected fields
        let updatedType = chart.type;
        const fieldsSet = new Set(updatedFields);

        // let xField = null;
        // let yField = null;

        // if (fieldsSet.has("year") && fieldsSet.has("price_in_euro")) {
        //   updatedType = "line";
        //   xField = "year";
        //   yField = "price_in_euro";
        //   console.log("yes, year and euro");
        // } else if (fieldsSet.has("price_in_euro") && fieldsSet.has("Manufacturer")) {
        //   updatedType = "bar";
        // }

        // Handle filters
        const updatedFilters = { ...chart.fieldFilters };
        if (selected) {
          delete updatedFilters[field];
        } else {
          updatedFilters[field] = {};
        }

        return {
          ...chart,
          selectedFields: updatedFields,
          fieldFilters: updatedFilters,
          type: updatedType,
          xFields,
          yFields,
        };
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

      {/* Render each chart */}
      {charts.map((chart) => (
        <ChartCard
          key={chart.id}
          chart={chart}
          columns={columns}
          onFieldToggle={handleFieldToggle}
          onFilterChange={handleFilterChange}
          onRemove={handleRemoveChart} // Pass the remove handler
        />
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
