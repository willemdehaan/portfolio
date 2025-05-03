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

  // Initial render
  renderProjects(projects, projectsContainer, 'h2');
  if (titleElement) titleElement.textContent = `${projects.length} Projects`;

  function filterProjects() {
    let result = projects;

    // Apply year filter
    if (selectedIndex !== -1) {
      const selectedYear = pieData[selectedIndex].label;
      result = result.filter(p => p.year === selectedYear);
    }

    // Apply search query filter
    if (query.trim() !== '') {
      result = result.filter(project => {
        let values = Object.values(project).join('\n').toLowerCase();
        return values.includes(query.toLowerCase());
      });
    }

    return result;
  }

  function renderFilteredProjects() {
    const filtered = filterProjects();
    renderProjects(filtered, projectsContainer, 'h2');
    drawPieChart(filtered); // rebuild pie with filtered projects
  }

  function drawPieChart(projectsGiven) {
    const svg = d3.select('#projects-pie-plot');
    svg.selectAll('path').remove();

    const legend = d3.select('.legend');
    legend.selectAll('li').remove();

    const rolledData = d3.rollups(
      projectsGiven,
      v => v.length,
      d => d.year
    );

    pieData = rolledData.map(([year, count]) => ({ label: year, value: count }));

    const colors = d3.scaleOrdinal(d3.schemeTableau10);
    const arcGenerator = d3.arc().innerRadius(0).outerRadius(50);
    const pie = d3.pie().value(d => d.value);
    const arcs = pie(pieData);

    arcs.forEach((arc, i) => {
      svg.append('path')
        .attr('d', arcGenerator(arc))
        .attr('fill', colors(i))
        .attr('data-index', i)
        .attr('class', i === selectedIndex ? 'selected' : '')
        .on('click', () => {
          selectedIndex = selectedIndex === i ? -1 : i;

          renderFilteredProjects();
        });
    });

    pieData.forEach((d, i) => {
      legend.append('li')
        .attr('style', `--color: ${colors(i)}`)
        .attr('class', i === selectedIndex ? 'selected' : '')
        .html(`<span class="swatch"></span> ${d.label} <em>(${d.value})</em>`);
    });
  }

  // Input event for search
  searchInput.addEventListener('input', event => {
    query = event.target.value;
    renderFilteredProjects();
  });

  drawPieChart(projects); // Initial pie render
});

