import React, { useState } from "react";
import { TextField, Box, MenuItem, Select, InputLabel, FormControl, Checkbox, FormControlLabel, Button, Typography, IconButton, Paper } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import Chip from "@mui/material/Chip";
import CloseIcon from "@mui/icons-material/Close";

const availableSources = [
  { name: "data1.csv", columns: ["Name", "Age", "City"] },
  { name: "data2.csv", columns: ["Product", "Price", "Quantity"] },
  { name: "data3.csv", columns: ["Employee", "Salary", "Department"] },
];

function CreateTask() {
  const [taskName, setTaskName] = useState("");
  const [dataSources, setDataSources] = useState([]);

  const handleAddSource = () => {
    setDataSources([...dataSources, { selectedSource: "", selectedFields: [] }]);
  };

  const handleSourceChange = (index, sourceName) => {
    const updated = [...dataSources];
    updated[index].selectedSource = sourceName;
    updated[index].selectedFields = [];
    setDataSources(updated);
  };
  const handleFieldToggle = (index, field) => {
    const updated = [...dataSources];
    const selectedFields = updated[index].selectedFields;
    updated[index].selectedFields = selectedFields.includes(field) ? selectedFields.filter((f) => f !== field) : [...selectedFields, field];
    setDataSources(updated);
  };
  const handleRemoveSource = (index) => {
    const updated = [...dataSources];
    updated.splice(index, 1);
    setDataSources(updated);
  };

  const selectedSourceNames = dataSources.map((ds) => ds.selectedSource).filter(Boolean);

  return (
    <Box sx={{ maxWidth: 800, mx: "auto", mt: 5, px: 3 }}>
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
            {/* ❌ Close Icon */}
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
                    mb: 0.5, // ⬇️ reduced bottom margin
                    ml: 0.5, // ⬅️ added left margin
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
                      <Chip
                        key={col}
                        label={col}
                        clickable
                        onClick={() => handleFieldToggle(index, col)}
                        sx={{
                          borderRadius: "16px",
                          px: 2,
                          color: isSelected ? "white" : "black",
                          backgroundColor: isSelected ? "primary.main" : "grey.300",
                          "&:hover": {
                            backgroundColor: isSelected ? "primary.dark" : "grey.400",
                          },
                        }}
                      />
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
              console.log("Submitting task:", {
                taskName,
                dataSources,
              });
            }}
          >
            Submit Task
          </Button>
        </Box>
      </Box>
    </Box>
  );
}
export default CreateTask;
