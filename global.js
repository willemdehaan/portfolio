function $$(selector, context = document) {
  return Array.from(context.querySelectorAll(selector));
}

document.addEventListener("DOMContentLoaded", () => {
    const header = document.querySelector(".resume-header");

    console.log(header);

// Step 3.1: Navigation menu setup
const BASE_PATH = (location.hostname === "localhost" || location.hostname === "127.0.0.1")
  ? "/"                  // Local server
  : "/portfolio/";         // GitHub Pages repo name

let pages = [
  { url: '', title: 'Home' },
  { url: 'projects/', title: 'Projects' },
  { url: 'resume/', title: 'Resume' },
  { url: 'contacts/', title: 'Contact' },
  { url: 'https://github.com/willemdehaan', title: 'GitHub' },
];

let nav = document.createElement('nav');
document.body.prepend(nav);

for (let p of pages) {
  let url = p.url;
  let title = p.title;

  // Add base path to internal links
  url = !url.startsWith('http') ? BASE_PATH + url : url;

  let a = document.createElement('a');
  a.href = url;
  a.textContent = title;

  // Highlight current page
  a.classList.toggle(
    'current',
    a.host === location.host && a.pathname === location.pathname,
  );

  // Open external links in new tab
  a.toggleAttribute('target', a.host !== location.host);

  nav.append(a);
}
if (header) header.prepend(nav);

// Create the dropdown for theme selection
let colorSchemeSelector = `
  <label class="color-scheme">
    Theme:
    <select>
      <option value="light dark">Automatic</option>
      <option value="light">Light</option>
      <option value="dark">Dark</option>
    </select>
  </label>
`;


  document.body.insertAdjacentHTML('afterbegin', colorSchemeSelector);
  
  // Grab the select element
  const select = document.querySelector('.color-scheme select');
  
  // Function to set the color scheme on the root element
  function setColorScheme(scheme) {
    document.documentElement.style.setProperty('color-scheme', scheme);
  }
  
  // Apply saved preference on page load
  if ("colorScheme" in localStorage) {
    const savedScheme = localStorage.colorScheme;
    setColorScheme(savedScheme);
    select.value = savedScheme;
  }
  
  // Handle user changes
  select.addEventListener('input', function (event) {
    const newScheme = event.target.value;
    setColorScheme(newScheme);
    localStorage.colorScheme = newScheme;
  });


  if (!document.body.classList.contains("resume")) return;

  const slides = Array.from(document.querySelectorAll("main.slideshow section"));
  const prev = document.getElementById("prev");
  const next = document.getElementById("next");

  if (!slides.length || !prev || !next) return;

  let current = 0;

  function showSlide(i) {
    slides.forEach((slide, idx) => {
      slide.classList.toggle("active", idx === i);
    });
  }

  prev.addEventListener("click", () => {
    current = (current - 1 + slides.length) % slides.length;
    showSlide(current);
  });

  next.addEventListener("click", () => {
    current = (current + 1) % slides.length;
    showSlide(current);
  });

  showSlide(current);
});

export async function fetchJSON(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch projects: ${response.statusText}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching or parsing JSON data:', error);
    return [];
  }
}

// Render Projects utility
export function renderProjects(projects, containerElement, headingLevel = 'h2') {
  if (!containerElement || !Array.isArray(projects)) {
    console.warn('Invalid container element or project data');
    return;
  }

  containerElement.innerHTML = ''; // Clear previous content

  if (projects.length === 0) {
    containerElement.innerHTML = '<p>No projects found.</p>';
    return;
  }

  for (const project of projects) {
    const article = document.createElement('article');
    const safeHeading = /^h[1-6]$/.test(headingLevel) ? headingLevel : 'h2';

    article.innerHTML = `
      <${safeHeading}>${project.title || 'Untitled Project'}</${safeHeading}>
      ${project.image ? `<img src="${project.image}" alt="${project.title || 'Project Image'}">` : ''}
      <p>${project.description || 'No description available.'}</p>
    `;

    containerElement.appendChild(article);
  }
}