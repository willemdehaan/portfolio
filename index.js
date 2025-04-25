// index.js

import { fetchJSON, renderProjects } from './global.js';

document.addEventListener('DOMContentLoaded', async () => {
  try {
    // Fetch all project data
    const projects = await fetchJSON('./lib/projects.json');

    // Get the first 3 projects
    const latestProjects = projects.slice(0, 3);

    // Select the container on the homepage
    const projectsContainer = document.querySelector('.projects');

    // Render them if the container exists
    if (projectsContainer) {
      renderProjects(latestProjects, projectsContainer, 'h2');
    } else {
      console.warn('No .projects container found on the homepage.');
    }
  } catch (error) {
    console.error('Failed to load latest projects:', error);
  }
});
