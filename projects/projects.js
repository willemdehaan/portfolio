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

let rolledData = d3.rollups(
  projects,
  (v) => v.length,
  (d) => d.year
);

// Convert rolled data to desired format
let data = rolledData.map(([year, count]) => {
  return { value: count, label: year };
});

// Create color scale
let colors = d3.scaleOrdinal(d3.schemeTableau10);

// Arc generator
let arcGenerator = d3.arc().innerRadius(0).outerRadius(50);

// Slice generator (extracts `value` from data)
let sliceGenerator = d3.pie().value(d => d.value);
let arcData = sliceGenerator(data);

// Add slices to SVG
let svg = d3.select('#projects-pie-plot');
arcData.forEach((d, idx) => {
  svg
    .append('path')
    .attr('d', arcGenerator(d))
    .attr('fill', colors(idx));
});

// Build legend
let legend = d3.select('.legend');
data.forEach((d, idx) => {
  legend
    .append('li')
    .attr('style', `--color: ${colors(idx)}`)
    .html(`<span class="swatch"></span> ${d.label} <em>(${d.value})</em>`);
});
});
