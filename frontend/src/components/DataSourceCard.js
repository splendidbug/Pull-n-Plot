import React from "react";
import { Box, Typography, IconButton, Paper, FormControl, InputLabel, Select, MenuItem, Chip, TextField } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

/**
 * DataSourceCard component selects a data source, view available fields, and set filters for those fields
 *
 * @component
 * @example
 * <DataSourceCard
 *   index={0}
 *   ds={dataSource}
 *   availableSources={availableSources}
 *   fieldMeta={fieldMeta}
 *   onRemove={handleRemoveSource}
 *   onSourceChange={handleSourceChange}
 *   onFieldToggle={handleFieldToggle}
 *   onFieldFilterChange={handleFieldFilterChange}
 * />
 */
function DataSourceCard({ index, ds, selectedSourceNames, availableSources, fieldMeta, onRemove, onSourceChange, onFieldToggle, onFieldFilterChange }) {
  const sourceOptions = availableSources.filter((src) => !selectedSourceNames.includes(src.name) || ds.selectedSource === src.name);
  const selectedSource = availableSources.find((src) => src.name === ds.selectedSource);

  return (
    <Paper elevation={3} sx={{ p: 2, mb: 3, pt: 5, position: "relative" }}>
      <IconButton size="small" onClick={() => onRemove(index)} sx={{ position: "absolute", top: 0, right: 0, color: "red", zIndex: 1 }}>
        <CloseIcon />
      </IconButton>

      <FormControl fullWidth sx={{ mb: 2 }}>
        <InputLabel>Select Data Source</InputLabel>
        <Select value={ds.selectedSource} label="Select Data Source" onChange={(e) => onSourceChange(index, e.target.value)}>
          {sourceOptions.map((src) => (
            <MenuItem key={src.name} value={src.name}>
              {src.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {selectedSource && (
        <>
          <Typography variant="subtitle2" sx={{ mb: 0.5, ml: 0.5, fontWeight: 500, color: "text.secondary" }}>
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
              const colName = col.name;
              const isSelected = ds.selectedFields.includes(colName);
              const meta = fieldMeta[ds.selectedSource]?.[colName];
              const isNumeric = meta?.type === "numeric";

              return (
                <Box key={colName}>
                  <Chip
                    label={<Box sx={{ display: "flex", alignItems: "center" }}>{colName}</Box>}
                    clickable
                    onClick={() => onFieldToggle(index, colName)}
                    onDelete={isSelected ? () => onFieldToggle(index, colName) : undefined}
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
                  />

                  {isSelected && ds.expandedFields.includes(colName) && (
                    <Box sx={{ mt: 1, mb: 2, px: 1 }}>
                      {isNumeric ? (
                        <Box sx={{ display: "flex", gap: 1 }}>
                          <TextField label="From" type="number" size="small" value={ds.fieldFilters[colName]?.from || ""} onChange={(e) => onFieldFilterChange(index, colName, "from", e.target.value)} />
                          <TextField label="To" type="number" size="small" value={ds.fieldFilters[colName]?.to || ""} onChange={(e) => onFieldFilterChange(index, colName, "to", e.target.value)} />
                        </Box>
                      ) : (
                        <TextField
                          fullWidth
                          size="small"
                          placeholder=", separated values"
                          defaultValue={ds.fieldFilters[colName]?.values?.join(", ") || ""}
                          onBlur={(e) => {
                            const raw = e.target.value;
                            const parsed = raw
                              .split(",")
                              .map((val) => val.trim())
                              .filter(Boolean);
                            onFieldFilterChange(index, colName, "values", parsed);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              const raw = e.target.value;
                              const parsed = raw
                                .split(",")
                                .map((val) => val.trim())
                                .filter(Boolean);
                              onFieldFilterChange(index, colName, "values", parsed);
                            }
                          }}
                        />
                      )}
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
}

export default DataSourceCard;
