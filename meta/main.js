import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7/+esm';
import scrollama from 'https://cdn.jsdelivr.net/npm/scrollama@3.2.0/+esm';

let commits = [], dataAll;
let yScale;
const colors = d3.scaleOrdinal(d3.schemeTableau10);

// Dimensions
const width = 1000, height = 600;
const margin = { top: 10, right: 10, bottom: 30, left: 40 };
const usableArea = {
  top: margin.top,
  left: margin.left,
  bottom: height - margin.bottom,
  right: width - margin.right,
  width: width - margin.left - margin.right,
  height: height - margin.top - margin.bottom
};

// 1. Load & process
async function loadData() {
  dataAll = await d3.csv('loc.csv', row => ({
    ...row,
    line: +row.line,
    depth: +row.depth,
    length: +row.length,
    datetime: new Date(row.datetime)
  }));

  commits = d3.groups(dataAll, d => d.commit)
    .map(([id, lines]) => {
      const f = lines[0];
      return {
        id,
        url: `https://github.com/willemdehaan/portfolio/commit/${id}`,
        author: f.author,
        datetime: f.datetime,
        hourFrac: f.datetime.getHours() + f.datetime.getMinutes()/60,
        totalLines: lines.length,
        lines
      };
    })
    .sort((a, b) => d3.ascending(a.datetime, b.datetime));
}

// 2. Summary stats
function renderCommitInfo(data, subset) {
  const dl = d3.select('#stats').html('').append('dl').attr('class','stats');
  dl.append('dt').html('Total <abbr title="Lines of code">LOC</abbr>');
  dl.append('dd').text(data.length);
  dl.append('dt').text('Total commits');
  dl.append('dd').text(subset.length);
  dl.append('dt').text('Number of files');
  dl.append('dd').text(d3.groups(data, d => d.file).length);
  dl.append('dt').text('Max file length');
  dl.append('dd').text(
    d3.max(d3.rollups(data, v => d3.max(v, d => d.line), d => d.file), d => d[1])
  );
  dl.append('dt').text('Average line length');
  dl.append('dd').text(d3.mean(data, d => d.length).toFixed(1));
  const deepest = d3.greatest(data, d => d.depth);
  dl.append('dt').text('Deepest line');
  dl.append('dd').text(`${deepest.depth} (${deepest.file})`);
}

