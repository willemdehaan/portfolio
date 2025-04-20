function $$(selector, context = document) {
    return Array.from(context.querySelectorAll(selector));
  }
  
  document.addEventListener("DOMContentLoaded", () => {
    const isResume = document.body.classList.contains("resume");
    const header = document.querySelector(".resume-header") || document.body;
  
    // === Navigation Menu Setup (for all pages) ===
    const BASE_PATH = (location.hostname === "localhost" || location.hostname === "127.0.0.1")
      ? "/" : "/portfolio/";
  
    const pages = [
      { url: '', title: 'Home' },
      { url: 'projects/', title: 'Projects' },
      { url: 'resume/', title: 'Resume' },
      { url: 'contacts/', title: 'Contact' },
      { url: 'https://github.com/willemdehaan', title: 'GitHub' },
    ];
  
    let nav = document.createElement('nav');
  
    for (let p of pages) {
      let url = p.url.startsWith('http') ? p.url : BASE_PATH + p.url;
      let a = document.createElement('a');
      a.href = url;
      a.textContent = p.title;
  
      a.classList.toggle('current',
        a.host === location.host && a.pathname === location.pathname
      );
  
      a.target = a.host !== location.host ? '_blank' : '';
      nav.appendChild(a);
    }
  
    //header.prepend(nav);
  
    // === Color Scheme Selector ===
    const colorSchemeHTML = `
      <label class="color-scheme">
        Theme:
        <select>
          <option value="light dark">Automatic</option>
          <option value="light">Light</option>
          <option value="dark">Dark</option>
        </select>
      </label>
    `;
  
    //header.insertAdjacentHTML("beforeend", colorSchemeHTML);
  
    const select = document.querySelector(".color-scheme select");
  
    function setColorScheme(scheme) {
      document.documentElement.style.setProperty("color-scheme", scheme);
    }
  
    // Load saved scheme
    if ("colorScheme" in localStorage) {
      select.value = localStorage.colorScheme;
      setColorScheme(localStorage.colorScheme);
    }
  
    select.addEventListener("input", (e) => {
      const scheme = e.target.value;
      localStorage.colorScheme = scheme;
      setColorScheme(scheme);
    });
  
    // === Resume-only Slide Show ===
    if (!isResume) return;
  
    const slides = $$("#resume main.slideshow section, main.slideshow section"); // fallback selector
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
  