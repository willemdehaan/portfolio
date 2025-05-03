// projects.js

import { fetchJSON, renderProjects } from '../global.js';
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

document.addEventListener('DOMContentLoaded', async () => {
  const projects = await fetchJSON('../lib/projects.json');

  const projectsContainer = document.querySelector('.projects');
  const titleElement = document.querySelector('.projects-title');
  const searchInput = document.querySelector('.searchBar');

  let query = '';
  let selectedIndex = -1;
  let pieData = [];

  const svg = d3.select('#projects-pie-plot');
  const legend = d3.select('.legend');
  const colors = d3.scaleOrdinal(d3.schemeTableau10);

  // Initial project render
  renderProjects(projects, projectsContainer, 'h2');
  if (titleElement) titleElement.textContent = `${projects.length} Projects`;

  function filterProjects() {
    const selectedYear = selectedIndex !== -1 ? pieData[selectedIndex].label : null;

    return projects.filter(p => {
      const matchesYear = selectedYear ? p.year === selectedYear : true;
      const matchesQuery = query.trim() === ''
        || Object.values(p).join('\n').toLowerCase().includes(query.toLowerCase());
      return matchesYear && matchesQuery;
    });
  }

  function renderFilteredProjects() {
    const filtered = filterProjects();
    renderProjects(filtered, projectsContainer, 'h2');
    updatePieChart(); // redraw pie from full data, not filtered
  }

  function updatePieChart() {
    // Recalculate pieData based on all projects
    const rolledData = d3.rollups(projects, v => v.length, d => d.year);
    pieData = rolledData.map(([year, count]) => ({ label: year, value: count }));

    const pie = d3.pie().value(d => d.value);
    const arcGenerator = d3.arc().innerRadius(0).outerRadius(50);
    const arcs = pie(pieData);

    // Clear previous pie chart
    svg.selectAll('path').remove();

    arcs.forEach((arc, i) => {
      svg.append('path')
        .attr('d', arcGenerator(arc))
        .attr('fill', selectedIndex === i ? 'oklch(60% 45% 0)' : colors(i))
        .attr('data-index', i)
        .attr('class', i === selectedIndex ? 'selected' : '')
        .style('cursor', 'pointer')
        .on('click', () => {
          selectedIndex = selectedIndex === i ? -1 : i;
          renderFilteredProjects();
        });
    });

    // Update legend
    legend.selectAll('li').remove();
    pieData.forEach((d, i) => {
      legend.append('li')
        .attr('style', `--color: ${colors(i)}`)
        .attr('class', i === selectedIndex ? 'selected' : '')
        .html(`<span class="swatch"></span> ${d.label} <em>(${d.value})</em>`)
        .on('click', () => {
          selectedIndex = selectedIndex === i ? -1 : i;
          renderFilteredProjects();
        });
    });
  }

  // Search input listener
  searchInput.addEventListener('input', e => {
    query = e.target.value;
    renderFilteredProjects();
  });

  updatePieChart(); // initial pie render
});

