import * as d3 from "d3";

export const PieChart = (svgRef, data, xField, yField = null) => {
  const svg = d3.select(svgRef.current);
  svg.selectAll("*").remove();

  const width = 600;
  const height = 500;
  const radius = Math.min(width, height) / 2 - 40;

  svg.attr("width", width).attr("height", height).attr("viewBox", `0 0 ${width} ${height}`).attr("preserveAspectRatio", "xMidYMid meet");

  const chartArea = svg.append("g").attr("transform", `translate(${width / 2},${height / 2})`);

  // --- Tooltip ---
  let tooltip = d3.select("body").select(".tooltip");
  if (tooltip.empty()) {
    tooltip = d3.select("body").append("div").attr("class", "tooltip").style("position", "absolute").style("background", "#fff").style("padding", "10px 12px").style("border", "1px solid #ddd").style("border-radius", "8px").style("box-shadow", "0 4px 12px rgba(0,0,0,0.1)").style("pointer-events", "none").style("font-family", "sans-serif").style("font-size", "13px").style("color", "#000").style("opacity", 0).style("transition", "opacity 0.2s ease");
  }

  // --- Aggregate data ---
  const grouped = d3.group(data, (d) => d[xField]);
  const rawCounts = Array.from(grouped, ([label, values]) => ({
    label,
    value: yField ? d3.sum(values, (d) => +d[yField]) : values.length,
  }));

  const totalValue = d3.sum(rawCounts, (d) => d.value);

  const major = [];
  const minor = [];

  rawCounts.forEach((d) => {
    const pct = (d.value / totalValue) * 100;
    if (pct <= 2) {
      minor.push({ ...d, percentage: pct });
    } else {
      major.push(d);
    }
  });

  if (minor.length > 0) {
    major.push({
      label: "Others",
      value: d3.sum(minor, (d) => d.value),
      isOther: true,
      breakdown: minor,
    });
  }

  const pie = d3
    .pie()
    .value((d) => d.value)
    .sort(null);
  const arcs = pie(major);

  const arc = d3
    .arc()
    .innerRadius(radius * 0.4)
    .outerRadius(radius * 0.8);
  const outerArc = d3
    .arc()
    .innerRadius(radius * 0.9)
    .outerRadius(radius * 0.9);

  const colorScale = d3
    .scaleSequential()
    .domain([0, major.length - 1]) // index-based mapping
    .interpolator(d3.interpolateWarm);

  // --- Slices with interactivity ---
  chartArea
    .append("g")
    .attr("class", "slices")
    .selectAll("path")
    .data(arcs)
    .join("path")
    .attr("class", "slice")
    .attr("d", arc)
    .attr("fill", (_, i) => colorScale(i))

    .attr("stroke", "white")
    .attr("stroke-width", 1)
    .on("mousemove", function (event, d) {
      const [x, y] = arc.centroid(d);
      const offset = 10;
      d3.select(this)
        .attr("transform", `translate(${(x * offset) / radius}, ${(y * offset) / radius}) scale(1.05)`)
        .attr("opacity", 0.85);

      const pct = ((d.data.value / totalValue) * 100).toFixed(1);
      const labelPrefix = yField ? "sum" : "count";

      let html = `<strong>${xField}:</strong> ${d.data.label}<br/>
                  ${labelPrefix}: ${d.data.value} (${pct}%)`;

      if (d.data.isOther && d.data.breakdown) {
        html += `<br/><br/><u>Includes:</u><br/>`;
        d.data.breakdown.forEach((item) => {
          html += `${item.label}: ${item.value} (${item.percentage.toFixed(1)}%)<br/>`;
        });
      }

      tooltip
        .style("left", `${event.pageX + 10}px`)
        .style("top", `${event.pageY - 28}px`)
        .style("opacity", 1)
        .html(html);
    })
    .on("mouseleave", function () {
      d3.select(this).attr("transform", "translate(0,0) scale(1)").attr("opacity", 1);
      tooltip.style("opacity", 0);
    });

  // --- Connector lines ---
  const edgeArc = d3
    .arc()
    .innerRadius(radius * 0.8) // same as outerRadius of arc
    .outerRadius(radius * 0.8); // edge of the slice

  chartArea
    .append("g")
    .attr("class", "lines")
    .selectAll("polyline")
    .data(arcs)
    .join("polyline")
    .attr("stroke", "white")
    .attr("stroke-width", 1)
    .attr("fill", "none")
    .attr("points", (d) => {
      const posA = edgeArc.centroid(d); // edge of slice

      const posB = outerArc.centroid(d);
      const posC = outerArc.centroid(d);
      const midAngle = (d.startAngle + d.endAngle) / 2;
      posC[0] = radius * 0.95 * (midAngle < Math.PI ? 1 : -1);
      return [posA, posB, posC];
    });

  // --- Outside labels ---
  chartArea
    .append("g")
    .attr("class", "labels")
    .selectAll("text")
    .data(arcs)
    .join("text")
    .attr("dy", "0.35em")
    .style("font-size", "13px")
    .style("font-family", "sans-serif")
    .style("fill", "white")
    .attr("transform", (d) => {
      const pos = outerArc.centroid(d);
      const midAngle = (d.startAngle + d.endAngle) / 2;
      pos[0] = radius * 1.05 * (midAngle < Math.PI ? 1 : -1);
      return `translate(${pos})`;
    })
    .attr("text-anchor", (d) => ((d.startAngle + d.endAngle) / 2 < Math.PI ? "start" : "end"))
    .text((d) => `${d.data.label}`);

  // --- Chart Title ---
  svg
    .append("text")
    .attr("x", width / 2)
    .attr("y", 30)
    .attr("text-anchor", "middle")
    .style("font-size", "18px")
    .style("font-family", "sans-serif")
    .style("fill", "white")
    .text(`Distribution by ${xField}`);
};