// 3. Scatter plot + brush
function renderScatterPlot(data) {
  const svg = d3.select('#chart svg')
    .attr('viewBox', `0 0 ${width} ${height}`)
    .style('overflow', 'visible');

  // Clear any existing layers (axes, dots, brush overlay)
  svg.selectAll('.gridlines, .dots, .x-axis, .y-axis, .overlay').remove();

  // Recompute scales
  const xScale = d3.scaleTime()
    .domain(d3.extent(data, d => d.datetime))
    .range([usableArea.left, usableArea.right])
    .nice();

  yScale = d3.scaleLinear()
    .domain([0, 24])
    .range([usableArea.bottom, usableArea.top]);

  // 3.1 Gridlines
  svg.append('g')
    .attr('class', 'gridlines')
    .attr('transform', `translate(${usableArea.left}, 0)`)
    .call(
      d3.axisLeft(yScale)
        .tickFormat('')
        .tickSize(-usableArea.width)
    );

  // 3.2 Dots container placeholder
  svg.append('g').attr('class', 'dots');

  // 3.3 Y Axis
  svg.append('g')
    .attr('class', 'y-axis')
    .attr('transform', `translate(${usableArea.left}, 0)`)
    .call(
      d3.axisLeft(yScale).tickFormat(d => `${String(d).padStart(2,'0')}:00`)
    );

  // 3.4 X Axis
  svg.append('g')
    .attr('class', 'x-axis')
    .attr('transform', `translate(0, ${usableArea.bottom})`)
    .call(
      d3.axisBottom(xScale).tickFormat(d3.timeFormat('%b %d'))
    );

  // 3.5 Draw/animate circles for the first time
  updateScatterPlot(data);

  // 3.6 Add brush overlay on top of everything
  const brush = d3.brush()
    .extent([
      [usableArea.left, usableArea.top],
      [usableArea.right, usableArea.bottom]
    ])
    .on('start brush end', brushed);

  svg.append('g')
    .attr('class', 'overlay')
    .call(brush);

  // Ensure dots and subsequent layers appear above the brush
  svg.selectAll('.dots, .overlay ~ *').raise();

  // ──────────────────────────────────────────────────────────────────────
  //  Brush event handler + helpers (copied from your previous code)
  // ──────────────────────────────────────────────────────────────────────

  function brushed(event) {
    const selection = event.selection;

    // Toggle 'selected' on circles that fall within the brush
    svg.selectAll('circle').classed('selected', d =>
      isCommitSelected(selection, d, xScale, yScale)
    );

    renderSelectionCount(selection, xScale, yScale);
    renderLanguageBreakdown(selection, xScale, yScale);
  }

  function isCommitSelected(selection, commit, xS, yS) {
    if (!selection) return false;
    const [[x0, y0], [x1, y1]] = selection;
    const x = xS(commit.datetime);
    const y = yS(commit.hourFrac);
    return x0 <= x && x <= x1 && y0 <= y && y <= y1;
  }

  function renderSelectionCount(selection, xS, yS) {
    const selectedCommits = selection
      ? commits.filter(d => isCommitSelected(selection, d, xS, yS))
      : [];

    const countElement = document.querySelector('#selection-count');
    countElement.textContent = `${selectedCommits.length || 'No'} commits selected`;
    return selectedCommits;
  }

  function renderLanguageBreakdown(selection, xS, yS) {
    const selectedCommits = selection
      ? commits.filter(d => isCommitSelected(selection, d, xS, yS))
      : [];

    const container = document.getElementById('language-breakdown');
    if (selectedCommits.length === 0) {
      container.innerHTML = '';
      return;
    }

    // Flatten lines across all selected commits, then roll up by 'type'
    const lines = selectedCommits.flatMap(d => d.lines);
    const breakdown = d3.rollup(lines, v => v.length, d => d.type);

    container.innerHTML = '';
    for (const [language, count] of breakdown) {
      const proportion = count / lines.length;
      const formatted = d3.format('.1~%')(proportion);
      container.insertAdjacentHTML('beforeend', `
        <div class="lang-cell">
          <div class="label">${language}</div>
          <div class="value">${count} lines (${formatted})</div>
        </div>
      `);
    }
  }
}

function updateScatterPlot(data) {
  const svg = d3.select('#chart svg');

  // Recompute xScale + rScale based on filtered data
  const xScale = d3.scaleTime()
    .domain(d3.extent(data, d => d.datetime))
    .range([usableArea.left, usableArea.right])
    .nice();

  const rScale = d3.scaleSqrt()
    .domain(d3.extent(data, d => d.totalLines))
    .range([2, 20]); // adjust max radius as desired

  // Update the X axis tick labels
  svg.select('g.x-axis')
    .call(d3.axisBottom(xScale).tickFormat(d3.timeFormat('%b %d')));

  // Sort commits descending so larger bubbles are drawn first
  const sorted = data.slice().sort((a, b) => b.totalLines - a.totalLines);

  // JOIN onto the existing <g class="dots">
  svg.select('g.dots')
    .selectAll('circle')
    .data(sorted, d => d.id)
    .join(
      enter => enter.append('circle')
        .attr('cx', d => xScale(d.datetime))
        .attr('cy', d => yScale(d.hourFrac))
        .attr('r', 0)
        .style('fill', 'steelblue')
        .style('fill-opacity', 0.7)
        .transition().duration(200)
          .attr('r', d => rScale(d.totalLines)),
      update => update.transition().duration(200)
        .attr('cx', d => xScale(d.datetime))
        .attr('cy', d => yScale(d.hourFrac))
        .attr('r', d => rScale(d.totalLines)),
      exit => exit.remove()
    );
}

