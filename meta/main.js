import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

async function loadData() {
  const data = await d3.csv('loc.csv', (row) => ({
    ...row,
    line: +row.line,
    depth: +row.depth,
    length: +row.length,
    date: new Date(row.date + 'T00:00' + row.timezone),
    datetime: new Date(row.datetime),
  }));
  return data;
}

function processCommits(data) {
  return d3
    .groups(data, d => d.commit)
    .map(([commit, lines]) => {
      const first = lines[0];
      const { author, date, time, timezone, datetime } = first;

      const ret = {
        id: commit,
        url: 'https://github.com/willemdehaan/portfolio/commit/' + commit,
        author,
        date,
        time,
        timezone,
        datetime,
        hourFrac: datetime.getHours() + datetime.getMinutes() / 60,
        totalLines: lines.length,
      };

      Object.defineProperty(ret, 'lines', {
        value: lines,
        enumerable: false,
        writable: false,
        configurable: false,
      });

      return ret;
    });
}

function renderCommitInfo(data, commits) {
  const dl = d3.select('#stats').append('dl').attr('class', 'stats');

  dl.append('dt').html('Total <abbr title="Lines of code">LOC</abbr>');
  dl.append('dd').text(data.length);

  dl.append('dt').text('Total commits');
  dl.append('dd').text(commits.length);

  dl.append('dt').text('Number of files');
  dl.append('dd').text(d3.groups(data, d => d.file).length);

  dl.append('dt').text('Max file length');
  dl.append('dd').text(
    d3.max(
      d3.rollups(data, v => d3.max(v, d => d.line), d => d.file),
      d => d[1]
    )
  );

  dl.append('dt').text('Average line length');
  dl.append('dd').text(d3.mean(data, d => d.length).toFixed(1));

  dl.append('dt').text('Deepest line');
  const deepest = d3.greatest(data, d => d.depth);
  dl.append('dd').text(`${deepest?.depth} (${deepest?.file})`);
}

async function renderScatterPlot(data, commits) {
  const width = 1000;
  const height = 600;
  const margin = { top: 10, right: 10, bottom: 30, left: 40 };

  const usableArea = {
    top: margin.top,
    right: width - margin.right,
    bottom: height - margin.bottom,
    left: margin.left,
    width: width - margin.left - margin.right,
    height: height - margin.top - margin.bottom,
  };

  const svg = d3
    .select('#chart svg')
    .attr('viewBox', `0 0 ${width} ${height}`)
    .style('overflow', 'visible');

  // Clear previous elements
  svg.selectAll('.gridlines, .dots, .x-axis, .y-axis').remove();

  const xScale = d3.scaleTime()
    .domain(d3.extent(commits, (d) => d.datetime))
    .range([usableArea.left, usableArea.right])
    .nice();

  const yScale = d3.scaleLinear()
    .domain([0, 24])
    .range([usableArea.bottom, usableArea.top]);

  const [minLines, maxLines] = d3.extent(commits, (d) => d.totalLines);
  const rScale = d3.scaleSqrt()
    .domain([minLines, maxLines])
    .range([2, 30]);

  // Gridlines
  svg.append('g')
    .attr('class', 'gridlines')
    .attr('transform', `translate(${usableArea.left}, 0)`)
    .call(d3.axisLeft(yScale).tickFormat('').tickSize(-usableArea.width));

  // Sort for overlap handling
  const sortedCommits = d3.sort(commits, (d) => -d.totalLines);

  // Dots
  const dots = svg.append('g').attr('class', 'dots');

  dots.selectAll('circle')
    .data(sortedCommits)
    .join('circle')
    .attr('cx', (d) => xScale(d.datetime))
    .attr('cy', (d) => yScale(d.hourFrac))
    .attr('r', (d) => rScale(d.totalLines))
    .attr('fill', 'steelblue')
    .style('fill-opacity', 0.7)
    .on('mouseenter', (event, commit) => {
      d3.select(event.currentTarget).style('fill-opacity', 1);
      renderTooltipContent(commit);
      updateTooltipVisibility(true);
      updateTooltipPosition(event);
    })
    .on('mousemove', updateTooltipPosition)
    .on('mouseleave', (event) => {
      d3.select(event.currentTarget).style('fill-opacity', 0.7);
      updateTooltipVisibility(false);
    });

    svg.append('g')
    .attr('class', 'y-axis')
    .attr('transform', `translate(${usableArea.left}, 0)`)
    .call(
      d3.axisLeft(yScale).tickFormat(
        (d) => String(d % 24).padStart(2, '0') + ':00'
      )
    );
    svg.append('g')
    .attr('class', 'x-axis')
    .attr('transform', `translate(0, ${usableArea.bottom})`)
    .call(d3.axisBottom(xScale).tickFormat(d3.timeFormat('%b %d')));

  // Brush behavior
  const brush = d3.brush()
    .extent([[usableArea.left, usableArea.top], [usableArea.right, usableArea.bottom]])
    .on('start brush end', brushed);

  svg.call(brush);

  // Fix tooltips being blocked
  svg.selectAll('.dots, .overlay ~ *').raise();

  function brushed(event) {
    const selection = event.selection;

    d3.selectAll('circle').classed('selected', (d) =>
      isCommitSelected(selection, d)
    );

    renderSelectionCount(selection);
    renderLanguageBreakdown(selection);
  }

  function isCommitSelected(selection, commit) {
    if (!selection) return false;

    const [x0, y0] = selection[0];
    const [x1, y1] = selection[1];

    const x = xScale(commit.datetime);
    const y = yScale(commit.hourFrac);

    return x0 <= x && x <= x1 && y0 <= y && y <= y1;
  }

  function renderSelectionCount(selection) {
    const selectedCommits = selection
      ? commits.filter((d) => isCommitSelected(selection, d))
      : [];

    const countElement = document.querySelector('#selection-count');
    countElement.textContent = `${
      selectedCommits.length || 'No'
    } commits selected`;

    return selectedCommits;
  }

  function renderLanguageBreakdown(selection) {
    const selectedCommits = selection
      ? commits.filter((d) => isCommitSelected(selection, d))
      : [];

    const container = document.getElementById('language-breakdown');
    if (selectedCommits.length === 0) {
      container.innerHTML = '';
      return;
    }

    const lines = selectedCommits.flatMap((d) => d.lines);
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


// Run everything
let data = await loadData();
let commits = processCommits(data);
renderCommitInfo(data, commits);
renderScatterPlot(data, commits);

function renderTooltipContent(commit) {
  console.log(commit);
  if (!commit || Object.keys(commit).length === 0) return;

  document.getElementById('commit-link').href = commit.url;
  document.getElementById('commit-link').textContent = commit.id;
  document.getElementById('commit-date').textContent = commit.datetime?.toLocaleDateString('en', { dateStyle: 'full' });
  document.getElementById('commit-time').textContent = commit.datetime?.toLocaleTimeString('en', { timeStyle: 'short' });
  document.getElementById('commit-author').textContent = commit.author || 'Unknown';
  document.getElementById('commit-lines').textContent = commit.totalLines?? '—';
}

function updateTooltipVisibility(isVisible) {
  document.getElementById('commit-tooltip').hidden = !isVisible;
}

function updateTooltipPosition(event) {
  const tooltip = document.getElementById('commit-tooltip');
  tooltip.style.left = `${event.clientX + 15}px`;
  tooltip.style.top = `${event.clientY + 15}px`;
}