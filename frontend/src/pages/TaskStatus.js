import React, { useEffect, useState } from "react";
import { Box, Typography, Paper, Divider } from "@mui/material";
import io from "socket.io-client";
import { ReactComponent as TaskIcon } from "../utils/Assets/task_icon.svg";
import { ReactComponent as CalendarIcon } from "../utils/Assets/calendar_icon.svg";
import { ReactComponent as DataSourceIcon } from "../utils/Assets/data-source.svg";

import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import HourglassEmptyIcon from "@mui/icons-material/HourglassEmpty";
import CloudDownloadIcon from "@mui/icons-material/CloudDownload";
import AutoAwesomeMotionIcon from "@mui/icons-material/AutoAwesomeMotion";

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

    socket.on("task_update", (update) => {
      setTasks((prev) => prev.map((task) => (task.id === update.taskId ? { ...task, status: update.status } : task)));
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const renderStatusIcon = (status) => {
    const animatedStyle = {
      display: "inline-block",
      animation: "spin 2s linear infinite",
      "@keyframes spin": {
        from: { transform: "rotate(0deg)" },
        to: { transform: "rotate(360deg)" },
      },
    };

    switch (status) {
      case "pending":
        return <HourglassEmptyIcon sx={{ color: "#ffc107" }} />;
      case "Fetching data":
        return (
          <Box>
            <CloudDownloadIcon sx={{ color: "#2196f3", mt: 0.5 }} />
          </Box>
        );
      case "Merging data":
        return (
          <Box>
            <AutoAwesomeMotionIcon sx={{ color: "#00bcd4", mt: 0.5 }} />
          </Box>
        );
      case "Completed":
        return <CheckCircleIcon sx={{ color: "#4caf50" }} />;
      default:
        return null;
    }
  };

  return (
    <Box sx={{ maxWidth: 1000, mx: "auto", mt: 5, px: 2 }}>
      <Typography variant="h5" gutterBottom>
        Task Status
      </Typography>

      <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
        {tasks.map((task) => (
          <Paper
            key={task.id}
            elevation={3}
            sx={{
              p: 2,
              borderRadius: 2,
              backgroundColor: "#1a1a2e",
              color: "#e0e0e0",
            }}
          >
            {/* Header */}
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                flexWrap: "wrap",
                mb: 2,
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <TaskIcon style={{ width: 20, height: 20 }} />
                <Typography variant="subtitle1" sx={{ fontWeight: "bold" }}>
                  {task.name}
                </Typography>
              </Box>

              {/* Status */}
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                {renderStatusIcon(task.status)}
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 500,
                    color: task.status === "Completed" ? "#4caf50" : task.status === "pending" ? "#ffc107" : "lightblue",
                    textTransform: "capitalize",
                  }}
                >
                  {task.status}
                </Typography>
              </Box>

              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <CalendarIcon style={{ width: 20, height: 20 }} />
                <Typography variant="subtitle1" sx={{ fontWeight: "bold" }}>
                  {new Date(task.created_at).toLocaleString()}
                </Typography>
              </Box>
            </Box>

            <Divider sx={{ mb: 2, backgroundColor: "#444" }} />

            {/* Data Sources */}
            {task.data_sources.map((ds, idx) => (
              <Box key={idx} sx={{ mb: 3 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <DataSourceIcon style={{ width: 20, height: 20 }} />
                  <Typography variant="subtitle1" sx={{ fontWeight: "bold" }}>
                    {ds.selectedSource}
                  </Typography>
                </Box>

                {/* Field Cards */}
                <Box sx={{ position: "relative", mt: 2, mb: 3 }}>
                  <Typography
                    variant="caption"
                    sx={{
                      position: "absolute",
                      top: -10,
                      left: "50%",
                      transform: "translateX(-50%)",
                      backgroundColor: "#1a1a2e",
                      px: 1,
                      color: "#80bfff",
                      fontSize: "12px",
                    }}
                  >
                    Selected Fields
                  </Typography>

                  <Box
                    sx={{
                      border: "1px solid #80bfff",
                      borderRadius: 2,
                      p: 2,
                      pt: 3,
                      display: "flex",
                      flexWrap: "wrap",
                      gap: 2,
                    }}
                  >
                    {ds.selectedFields.map((fieldName) => {
                      const filter = ds.fieldFilters?.[fieldName];
                      const hasRange = filter?.from || filter?.to;
                      const hasValues = Array.isArray(filter?.values) && filter.values.length > 0;

                      return (
                        <Box
                          key={fieldName}
                          sx={{
                            backgroundColor: "#1a1a2e",
                            border: "1px solid #2196f3",
                            borderRadius: 2,
                            px: 2,
                            py: 1.5,
                            minWidth: 180,
                            maxWidth: 220,
                            color: "#fff",
                            fontSize: "14px",
                            display: "flex",
                            flexDirection: "column",
                            gap: 0.5,
                          }}
                        >
                          <Typography
                            sx={{
                              fontWeight: 600,
                              fontSize: "14px",
                              color: "#fff",
                            }}
                          >
                            {fieldName}
                          </Typography>

                          {hasRange && (
                            <Typography sx={{ fontSize: "13px", color: "#ccc" }}>
                              From: {filter.from || "-"} To: {filter.to || "-"}
                            </Typography>
                          )}

                          {hasValues && <Typography sx={{ fontSize: "13px", color: "#ccc" }}>Values: {filter.values.join(", ")}</Typography>}
                        </Box>
                      );
                    })}
                  </Box>
                </Box>
              </Box>
            ))}
          </Paper>
        ))}
      </Box>
    </Box>
  );
}

export default TaskStatus;
