// index.js

import { fetchJSON, renderProjects, fetchGitHubData } from './global.js';

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

    // Fetch GitHub profile data
    const githubData = await fetchGitHubData('willemdehaan'); // << Replace with your GitHub username
    const profileStats = document.querySelector('#profile-stats');

    // Render GitHub stats
    if (profileStats) {
      profileStats.innerHTML = `
        <dl>
          <dt>Public Repos:</dt><dd>${githubData.public_repos}</dd>
          <dt>Public Gists:</dt><dd>${githubData.public_gists}</dd>
          <dt>Followers:</dt><dd>${githubData.followers}</dd>
          <dt>Following:</dt><dd>${githubData.following}</dd>
        </dl>
      `;
    }
  } catch (error) {
    console.error('Failed to load latest projects:', error);
  }
});
