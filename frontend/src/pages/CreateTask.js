import React, { useState } from "react";
import { TextField, Box, MenuItem, Select, InputLabel, FormControl, Checkbox, FormControlLabel, Button, Typography, IconButton, Paper } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import Chip from "@mui/material/Chip";
import CloseIcon from "@mui/icons-material/Close";
import { useEffect } from "react";
import Snackbar from "@mui/material/Snackbar";
import MuiAlert from "@mui/material/Alert";

const Alert = React.forwardRef(function Alert(props, ref) {
  return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

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

  const handleSourceChange = async (index, sourceName) => {
    const updated = [...dataSources];
    updated[index].selectedSource = sourceName;
    updated[index].selectedFields = [];
    updated[index].expandedFields = [];
    updated[index].fieldFilters = {};

    setDataSources(updated);

    // Fetch field metadata
    const res = await fetch(`http://localhost:5000/api/data-source-fields?source=${sourceName}`);
    const meta = await res.json();

    setFieldMeta((prev) => ({ ...prev, [sourceName]: meta }));
  };

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

  const handleRemoveSource = (index) => {
    const updated = [...dataSources];
    updated.splice(index, 1);
    setDataSources(updated);
  };

  const selectedSourceNames = dataSources.map((ds) => ds.selectedSource).filter(Boolean);

  const [toastOpen, setToastOpen] = useState(false);

  return (
    <Box sx={{ maxWidth: 1100, mx: "auto", mt: 5, px: 3 }}>
      <Typography variant="h5" gutterBottom>
        Task Setup
      </Typography>

      <TextField fullWidth label="Task Name" variant="outlined" value={taskName} onChange={(e) => setTaskName(e.target.value)} sx={{ mb: 4 }} />

      {dataSources.map((ds, index) => {
        const sourceOptions = availableSources.filter((src) => !selectedSourceNames.includes(src.name) || ds.selectedSource === src.name);
        const selectedSource = availableSources.find((src) => src.name === ds.selectedSource);
        return (
          <Paper
            key={index}
            elevation={3}
            sx={{
              p: 2,
              mb: 3,
              pt: 5, // extra top padding so icon doesn't overlap form
              position: "relative",
            }}
          >
            <IconButton
              size="small"
              onClick={() => handleRemoveSource(index)}
              sx={{
                position: "absolute",
                top: 0,
                right: 0,
                color: "red",
                zIndex: 1, // ensure it stays on top
              }}
            >
              <CloseIcon />
            </IconButton>

            {/* Content below */}
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Select Data Source</InputLabel>
              <Select value={ds.selectedSource} label="Select Data Source" onChange={(e) => handleSourceChange(index, e.target.value)}>
                {sourceOptions.map((src) => (
                  <MenuItem key={src.name} value={src.name}>
                    {src.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {selectedSource && (
              <>
                <Typography
                  variant="subtitle2"
                  sx={{
                    mb: 0.5,
                    ml: 0.5,
                    fontWeight: 500,
                    color: "text.secondary",
                  }}
                >
                  Fields:
                </Typography>
                <Box
                  sx={{
                    display: "flex",
                    overflowX: "auto",
                    gap: 1,
                    py: 1,
                    px: 1,
                    flexWrap: "nowrap",
                  }}
                >
                  {selectedSource.columns.map((col) => {
                    const isSelected = ds.selectedFields.includes(col);
                    return (
                      <Box key={col}>
                        <Chip
                          label={<Box sx={{ display: "flex", alignItems: "center" }}>{col}</Box>}
                          clickable
                          onClick={() => handleFieldToggle(index, col)}
                          onDelete={ds.selectedFields.includes(col) ? () => handleFieldToggle(index, col) : undefined}
                          sx={{
                            borderRadius: "16px",
                            px: 2,
                            minWidth: "200px", // 👈 minimum width
                            justifyContent: "center",
                            color: ds.selectedFields.includes(col) ? "white" : "black",
                            backgroundColor: ds.selectedFields.includes(col) ? "primary.main" : "grey.300",
                            "&:hover": {
                              backgroundColor: ds.selectedFields.includes(col) ? "primary.dark" : "grey.400",
                            },
                          }}
                        />

                        {/* Expanded Filter UI */}
                        {ds.selectedFields.includes(col) && ds.expandedFields.includes(col) && (
                          <Box sx={{ mt: 1, mb: 2, px: 1 }}>
                            {(() => {
                              const meta = fieldMeta[ds.selectedSource]?.[col];
                              const isNumeric = meta?.type === "numeric";

                              return isNumeric ? (
                                // Range input
                                <Box sx={{ display: "flex", gap: 1 }}>
                                  <TextField
                                    label="From"
                                    type="number"
                                    size="small"
                                    value={ds.fieldFilters[col]?.from || ""}
                                    onChange={(e) => {
                                      const updated = [...dataSources];
                                      updated[index] = {
                                        ...updated[index],
                                        fieldFilters: {
                                          ...updated[index].fieldFilters,
                                          [col]: {
                                            ...updated[index].fieldFilters[col],
                                            from: e.target.value, // or `to`
                                          },
                                        },
                                      };
                                      setDataSources(updated);
                                    }}
                                  />
                                  <TextField
                                    label="To"
                                    type="number"
                                    size="small"
                                    value={ds.fieldFilters[col]?.to || ""}
                                    onChange={(e) => {
                                      const updated = [...dataSources];
                                      updated[index].fieldFilters[col].to = e.target.value;
                                      setDataSources(updated);
                                    }}
                                  />
                                </Box>
                              ) : (
                                // Categorical dropdown
                                <FormControl fullWidth size="small">
                                  <Select
                                    multiple
                                    displayEmpty
                                    value={ds.fieldFilters[col]?.values || []}
                                    onChange={(e) => {
                                      const updated = [...dataSources];
                                      updated[index] = {
                                        ...updated[index],
                                        fieldFilters: {
                                          ...updated[index].fieldFilters,
                                          [col]: {
                                            ...updated[index].fieldFilters[col],
                                            values: e.target.value,
                                          },
                                        },
                                      };
                                      setDataSources(updated);
                                    }}
                                    renderValue={(selected) => {
                                      if (!selected || selected.length === 0) {
                                        return "Select Values";
                                      }
                                      return selected.length + " selected";
                                    }}
                                  >
                                    {meta?.values?.map((option) => (
                                      <MenuItem key={option} value={option}>
                                        <Checkbox checked={ds.fieldFilters[col]?.values?.includes(option) || false} />
                                        {option}
                                      </MenuItem>
                                    ))}
                                  </Select>
                                </FormControl>
                              );
                            })()}
                          </Box>
                        )}
                      </Box>
                    );
                  })}
                </Box>
              </>
            )}
          </Paper>
        );
      })}

      <Box textAlign="center">
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleAddSource} disabled={selectedSourceNames.length >= availableSources.length}>
          Add Data Source
        </Button>

        <Box sx={{ mt: 3 }}>
          <Button
            variant="contained"
            color="primary"
            disabled={dataSources.length === 0 || dataSources.some((ds) => ds.selectedFields.length === 0)}
            onClick={() => {
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
                  // show success toast / redirect
                })
                .catch((err) => {
                  console.error("Error submitting task:", err);
                });
            }}
          >
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