// 4. File‐race unit viz
function updateFileDisplay(subset) {
  // 1) Compute how lines group into files, sorted by descending line‐count
  const lines = subset.flatMap(d => d.lines);
  const files = d3.groups(lines, d => d.file)
    .map(([name, lines]) => ({ 
      name, 
      lines, 
      type: lines[0].type 
    }))
    // Sort largest-to-smallest by lines.length:
    .sort((a, b) => b.lines.length - a.lines.length);

    // 2) Bind data to <div class="file-row"> under <dl id="files">
  const cont = d3.select('#files')
    .selectAll('div.file-row')
    .data(files, d => d.name);

  // 3) EXIT selection: fade out then remove
  cont.exit()
    .classed('removing', true)        // add a CSS class so opacity: 0
    .transition()
    .delay(50)                        // slight delay to let layout settle
    .duration(300)
    .remove();                        // finally remove from DOM

  // 4) ENTER selection: start hidden (opacity 0), then fade in
  const enterSel = cont.enter()
    .append('div')
      .attr('class', 'file-row')
      .style('opacity', 0);           // start invisible

  // Inside each new file-row, append dt>code, dt>small, and dd
  enterSel.call(div => {
    div.append('dt').append('code');
    div.append('dt').append('small');
    div.append('dd');
  });

  // 5) UPDATE + ENTER: set text and update unit‐dots
  const allRows = enterSel.merge(cont);
  allRows
    .each(function(d) {
      // Update <code> (filename) and <small> (line count)
      d3.select(this).select('code').text(d.name);
      d3.select(this).select('small').text(`${d.lines.length} lines`);

      // Bind each line to a little <div class="loc"> inside the dd
      const dots = d3.select(this).select('dd')
        .selectAll('div.loc')
        .data(d.lines);
      dots.enter()
        .append('div')
          .attr('class','loc')
          .style('--color', d => colors(d.type));
      dots.exit().remove();
    })
    // 6) Fade in all newly‐entered rows to full opacity
    .transition()
    .duration(300)
    .style('opacity', 1);

    allRows.order();
}

// 3. Generate commit scrolly steps
function generateCommitSteps() {
  d3.select('#scatter-story')
    .selectAll('.step')
    .data(commits)
    .join('div')
      .attr('class','step')
      .html((d,i) => `
        <p>On ${d.datetime.toLocaleString('en',{dateStyle:'full',timeStyle:'short'})},
        I made <a href="${d.url}" target="_blank">another commit</a>.
        Edited ${d.totalLines} lines across ${new Set(d.lines.map(l=>l.file)).size} files.</p>
      `);
}

// 4. Generate file‐race scrolly steps (reuse same commit list)
function generateFileSteps() {
  d3.select('#files-story')
    .selectAll('.step')
    .data(commits)
    .join('div')
      .attr('class','step')
      .html((d,i) => `
        <p>On ${d.datetime.toLocaleString('en',{dateStyle:'full',timeStyle:'short'})},
        I made <a href="${d.url}" target="_blank">another commit</a>.
        Edited ${d.totalLines} lines across ${new Set(d.lines.map(l=>l.file)).size} files.</p>
      `);
}

// 3.3: scatter onStepEnter (only update scatter & stats)
function onCommitStepEnter({ element }) {
  const cutoff = element.__data__.datetime;
  const filtered = commits.filter(c => c.datetime <= cutoff);

  renderCommitInfo(dataAll, filtered);
  updateScatterPlot(filtered);
  // Do NOT update file‐plot here; we leave it pegged to first‐commit until scrolly-2.
}

// 4.2: file‐race onStepEnter (update file‐plot timeline)
function onFileStepEnter({ element }) {
  const cutoff = element.__data__.datetime;
  const filtered = commits.filter(c => c.datetime <= cutoff);
  updateFileDisplay(filtered);
}

(async () => {
  await loadData();

  // === INITIAL RENDER ===
  // Show “first commit only” for both views:
  const firstDate = commits[0].datetime;
  const firstSubset = commits.filter(c => c.datetime <= firstDate);

  renderCommitInfo(dataAll, firstSubset);
  renderScatterPlot(firstSubset);
  updateFileDisplay(firstSubset);

  generateCommitSteps();
  generateFileSteps();

  // Part 1 scrolly: commits → scatter + stats
  scrollama()
    .setup({ container:'#scrolly-1', step:'#scrolly-1 .step' })
    .onStepEnter(onCommitStepEnter);

  // Part 2 scrolly: commits → file‐race
  scrollama()
    .setup({ container:'#scrolly-2', step:'#scrolly-2 .step' })
    .onStepEnter(onFileStepEnter);
})();



