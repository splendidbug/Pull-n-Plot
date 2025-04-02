import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { Box, Chip, Typography, Paper, TextField } from "@mui/material";

const Analytics = () => {
  const lineChartRef = useRef();
  const barChartRef = useRef();

  const [columns, setColumns] = useState([]); // [{ name, type }]
  const [selectedFields, setSelectedFields] = useState([]);
  const [fieldFilters, setFieldFilters] = useState({});

  // Fetch columns with types
  useEffect(() => {
    fetch("http://localhost:5000/api/task_fields")
      .then((res) => res.json())
      .then((data) => setColumns(data))
      .catch((err) => console.error("Error fetching column names:", err));
  }, []);

  // D3 chart setup
  useEffect(() => {
    drawLineChart();
    drawBarChart();
  }, []);

  // Chip toggle
  const handleFieldToggle = (field) => {
    const alreadySelected = selectedFields.includes(field);
    const updatedFields = alreadySelected ? selectedFields.filter((f) => f !== field) : [...selectedFields, field];

    if (!alreadySelected) {
      setFieldFilters((prev) => ({
        ...prev,
        [field]: {},
      }));
    } else {
      const updatedFilters = { ...fieldFilters };
      delete updatedFilters[field];
      setFieldFilters(updatedFilters);
    }

    setSelectedFields(updatedFields);
  };

  const handleFilterChange = (field, key, value) => {
    setFieldFilters((prev) => ({
      ...prev,
      [field]: {
        ...prev[field],
        [key]: value,
      },
    }));
  };

  // Line chart
  const drawLineChart = () => {
    const svg = d3.select(lineChartRef.current);
    svg.selectAll("*").remove();

    const lineChartData = [
      { date: new Date(2023, 0, 1), value: 10 },
      { date: new Date(2023, 1, 1), value: 20 },
      { date: new Date(2023, 2, 1), value: 15 },
      { date: new Date(2023, 3, 1), value: 25 },
      { date: new Date(2023, 4, 1), value: 30 },
    ];

    const margin = { top: 20, right: 30, bottom: 30, left: 40 };
    const width = 700 - margin.left - margin.right;
    const height = 300 - margin.top - margin.bottom;

    const g = svg
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const x = d3
      .scaleTime()
      .domain(d3.extent(lineChartData, (d) => d.date))
      .range([0, width]);

    const y = d3
      .scaleLinear()
      .domain([0, d3.max(lineChartData, (d) => d.value)])
      .nice()
      .range([height, 0]);

    const line = d3
      .line()
      .x((d) => x(d.date))
      .y((d) => y(d.value));

    g.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x).tickFormat(d3.timeFormat("%b")));

    g.append("g").call(d3.axisLeft(y));

    // Add animated line path
    const path = g.append("path").datum(lineChartData).attr("fill", "none").attr("stroke", "#3498db").attr("stroke-width", 2).attr("d", line);

    const totalLength = path.node().getTotalLength();

    path.attr("stroke-dasharray", totalLength).attr("stroke-dashoffset", totalLength).transition().duration(1500).ease(d3.easeLinear).attr("stroke-dashoffset", 0);

    // Tooltip and hover circle
    const focus = g.append("g").style("display", "none");

    focus.append("circle").attr("r", 5).attr("fill", "white").attr("stroke", "#3498db").attr("stroke-width", 2);

    const tooltip = d3.select(svg.node().parentNode).append("div").style("position", "absolute").style("background", "#333").style("color", "#fff").style("padding", "6px 10px").style("border-radius", "4px").style("font-size", "13px").style("pointer-events", "none").style("opacity", 0);

    svg
      .on("mousemove", function (event) {
        const [mouseX] = d3.pointer(event);
        const x0 = x.invert(mouseX - margin.left);
        const bisectDate = d3.bisector((d) => d.date).left;
        const i = bisectDate(lineChartData, x0, 1);
        const d0 = lineChartData[i - 1];
        const d1 = lineChartData[i] || d0;
        const d = x0 - d0.date > d1.date - x0 ? d1 : d0;

        const cx = x(d.date);
        const cy = y(d.value);

        focus.attr("transform", `translate(${cx},${cy})`);
        focus.style("display", null);

        tooltip
          .style("left", `${event.pageX + 10}px`)
          .style("top", `${event.pageY - 20}px`)
          .style("opacity", 1)
          .html(`<b>${d3.timeFormat("%b %Y")(d.date)}</b><br/>Value: ${d.value}`);
      })
      .on("mouseleave", () => {
        focus.style("display", "none");
        tooltip.style("opacity", 0);
      });
  };

  // Bar chart
  const drawBarChart = () => {
    const svg = d3.select(barChartRef.current);
    svg.selectAll("*").remove();

    const barChartData = [
      { category: "A", count: 40 },
      { category: "B", count: 25 },
      { category: "C", count: 60 },
      { category: "D", count: 35 },
    ];

    const margin = { top: 20, right: 30, bottom: 30, left: 40 };
    const width = 700 - margin.left - margin.right;
    const height = 300 - margin.top - margin.bottom;

    const g = svg
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const x = d3
      .scaleBand()
      .domain(barChartData.map((d) => d.category))
      .range([0, width])
      .padding(0.2);

    const y = d3
      .scaleLinear()
      .domain([0, d3.max(barChartData, (d) => d.count)])
      .nice()
      .range([height, 0]);

    g.append("g").attr("transform", `translate(0,${height})`).call(d3.axisBottom(x));

    g.append("g").call(d3.axisLeft(y));

    const tooltip = d3.select(svg.node().parentNode).append("div").style("position", "absolute").style("background", "#333").style("color", "#fff").style("padding", "6px 10px").style("border-radius", "4px").style("font-size", "13px").style("pointer-events", "none").style("opacity", 0);

    g.selectAll(".bar")
      .data(barChartData)
      .enter()
      .append("rect")
      .attr("x", (d) => x(d.category))
      .attr("y", y(0)) // start from bottom
      .attr("width", x.bandwidth())
      .attr("height", 0) // initial height
      .attr("fill", "#ff9800")
      .on("mouseenter", function (event, d) {
        d3.select(this).attr("fill", "#f57c00");
        tooltip
          .style("left", `${event.pageX + 10}px`)
          .style("top", `${event.pageY - 20}px`)
          .style("opacity", 1)
          .html(`<b>${d.category}</b><br/>Count: ${d.count}`);
      })
      .on("mouseleave", function () {
        d3.select(this).attr("fill", "#ff9800");
        tooltip.style("opacity", 0);
      })
      .transition()
      .duration(1200)
      .ease(d3.easeCubicOut)
      .attr("y", (d) => y(d.count))
      .attr("height", (d) => height - y(d.count));
  };

  // Reusable chips + filters block
  const FieldChips = ({ columns }) => (
    <Box sx={{ display: "flex", gap: 1, mb: 2, flexWrap: "wrap" }}>
      {columns.map((col) => {
        const isSelected = selectedFields.includes(col.name);
        return (
          <Box key={col.name}>
            <Chip
              label={col.name}
              clickable
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
              onClick={() => handleFieldToggle(col.name)}
              onDelete={isSelected ? () => handleFieldToggle(col.name) : undefined}
            />

            {isSelected && (
              <Box sx={{ mt: 1, mb: 2 }}>
                {col.type === "numeric" ? (
                  <Box sx={{ display: "flex", gap: 1 }}>
                    <TextField label="From" type="number" size="small" sx={{ width: 100 }} value={fieldFilters[col.name]?.from || ""} onChange={(e) => handleFilterChange(col.name, "from", e.target.value)} />
                    <TextField label="To" type="number" size="small" sx={{ width: 100 }} value={fieldFilters[col.name]?.to || ""} onChange={(e) => handleFilterChange(col.name, "to", e.target.value)} />
                  </Box>
                ) : (
                  <TextField
                    size="small"
                    placeholder=", separated values"
                    value={fieldFilters[col.name]?.values?.join(", ") || ""}
                    sx={{ width: 200 }}
                    onChange={(e) => {
                      const raw = e.target.value;
                      const parsed = raw
                        .split(",")
                        .map((v) => v.trim())
                        .filter(Boolean);
                      handleFilterChange(col.name, "values", parsed);
                    }}
                  />
                )}
              </Box>
            )}
          </Box>
        );
      })}
    </Box>
  );

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h5" gutterBottom>
        Sample Sales Analysis
      </Typography>

      {/* Line Chart Section */}
      <Paper elevation={3} sx={{ p: 3, mb: 5 }}>
        <Typography variant="h6" gutterBottom>
          Line Chart
        </Typography>
        <FieldChips columns={columns} />
        <svg ref={lineChartRef}></svg>
      </Paper>

      {/* Bar Chart Section */}
      <Paper elevation={3} sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Bar Chart
        </Typography>
        <FieldChips columns={columns} />
        <svg ref={barChartRef}></svg>
      </Paper>
    </Box>
  );
};

export default Analytics;
