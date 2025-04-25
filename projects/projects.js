// projects.js

import { fetchJSON, renderProjects } from '../global.js';

document.addEventListener('DOMContentLoaded', async () => {
  const projects = await fetchJSON('../lib/projects.json');

  const projectsContainer = document.querySelector('.projects');
  const titleElement = document.querySelector('.projects-title');

  renderProjects(projects, projectsContainer, 'h2');

  // Automatically update project count
  if (titleElement) {
    titleElement.textContent = `${projects.length} Projects`;
  }
});
