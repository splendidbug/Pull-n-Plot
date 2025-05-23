import React, { useState } from "react";
import { TextField, Box, MenuItem, Select, InputLabel, FormControl, Checkbox, FormControlLabel, Button, Typography, IconButton, Paper } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import Chip from "@mui/material/Chip";
import CloseIcon from "@mui/icons-material/Close";
import { useEffect } from "react";
import Snackbar from "@mui/material/Snackbar";
import MuiAlert from "@mui/material/Alert";
import DataSourceCard from "../components/DataSourceCard";

/**
 * Alert component used to display success toasts
 */
const Alert = React.forwardRef(function Alert(props, ref) {
  return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

/**
 * CreateTask component sets up a task by selecting data sources and filters
 * Can add multiple data sources and select relevant fields
 *
 */
function CreateTask() {
  const [availableSources, setAvailableSources] = useState([]);
  useEffect(() => {
    fetch("http://localhost:5000/api/data-sources")
      .then((res) => res.json())
      .then((data) => {
        setAvailableSources(data);
      })
      .catch((err) => {
        console.error("Failed to fetch data sources:", err);
      });
  }, []);

  const [taskName, setTaskName] = useState("");
  const [dataSources, setDataSources] = useState([]);

  /**
   * Adds an empty data source to the dataSources array
   *
   * @returns {void}
   */
  const handleAddSource = () => {
    setDataSources([
      ...dataSources,
      {
        selectedSource: "",
        selectedFields: [],
        expandedFields: [],
        fieldFilters: {},
      },
    ]);
  };
  const [fieldMeta, setFieldMeta] = useState({});

  /**
   * Updates the selected source for a specific data source and resets its field-related state
   *
   * @param {number} index - The index of the data source to update
   * @param {string} sourceName - The name of the selected data source
   * @returns {void}
   */
  const handleSourceChange = (index, sourceName) => {
    const updated = [...dataSources];
    updated[index].selectedSource = sourceName;
    updated[index].selectedFields = [];
    updated[index].expandedFields = [];
    updated[index].fieldFilters = {};
    setDataSources(updated);

    // Find the metadata from availableSources
    const sourceMeta = availableSources.find((s) => s.name === sourceName);
    if (sourceMeta) {
      const columnsMeta = {};
      sourceMeta.columns.forEach((col) => {
        columnsMeta[col.name] = { type: col.type };
      });

      setFieldMeta((prev) => ({
        ...prev,
        [sourceName]: columnsMeta,
      }));
    }
  };

  /**
   * Toggles the selection of a field for a given data source
   *
   * @param {number} index - The index of the data source
   * @param {string} field - The name of the field to toggle
   * @returns {void}
   */
  const handleFieldToggle = (index, field) => {
    const updated = [...dataSources];
    const ds = updated[index];

    const isSelected = ds.selectedFields.includes(field);

    if (isSelected) {
      ds.selectedFields = ds.selectedFields.filter((f) => f !== field);
      delete ds.fieldFilters[field];
      ds.expandedFields = ds.expandedFields.filter((f) => f !== field);
    } else {
      ds.selectedFields.push(field);
      ds.fieldFilters[field] = {}; // you can populate this later based on field type
      ds.expandedFields.push(field);
    }

    setDataSources(updated);
  };

  /**
   * Removes a data source from the dataSources array
   *
   * @param {number} index - The index of the data source to remove
   * @returns {void}
   */
  const handleRemoveSource = (index) => {
    const updated = [...dataSources];
    updated.splice(index, 1);
    setDataSources(updated);
  };

  const selectedSourceNames = dataSources.map((ds) => ds.selectedSource).filter(Boolean);

  const [toastOpen, setToastOpen] = useState(false);

  /**
   * Submits the task with the selected data sources and field filters
   *
   * @returns {void}
   */
  const handleSubmitTask = () => {
    const payload = {
      taskName,
      dataSources: dataSources.map((ds) => ({
        selectedSource: ds.selectedSource,
        selectedFields: ds.selectedFields,
        fieldFilters: ds.fieldFilters,
      })),
    };

    fetch("http://localhost:5000/api/tasks", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    })
      .then((res) => res.json())
      .then((data) => {
        console.log("Task submitted successfully:", data);
        setToastOpen(true);
        setTaskName("");
        setDataSources([]);
      })
      .catch((err) => {
        console.error("Error submitting task:", err);
      });
  };

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h5" gutterBottom>
        Task Setup
      </Typography>

      <TextField fullWidth label="Task Name" variant="outlined" value={taskName} onChange={(e) => setTaskName(e.target.value)} sx={{ mb: 4 }} />

      {dataSources.map((ds, index) => (
        <DataSourceCard
          key={index}
          index={index}
          ds={ds}
          selectedSourceNames={selectedSourceNames}
          availableSources={availableSources}
          fieldMeta={fieldMeta}
          onRemove={handleRemoveSource}
          onSourceChange={handleSourceChange}
          onFieldToggle={handleFieldToggle}
          onFieldFilterChange={(i, col, type, value) => {
            const updated = [...dataSources];
            updated[i] = {
              ...updated[i],
              fieldFilters: {
                ...updated[i].fieldFilters,
                [col]: {
                  ...updated[i].fieldFilters[col],
                  [type]: value,
                },
              },
            };
            setDataSources(updated);
          }}
        />
      ))}

      <Box textAlign="center">
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleAddSource} disabled={selectedSourceNames.length >= availableSources.length}>
          Add Data Source
        </Button>

        <Box sx={{ mt: 3 }}>
          <Button variant="contained" color="primary" disabled={dataSources.length === 0 || dataSources.some((ds) => ds.selectedFields.length === 0)} onClick={handleSubmitTask}>
            Submit Task
          </Button>
        </Box>
      </Box>
      <Snackbar open={toastOpen} autoHideDuration={3000} onClose={() => setToastOpen(false)} anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
        <Alert onClose={() => setToastOpen(false)} severity="success" sx={{ width: "100%" }}>
          Task submitted successfully!
        </Alert>
      </Snackbar>
    </Box>
  );
}
export default CreateTask;
