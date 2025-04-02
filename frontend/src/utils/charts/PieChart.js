import * as d3 from "d3";

export const PieChart = (svgRef, data, xField, yField = null) => {
  const svg = d3.select(svgRef.current);
  svg.selectAll("*").remove();

  const width = 500;
  const height = 500;
  const radius = Math.min(width, height) / 2 - 40;

  svg.attr("width", width).attr("height", height);

  const chartArea = svg.append("g").attr("transform", `translate(${width / 2},${height / 2})`);

  // --- STEP 1: Aggregate data ---
  const grouped = d3.group(data, (d) => d[xField]);

  const rawCounts = Array.from(grouped, ([key, values]) => ({
    label: key,
    value: yField ? d3.sum(values, (d) => +d[yField]) : values.length,
  }));

  const totalValue = d3.sum(rawCounts, (d) => d.value);

  // --- STEP 2: Separate major & minor slices ---
  const major = [];
  const otherItems = [];

  rawCounts.forEach((d) => {
    const percentage = (d.value / totalValue) * 100;
    if (percentage <= 2) {
      otherItems.push({ ...d, percentage });
    } else {
      major.push(d);
    }
  });

  // --- STEP 3: Add "Other" slice if needed ---
  if (otherItems.length > 0) {
    const otherValue = d3.sum(otherItems, (d) => d.value);
    major.push({
      label: "Other",
      value: otherValue,
      isOther: true,
      breakdown: otherItems,
    });
  }

  // --- D3 Pie Setup ---
  const color = d3.scaleOrdinal(d3.schemeCategory10);
  const pie = d3.pie().value((d) => d.value);
  const arcGen = d3.arc().innerRadius(0).outerRadius(radius);
  const arcs = pie(major);

  // --- Tooltip ---
  const tooltip = d3.select("body").append("div").attr("class", "tooltip").style("position", "absolute").style("background", "#fff").style("padding", "6px 8px").style("border", "1px solid #ccc").style("border-radius", "4px").style("pointer-events", "none").style("font-size", "12px").style("color", "#000").style("opacity", 0);

  // --- Render Pie Slices ---
  chartArea
    .selectAll("path")
    .data(arcs)
    .join("path")
    .attr("d", arcGen)
    .attr("fill", (d) => color(d.data.label))
    .attr("stroke", "#fff")
    .attr("stroke-width", 1)
    .on("mousemove", function (event, d) {
      d3.select(this).attr("opacity", 0.7);

      let tooltipHtml = `<strong>${d.data.label}</strong><br/>${d.data.value} (${Math.round((d.data.value / totalValue) * 100)}%)`;

      if (d.data.isOther) {
        tooltipHtml += `<br/><br/><u>Includes:</u><br/>`;
        d.data.breakdown.forEach((item) => {
          tooltipHtml += `${item.label}: ${item.value} (${item.percentage.toFixed(1)}%)<br/>`;
        });
      }

      tooltip
        .style("left", `${event.pageX + 10}px`)
        .style("top", `${event.pageY - 28}px`)
        .style("opacity", 1)
        .html(tooltipHtml);
    })
    .on("mouseleave", function () {
      d3.select(this).attr("opacity", 1);
      tooltip.style("opacity", 0);
    });

  // --- Labels ---
  chartArea
    .selectAll("text")
    .data(arcs)
    .join("text")
    .attr("transform", (d) => `translate(${arcGen.centroid(d)})`)
    .attr("text-anchor", "middle")
    .style("font-size", "12px")
    .style("fill", "white")
    .text((d) => d.data.label);

  // --- Title ---
  svg
    .append("text")
    .attr("x", width / 2)
    .attr("y", 20)
    .attr("text-anchor", "middle")
    .style("font-size", "14px")
    .style("fill", "white")
    .text(`Distribution by ${xField}`);
};
