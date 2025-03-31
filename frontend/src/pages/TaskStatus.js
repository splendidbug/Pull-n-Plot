import React, { useEffect, useState } from "react";
import { Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Typography } from "@mui/material";
import io from "socket.io-client";

function TaskStatus() {
  const [tasks, setTasks] = useState([]);
  useEffect(() => {
    fetch("http://localhost:5000/api/tasks")
      .then((res) => res.json())
      .then((data) => setTasks(data))
      .catch((err) => console.error("Failed to fetch tasks:", err));
  }, []);

  useEffect(() => {
    const socket = io("http://localhost:5000");

    socket.on("connect", () => {
      console.log("Connected to WebSocket");
    });

    socket.onAny((event, ...args) => {
      console.log("🔍 Received event:", event, args);
    });

    socket.on("task_update", (update) => {
      console.log("Task update received:", update);
      setTasks((prevTasks) => prevTasks.map((task) => (task.id === update.taskId ? { ...task, status: update.status } : task)));
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <Box sx={{ maxWidth: 1200, mx: "auto", mt: 5, px: 3 }}>
      <Typography variant="h5" gutterBottom>
        Task Status
      </Typography>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Task Name</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Data Sources</TableCell>
              <TableCell>Created At</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {tasks.map((task) => (
              <TableRow key={task.id}>
                <TableCell>{task.name}</TableCell>
                <TableCell>{task.status}</TableCell>
                <TableCell>
                  {task.data_sources.map((ds, idx) => (
                    <Box key={idx} sx={{ mb: 1, p: 1 }}>
                      <Typography variant="subtitle2">Data Source: {ds.selectedSource}</Typography>

                      {/* Selected Fields */}
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        Selected Fields:
                      </Typography>
                      <ul style={{ margin: 0, paddingLeft: 16 }}>
                        {ds.selectedFields.map((field) => (
                          <li key={field}>{field}</li>
                        ))}
                      </ul>

                      {/* Field Filters */}
                      {Object.keys(ds.fieldFilters || {}).length > 0 && (
                        <>
                          <Typography variant="body2" sx={{ fontWeight: 500, mt: 1 }}>
                            Filters:
                          </Typography>
                          <ul style={{ margin: 0, paddingLeft: 16 }}>
                            {Object.entries(ds.fieldFilters).map(([field, filter]) => {
                              // Check if filter has meaningful values
                              const hasRange = filter.from !== undefined && filter.to !== undefined && (filter.from || filter.to);
                              const hasValues = Array.isArray(filter.values) && filter.values.length > 0;

                              if (!hasRange && !hasValues) return null; // skip empty filters

                              return (
                                <li key={field}>
                                  {field}: {hasRange ? `From ${filter.from} to ${filter.to}` : hasValues ? filter.values.join(", ") : "-"}
                                </li>
                              );
                            })}
                          </ul>
                        </>
                      )}
                    </Box>
                  ))}
                </TableCell>

                <TableCell>{new Date(task.created_at).toLocaleString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}

export default TaskStatus;
