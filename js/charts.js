// Chart functions for the Exam Score Explorer. Each one draws a single chart
// into a container on the page (e.g. "#chart-course") from an array of student
// rows. They wipe and redraw the chart from scratch every time they're called,
// which is how the gender and study-method filters update everything.

const tip = d3.select("#tooltip");

function showTip(event, valueText, labelText) {
  // textContent (not innerHTML): labels come from CSV data, so never trust them as HTML
  tip.html("");
  tip.append("b").text(valueText);
  tip.append("span").text(labelText);
  tip.style("opacity", 1)
     .style("left", event.clientX + 14 + "px")
     .style("top", event.clientY + 14 + "px");
}
const hideTip = () => tip.style("opacity", 0);

// Create (or clear) an <svg> that scales with its container via viewBox
function makeSvg(sel, width, height) {
  const root = d3.select(sel);
  root.selectAll("*").remove();
  return root.append("svg")
    .attr("viewBox", `0 0 ${width} ${height}`)
    .attr("width", "100%")
    .attr("role", "img");
}

/*  1.  BAR CHART: shows the average exam score for each category as a horizontal bar, sorted highest to lowest. */
function barChart(sel, rows, { category, value = "exam_score", color }) {
  const W = 520, H = 320, m = { top: 8, right: 48, bottom: 28, left: 70 };
  const svg = makeSvg(sel, W, H);

  // d3.rollups -> group by course (category), computes the mean score and studentcount, then sort by mean descending
  const data = d3.rollups(
    rows,
    v => ({ mean: d3.mean(v, d => d[value]), n: v.length }),
    d => d[category]
  ).sort((a, b) => b[1].mean - a[1].mean);

  // Scales map data values -> pixel positions
  const y = d3.scaleBand().domain(data.map(d => d[0])).range([m.top, H - m.bottom]).padding(0.3);
  const x = d3.scaleLinear().domain([0, 100]).range([m.left, W - m.right]); // bars start at 0

  // Gridlines + axes
  svg.append("g").attr("class", "grid").attr("transform", `translate(0,${H - m.bottom})`)
    .call(d3.axisBottom(x).ticks(5).tickSize(-(H - m.top - m.bottom)).tickFormat(""));
  svg.append("g").attr("class", "axis").attr("transform", `translate(0,${H - m.bottom})`)
    .call(d3.axisBottom(x).ticks(5).tickSize(0).tickPadding(8));
  svg.append("g").attr("class", "axis").attr("transform", `translate(${m.left},0)`)
    .call(d3.axisLeft(y).tickSize(0).tickPadding(8));

  // Draw one rectangle per course. Each bar's length is its average score
  svg.append("g").selectAll("rect").data(data).join("rect")
    .attr("x", x(0)).attr("y", d => y(d[0]))
    .attr("height", y.bandwidth()).attr("rx", 4)
    .attr("width", 0)
    .attr("fill", color)
    .on("pointermove", (e, d) => showTip(e, d[1].mean.toFixed(1), `${d[0]} · ${d[1].n.toLocaleString()} students`))
    .on("pointerleave", hideTip)
    .transition().duration(500).attr("width", d => x(d[1].mean) - x(0));

  // Value labels (average scores) at the end of each bar
  svg.append("g").selectAll("text").data(data).join("text")
    .attr("x", d => x(d[1].mean) + 6).attr("y", d => y(d[0]) + y.bandwidth() / 2)
    .attr("dy", "0.35em").style("fill", "var(--text)").text(d => d[1].mean.toFixed(1));
}

