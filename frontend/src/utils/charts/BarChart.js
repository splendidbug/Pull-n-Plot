import * as d3 from "d3";

export const BarChart = (svgRef, data, xField, yField) => {
  const svg = d3.select(svgRef.current);
  svg.selectAll("*").remove();

  const width = 600;
  const height = 300;
  const margin = { top: 20, right: 30, bottom: 80, left: 80 };

  svg.attr("width", width).attr("height", height);

  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  const chartArea = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

  // Group and average if needed (for repeated xField values)
  const grouped = d3.group(data, (d) => d[xField]);
  const averagedData = Array.from(grouped, ([key, values]) => {
    const avg = d3.mean(values, (d) => +d[yField]);
    return isNaN(avg) ? null : { [xField]: key, [yField]: avg };
  }).filter(Boolean);

  const xScale = d3
    .scaleBand()
    .domain(averagedData.map((d) => d[xField]))
    .range([0, innerWidth])
    .padding(0.2);

  const yScale = d3
    .scaleLinear()
    .domain([0, d3.max(averagedData, (d) => +d[yField])])
    .nice()
    .range([innerHeight, 0]);

  // Axes
  chartArea.append("g").attr("transform", `translate(0,${innerHeight})`).call(d3.axisBottom(xScale)).selectAll("text").attr("transform", "rotate(-40)").style("text-anchor", "end").style("fill", "white");

  chartArea.append("g").call(d3.axisLeft(yScale)).selectAll("text").style("fill", "white");

  // X Axis Label
  svg
    .append("text")
    .attr("x", margin.left + innerWidth / 2)
    .attr("y", height + 0)
    .attr("text-anchor", "middle")
    .style("fill", "white")
    .style("font-size", "12px")
    .text(xField);

  // Y Axis Label
  svg
    .append("text")
    .attr("transform", "rotate(-90)")
    .attr("x", -(margin.top + innerHeight / 2))
    .attr("y", 10)
    .attr("text-anchor", "middle")
    .style("fill", "white")
    .style("font-size", "12px")
    .text(yField);

  // Bars
  chartArea
    .selectAll(".bar")
    .data(averagedData)
    .enter()
    .append("rect")
    .attr("class", "bar")
    .attr("x", (d) => xScale(d[xField]))
    .attr("y", (d) => yScale(+d[yField]))
    .attr("width", xScale.bandwidth())
    .attr("height", (d) => innerHeight - yScale(+d[yField]))
    .attr("fill", "steelblue");

  // Tooltip
  const tooltip = d3.select("body").append("div").attr("class", "tooltip").style("position", "absolute").style("background", "#fff").style("color", "#000").style("padding", "6px 8px").style("border", "1px solid #ccc").style("border-radius", "4px").style("pointer-events", "none").style("font-size", "12px").style("opacity", 0);

  chartArea
    .selectAll(".bar")
    .on("mousemove", function (event, d) {
      d3.select(this).attr("fill", "#2a9df4");
      tooltip
        .style("left", `${event.pageX + 10}px`)
        .style("top", `${event.pageY - 28}px`)
        .style("opacity", 1).html(`
          <strong>${xField}:</strong> ${d[xField]}<br/>
          <strong>${yField}:</strong> ${d3.format(",.2f")(d[yField])}
        `);
    })
    .on("mouseleave", function () {
      d3.select(this).attr("fill", "steelblue");
      tooltip.style("opacity", 0);
    });
};
