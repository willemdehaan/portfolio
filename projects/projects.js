// projects.js

import { fetchJSON, renderProjects } from '../global.js';
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

document.addEventListener('DOMContentLoaded', async () => {
  const projects = await fetchJSON('../lib/projects.json');

  const projectsContainer = document.querySelector('.projects');
  const titleElement = document.querySelector('.projects-title');
  let query = '';

  renderProjects(projects, projectsContainer, 'h2');

  // Automatically update project count
  if (titleElement) {
    titleElement.textContent = `${projects.length} Projects`;
  }

function renderPieChart(projectsGiven) {
  d3.select('svg').selectAll('path').remove();
  d3.select('.legend').selectAll('li').remove();
  let rolledData = d3.rollups(
    projectsGiven,
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
}

function filterProjects(queryText) {
  return projects.filter((project) => {
    let values = Object.values(project).join('\n').toLowerCase();
    return values.includes(queryText.toLowerCase());
  });
}

// Initial render
renderPieChart(projects);

// Add search interactivity
let searchInput = document.querySelector('.searchBar');
searchInput.addEventListener('input', (event) => {
  query = event.target.value;
  let filtered = filterProjects(query);
  renderPieChart(filtered);
});
});