/* 2. Scatter plot + linear trend line */
function scatterChart(sel, rows, { xKey, yKey = "exam_score", xLabel, color, maxPoints = 1500 }) {
  const W = 520, H = 320, m = { top: 10, right: 16, bottom: 44, left: 48 };
  const svg = makeSvg(sel, W, H);
  if (rows.length < 2) return;

/* Drawing all 20,000 dots would make the page slow, so only a random sample of
  up to 1,500 is drawn. Shuffling first means the sample isn't biased towards
  the top of the file. */
  const pts = rows.length > maxPoints ? d3.shuffle(rows.slice()).slice(0, maxPoints) : rows;

  const x = d3.scaleLinear().domain(d3.extent(rows, d => d[xKey])).nice().range([m.left, W - m.right]);
  const y = d3.scaleLinear().domain([0, 100]).range([H - m.bottom, m.top]);

  svg.append("g").attr("class", "grid").attr("transform", `translate(${m.left},0)`)
    .call(d3.axisLeft(y).ticks(5).tickSize(-(W - m.left - m.right)).tickFormat(""));
  svg.append("g").attr("class", "axis").attr("transform", `translate(0,${H - m.bottom})`)
    .call(d3.axisBottom(x).ticks(6).tickSize(0).tickPadding(8));
  svg.append("g").attr("class", "axis").attr("transform", `translate(${m.left},0)`)
    .call(d3.axisLeft(y).ticks(5).tickSize(0).tickPadding(8));
  svg.append("text").attr("class", "axis-title").attr("x", (m.left + W - m.right) / 2)
    .attr("y", H - 6).attr("text-anchor", "middle").text(xLabel);
  svg.append("text").attr("class", "axis-title").attr("transform", "rotate(-90)")
    .attr("x", -(m.top + H - m.bottom) / 2).attr("y", 12).attr("text-anchor", "middle").text("Exam score");

  // Points: translucent so overlapping dots read as density
  svg.append("g").selectAll("circle").data(pts).join("circle")
    .attr("cx", d => x(d[xKey])).attr("cy", d => y(d[yKey]))
    .attr("r", 2.5).attr("fill", color).attr("fill-opacity", 0.3);

  // Least-squares trend line
  const mx = d3.mean(rows, d => d[xKey]), my = d3.mean(rows, d => d[yKey]);
  const slope = d3.sum(rows, d => (d[xKey] - mx) * (d[yKey] - my)) / d3.sum(rows, d => (d[xKey] - mx) ** 2);
  const icpt = my - slope * mx;
  const [x0, x1] = x.domain();
  svg.append("line").attr("x1", x(x0)).attr("x2", x(x1))
    .attr("y1", y(icpt + slope * x0)).attr("y2", y(icpt + slope * x1))
    .attr("stroke", "var(--text)").attr("stroke-width", 2);

  // Correlation shown directly on the chart
  const r = d3.sum(rows, d => (d[xKey] - mx) * (d[yKey] - my)) /
    Math.sqrt(d3.sum(rows, d => (d[xKey] - mx) ** 2) * d3.sum(rows, d => (d[yKey] - my) ** 2));
  svg.append("text").attr("x", W - m.right - 4).attr("y", m.top + 14).attr("text-anchor", "end")
    .style("fill", "var(--text)").text(`r = ${r.toFixed(2)} · +${slope.toFixed(2)} pts per unit`);

  // Hover: a Delaunay triangulation finds the nearest point to the cursor, so the
  // hit target is effectively the whole plot rather than a 5px dot.
  const delaunay = d3.Delaunay.from(pts, d => x(d[xKey]), d => y(d[yKey]));
  const focus = svg.append("circle").attr("r", 5).attr("fill", "none")
    .attr("stroke", "var(--text)").attr("stroke-width", 2).style("display", "none");
  svg.append("rect").attr("x", m.left).attr("y", m.top)
    .attr("width", W - m.left - m.right).attr("height", H - m.top - m.bottom)
    .attr("fill", "transparent")
    .on("pointermove", e => {
      const [px, py] = d3.pointer(e);
      const d = pts[delaunay.find(px, py)];
      focus.style("display", null).attr("cx", x(d[xKey])).attr("cy", y(d[yKey]));
      showTip(e, `${d[yKey]} pts`, `${xLabel}: ${d[xKey]} · ${d.course} · ${d.study_method}`);
    })
    .on("pointerleave", () => { focus.style("display", "none"); hideTip(); });
}
