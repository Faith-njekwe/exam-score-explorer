# Exam Score Explorer

An interactive data visualisation of student exam scores, built with **D3.js** and **vis.js**.

It explores the [Exam Score Prediction dataset](https://www.kaggle.com/datasets/kundanbedmutha/exam-score-prediction-dataset) by kundanbedmutha on Kaggle (20,000 students), which I originally used for a machine learning project.

## What it shows

- **Bar chart (D3.js):** average exam score for each course.
- **Scatter plots (D3.js):** study hours vs exam score, and class attendance vs exam score. Each includes a trend line and a correlation value (r), and hovering shows the nearest student's details.
- **Network graph (vis.js):** courses and study methods as connected nodes. Line thickness shows how many students are in each pairing, and the label shows their average score.
- **Filters:** narrow everything by gender and study method. All four views update together.

## Run it locally

Serve the folder:

```
python -m http.server 8000
```

Then open http://localhost:8000

## Tech

- [D3.js](https://d3js.org/) v7 for the bar and scatter charts
- [vis-network](https://visjs.github.io/vis-network/) (vis.js) for the network graph
- Plain HTML, CSS and JavaScript, with no build step

## Data

Dataset: [Exam Score Prediction Dataset](https://www.kaggle.com/datasets/kundanbedmutha/exam-score-prediction-dataset) by kundanbedmutha, licensed under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). The data is used unmodified.
