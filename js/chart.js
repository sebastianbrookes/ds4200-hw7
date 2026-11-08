// Weekly mileage bar chart, drawn with D3.
// Solid bars = weeks already run. Faded, dashed bars = weeks still planned.

// Chart size in "SVG units". The viewBox makes the chart scale to fit its container.
const width = 680;
const height = 360;
const margin = { top: 56, right: 16, bottom: 48, left: 48 };

// Load the CSV with a RELATIVE path (no leading "/"), so it works both locally and on GitHub Pages.
// d3.autoType turns number-looking text like "14.3" into real numbers.
d3.csv("data/mileage.csv", d3.autoType).then((data) => {
  // --- Scales: turn data values into pixel positions ---

  // x: one evenly spaced band per week
  const x = d3
    .scaleBand()
    .domain(data.map((d) => d.week))
    .range([margin.left, width - margin.right])
    .padding(0.2);

  // y: miles, always starting at 0 so bar lengths are honest
  const y = d3
    .scaleLinear()
    .domain([0, d3.max(data, (d) => d.miles)])
    .nice()
    .range([height - margin.bottom, margin.top]);

  // --- The SVG canvas ---
  const svg = d3
    .select("#chart")
    .append("svg")
    .attr("viewBox", [0, 0, width, height])
    .attr("role", "img")
    .attr("aria-label", "Bar chart of miles run per week, weeks 1 to 15");

  // --- Axes ---
  svg
    .append("g")
    .attr("class", "axis")
    .attr("transform", `translate(0, ${height - margin.bottom})`)
    .call(d3.axisBottom(x).tickFormat((w) => `Wk ${w}`).tickSizeOuter(0));

  svg
    .append("g")
    .attr("class", "axis")
    .attr("transform", `translate(${margin.left}, 0)`)
    .call(d3.axisLeft(y).ticks(5));

  // Axis titles
  svg
    .append("text")
    .attr("class", "axis-title")
    .attr("x", (margin.left + width - margin.right) / 2)
    .attr("y", height - 8)
    .attr("text-anchor", "middle")
    .text("Week of training cycle");

  svg
    .append("text")
    .attr("class", "axis-title")
    .attr("x", margin.left)
    .attr("y", margin.top - 14)
    .attr("text-anchor", "middle")
    .text("Miles");

  // --- Tooltip: a plain HTML div we move around and fill with text ---
  const tooltip = d3.select("body").append("div").attr("class", "tooltip");

  // --- Bars: one rect per row of data ---
  svg
    .append("g")
    .selectAll("rect")
    .data(data)
    .join("rect")
    // class "ran" or "planned" decides the styling in style.css
    .attr("class", (d) => `bar ${d.status}`)
    .attr("x", (d) => x(d.week))
    .attr("width", x.bandwidth())
    .attr("y", (d) => y(d.miles))
    .attr("height", (d) => y(0) - y(d.miles))
    .attr("rx", 2)
    // Show the tooltip when the mouse is over a bar
    .on("mouseenter", (event, d) => {
      const amount =
        d.status === "ran" ? `${d.miles} mi run` : `~${d.miles} mi planned`;
      tooltip
        .style("opacity", 1)
        .html(
          `<strong>Week ${d.week}</strong> · from ${d.start}<br>${amount}<br>${d.note}`
        );
    })
    // Keep the tooltip next to the mouse as it moves
    .on("mousemove", (event) => {
      // Near the right edge of the screen, show the tooltip on the LEFT of the mouse instead
      const tipWidth = tooltip.node().offsetWidth;
      const nearRightEdge = event.clientX + 14 + tipWidth > window.innerWidth;
      const left = nearRightEdge ? event.pageX - 14 - tipWidth : event.pageX + 14;
      tooltip.style("left", `${left}px`).style("top", `${event.pageY - 10}px`);
    })
    .on("mouseleave", () => tooltip.style("opacity", 0));

  // --- Text labels above the few bars that have one (sick, time trial, race) ---
  // A "|" in the label means "start a new line", so long labels stay as narrow as their bar.
  svg
    .append("g")
    .selectAll("text")
    .data(data.filter((d) => d.label))
    .join("text")
    .attr("class", "bar-label")
    .attr("text-anchor", "middle")
    .each(function (d) {
      const lines = d.label.split("|");
      const cx = x(d.week) + x.bandwidth() / 2;
      lines.forEach((line, i) => {
        d3.select(this)
          .append("tspan")
          .attr("x", cx)
          // stack lines upward so the last line sits just above the bar
          .attr("y", y(d.miles) - 8 - (lines.length - 1 - i) * 14)
          .text(line);
      });
    });

  // --- Legend: a small box in the top-left corner ---
  const legend = svg
    .append("g")
    .attr("transform", `translate(${margin.left + 40}, 14)`);

  const items = [
    { status: "ran", text: "Ran" },
    { status: "planned", text: "Planned" },
  ];

  items.forEach((item, i) => {
    const row = legend.append("g").attr("transform", `translate(${i * 90}, 0)`);
    row
      .append("rect")
      .attr("class", `bar ${item.status}`)
      .attr("width", 14)
      .attr("height", 14)
      .attr("rx", 2);
    row
      .append("text")
      .attr("x", 20)
      .attr("y", 11)
      .attr("class", "legend-text")
      .text(item.text);
  });
});
