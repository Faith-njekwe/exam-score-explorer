// Entry point: load CSV, wire up filters, redraw everything on change.

const COLOR = () => getComputedStyle(document.documentElement).getPropertyValue("--series-1").trim();
let allRows = [];

// d3.csv fetches + parses; the accessor converts numeric columns from strings
d3.csv("data/Exam_Score_Prediction.csv", d => ({
  ...d,
  age: +d.age,
  study_hours: +d.study_hours,
  class_attendance: +d.class_attendance,
  sleep_hours: +d.sleep_hours,
  exam_score: +d.exam_score
})).then(rows => {
  allRows = rows;
  fillSelect("#f-gender", rows, "gender");
  fillSelect("#f-method", rows, "study_method");
  d3.selectAll(".filters select").on("change", render);
  render();
}).catch(err => {
  d3.select("main").html("").append("p")
    .text("Could not load data/Exam_Score_Prediction.csv — run this from a local web server (see README). " + err.message);
});

function fillSelect(sel, rows, key) {
  const values = Array.from(new Set(rows.map(d => d[key]))).sort();
  d3.select(sel).selectAll("option").data(["All", ...values]).join("option")
    .attr("value", d => d).text(d => d);
}

function filtered() {
  const g = document.querySelector("#f-gender").value;
  const m = document.querySelector("#f-method").value;
  return allRows.filter(d => (g === "All" || d.gender === g) && (m === "All" || d.study_method === m));
}

function render() {
  const rows = filtered();
  d3.select("#count").text(`${rows.length.toLocaleString()} of ${allRows.length.toLocaleString()} students`);
  const color = COLOR();

  barChart("#chart-course", rows, { category: "course", color });
  scatterChart("#chart-hours", rows, { xKey: "study_hours", xLabel: "Study hours / day", color });
  scatterChart("#chart-attendance", rows, { xKey: "class_attendance", xLabel: "Class attendance (%)", color });
  networkChart("#network", rows);
}

// Re-render if the OS flips light/dark so colours stay in sync
matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => allRows.length && render());
