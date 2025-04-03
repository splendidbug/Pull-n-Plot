import * as d3 from "d3";

export const LineChart = (svgRef, data, xField, yField) => {
  const svg = d3.select(svgRef.current);
  svg.selectAll("*").remove();

  console.log("in line chaert: ", data);

  const width = 600;
  const height = 300;
  const margin = { top: 20, right: 30, bottom: 70, left: 70 };
  svg.attr("width", width).attr("height", height);

  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  const chartArea = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

  console.log("in line chart; data:  ", data);

  // Group and average by xField
  const groupedMap = d3.group(data, (d) => +d[xField]);
  const averagedData = Array.from(groupedMap, ([x, values]) => ({
    [xField]: x,
    [yField]: d3.mean(values, (d) => +d[yField]),
  }));
  const sortedData = averagedData.sort((a, b) => d3.ascending(a[xField], b[xField]));

  // Scales
  const xScale = d3
    .scaleLinear()
    .domain(d3.extent(sortedData, (d) => +d[xField]))
    .range([0, innerWidth]);

  const yScale = d3
    .scaleLinear()
    .domain([0, d3.max(sortedData, (d) => +d[yField])])
    .nice()
    .range([innerHeight, 0]);

  // Axes
  chartArea
    .append("g")
    .attr("transform", `translate(0,${innerHeight})`)
    .call(d3.axisBottom(xScale).ticks(6).tickFormat(d3.format("d")))
    .selectAll("text")
    .style("fill", "white");

  chartArea.append("g").call(d3.axisLeft(yScale)).selectAll("text").style("fill", "white");

  // X-axis label
  svg
    .append("text")
    .attr("text-anchor", "middle")
    .attr("x", margin.left + innerWidth / 2)
    .attr("y", height - 10)
    .style("font-size", "12px")
    .style("fill", "white")
    .text(xField);

  // Y-axis label
  svg
    .append("text")
    .attr("text-anchor", "middle")
    .attr("transform", `rotate(-90)`)
    .attr("x", -(margin.top + innerHeight / 2))
    .attr("y", 10)
    .style("font-size", "12px")
    .style("fill", "white")
    .text(yField);

  // Line path
  chartArea
    .append("path")
    .datum(sortedData)
    .attr("fill", "none")
    .attr("stroke", "steelblue")
    .attr("stroke-width", 2)
    .attr(
      "d",
      d3
        .line()
        .x((d) => xScale(+d[xField]))
        .y((d) => yScale(+d[yField]))
    );

  // Dots
  chartArea
    .selectAll(".dot")
    .data(sortedData)
    .enter()
    .append("circle")
    .attr("class", "dot")
    .attr("cx", (d) => xScale(+d[xField]))
    .attr("cy", (d) => yScale(+d[yField]))
    .attr("r", 4)
    .attr("fill", "steelblue");

  // Tooltip
  const tooltip = d3.select("body").append("div").attr("class", "tooltip").style("position", "absolute").style("background", "#fff").style("padding", "6px 8px").style("border", "1px solid #ccc").style("border-radius", "4px").style("pointer-events", "none").style("font-size", "12px").style("color", "#000").style("opacity", 0);

  // Focus circle
  const focusCircle = chartArea.append("circle").attr("r", 5).attr("fill", "orange").style("opacity", 0);

  // Interactivity
  svg.on("mousemove", function (event) {
    const [mouseX] = d3.pointer(event, svg.node());
    const x0 = xScale.invert(mouseX - margin.left);

    const bisect = d3.bisector((d) => d[xField]).left;
    const idx = bisect(sortedData, x0);
    const d0 = sortedData[idx - 1];
    const d1 = sortedData[idx] || d0;
    const d = x0 - d0?.[xField] > d1?.[xField] - x0 ? d1 : d0;

    if (!d) return;

    const x = xScale(d[xField]);
    const y = yScale(d[yField]);

    focusCircle.attr("cx", x).attr("cy", y).style("opacity", 1);

    tooltip
      .style("left", `${event.pageX + 10}px`)
      .style("top", `${event.pageY - 28}px`)
      .style("opacity", 1).html(`
        <strong>${xField}</strong>: ${d[xField]}<br/>
        <strong>${yField}</strong>: ${d3.format(",.2f")(d[yField])}
      `);
  });

  svg.on("mouseleave", () => {
    tooltip.style("opacity", 0);
    focusCircle.style("opacity", 0);
  });
};
