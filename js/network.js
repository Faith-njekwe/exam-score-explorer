// NETWORK GRAPH (vis.js): draws a web of boxes and lines showing how courses and
// study methods connect. Blue boxes are courses, orange boxes are study methods.
// Every course is joined to every study method by a line. A thicker line means
// more students used that method on that course, and the number on the line is
// those students' average exam score. It's a quick way to spot which
// course + method pairings score well, and unlike the other charts the
// position of the boxes isn't fixed: vis.js arranges them automatically.

let network = null;

function cssVar(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

function networkChart(sel, rows) {
  const container = document.querySelector(sel);
  const course = cssVar("--series-1"), method = cssVar("--series-2"), text = cssVar("--text");

  const counts = d3.rollups(rows, v => ({ n: v.length, mean: d3.mean(v, d => d.exam_score) }),
    d => d.course, d => d.study_method);

  const nodes = new vis.DataSet();
  const edges = new vis.DataSet();
  const seenMethods = new Set();

  for (const [c, methods] of counts) {
    nodes.add({ id: "c:" + c, label: c, color: course, font: { color: "#fff" }, shape: "box" });
    for (const [mth, s] of methods) {
      if (!seenMethods.has(mth)) {
        seenMethods.add(mth);
        nodes.add({ id: "m:" + mth, label: mth, color: method, font: { color: "#fff" }, shape: "box" });
      }
      edges.add({
        from: "c:" + c, to: "m:" + mth,
        width: Math.max(1, s.n / 120),           // thicker = more students
        label: s.mean.toFixed(0),                 // average score on the edge
        font: { size: 10, color: text, strokeWidth: 0, background: cssVar("--surface") },
        color: { color: "#8a8a85", opacity: 0.55 },
        title: `${c} + ${mth}: ${s.n} students, avg ${s.mean.toFixed(1)}`
      });
    }
  }

  if (network) network.destroy();
  network = new vis.Network(container, { nodes, edges }, {
    nodes: { margin: 8, borderWidth: 0 },
    edges: { smooth: false },
    physics: { solver: "forceAtlas2Based", stabilization: { iterations: 150 } },
    interaction: { hover: true, tooltipDelay: 100 }
  });
}
