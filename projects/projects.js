// projects.js

import { fetchJSON, renderProjects } from '../global.js';
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

document.addEventListener('DOMContentLoaded', async () => {
  const projects = await fetchJSON('../lib/projects.json');

  const projectsContainer = document.querySelector('.projects');
  const titleElement = document.querySelector('.projects-title');

  renderProjects(projects, projectsContainer, 'h2');

  // Automatically update project count
  if (titleElement) {
    titleElement.textContent = `${projects.length} Projects`;
  }

// Sample data for pie chart
let data = [1, 2, 3, 4, 5, 5];

// Arc generator (outerRadius = 50, innerRadius = 0 for full pie)
let arcGenerator = d3.arc().innerRadius(0).outerRadius(50);

// Use d3.pie to generate slice angles
let sliceGenerator = d3.pie();
let arcData = sliceGenerator(data);

// Color scale for each slice
let colors = d3.scaleOrdinal(d3.schemeTableau10);

// Select SVG and draw paths for each slice
let svg = d3.select('#projects-pie-plot');

arcData.forEach((d, i) => {
  svg.append('path')
    .attr('d', arcGenerator(d))
    .attr('fill', colors(i));
});
});
