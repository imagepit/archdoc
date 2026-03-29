import type { ProjectConfig } from "../types/config.js";
import type { LayerExtraction } from "../types/extracted.js";
import { buildCytoscapeElements, CYTOSCAPE_LAYER_COLORS, type CytoscapeOptions } from "./cytoscape-data-builder.js";

/**
 * Build a standalone HTML file with Cytoscape.js interactive component graph.
 * The HTML is self-contained (CDN dependencies only) and can be opened directly in a browser.
 * @param config - Project configuration
 * @param extractions - All layer extraction results
 * @returns Complete HTML string
 */
export function buildCytoscapeHtml(
  config: ProjectConfig,
  extractions: LayerExtraction[],
  options?: CytoscapeOptions,
): string {
  const elements = buildCytoscapeElements(config, extractions, options);

  // Build layer color map for styling
  const layerColorMap: Record<string, { bg: string; border: string }> = {};
  for (let i = 0; i < config.layers.length; i++) {
    const layer = config.layers[i];
    layerColorMap[layer.name] = CYTOSCAPE_LAYER_COLORS[i % CYTOSCAPE_LAYER_COLORS.length];
  }

  return `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(config.project.name)} - Component Graph</title>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/cytoscape/3.30.4/cytoscape.min.js"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif; background: #fafafa; }

    #toolbar {
      position: fixed; top: 0; left: 0; right: 0; z-index: 100;
      background: #fff; border-bottom: 1px solid #e0e0e0;
      padding: 8px 16px; display: flex; align-items: center; gap: 12px;
      flex-wrap: wrap; box-shadow: 0 1px 3px rgba(0,0,0,0.08);
    }
    #toolbar h1 { font-size: 14px; font-weight: 600; color: #333; margin-right: 8px; white-space: nowrap; }
    #toolbar input[type="text"] {
      padding: 4px 8px; border: 1px solid #ccc; border-radius: 4px;
      font-size: 13px; width: 180px; outline: none;
    }
    #toolbar input[type="text"]:focus { border-color: #1976d2; }
    .btn {
      padding: 4px 10px; border: 1px solid #ccc; border-radius: 4px;
      background: #fff; cursor: pointer; font-size: 12px; white-space: nowrap;
      transition: background 0.15s;
    }
    .btn:hover { background: #f0f0f0; }
    .btn.active { background: #ef5350; color: #fff; border-color: #ef5350; }
    .layer-filters { display: flex; gap: 6px; align-items: center; flex-wrap: wrap; }
    .layer-chip {
      display: inline-flex; align-items: center; gap: 4px;
      padding: 2px 8px; border-radius: 12px; font-size: 11px;
      cursor: pointer; user-select: none; border: 1px solid;
      transition: opacity 0.15s;
    }
    .layer-chip.hidden { opacity: 0.35; text-decoration: line-through; }
    .layer-chip input { display: none; }

    .edge-toggles { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; border-left: 1px solid #e0e0e0; padding-left: 10px; margin-left: 2px; }
    .edge-toggle { display: flex; align-items: center; gap: 3px; font-size: 11px; cursor: pointer; user-select: none; }
    .edge-toggle input { width: 13px; height: 13px; cursor: pointer; }
    .edge-toggle .et-line { display: inline-block; width: 16px; height: 0; border-top: 2px solid; vertical-align: middle; }

    #cy { position: fixed; top: 50px; left: 0; right: 0; bottom: 0; }

    #legend {
      position: fixed; top: 54px; right: 12px; z-index: 100;
      background: rgba(255,255,255,0.95); padding: 10px 14px;
      border-radius: 8px; font-size: 11px; color: #444;
      border: 1px solid #e0e0e0; box-shadow: 0 1px 4px rgba(0,0,0,0.08);
      line-height: 1.8;
    }
    #legend .legend-title { font-weight: 600; font-size: 12px; margin-bottom: 4px; }
    #legend .legend-item { display: flex; align-items: center; gap: 6px; }
    #legend .legend-node {
      display: inline-block; width: 14px; height: 14px;
      border: 2px solid; vertical-align: middle; flex-shrink: 0;
    }
    #legend .legend-edge {
      display: inline-block; width: 24px; height: 0;
      border-top: 2px solid; vertical-align: middle; flex-shrink: 0;
      position: relative;
    }
    #legend .legend-edge::after {
      content: ''; position: absolute; right: -1px; top: -5px;
      border: 4px solid transparent; border-left-width: 6px;
      border-left-style: solid; border-left-color: inherit;
    }

    #tooltip {
      display: none; position: fixed; z-index: 200;
      background: #333; color: #fff; padding: 8px 12px;
      border-radius: 6px; font-size: 12px; max-width: 360px;
      pointer-events: none; line-height: 1.5;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    }
    #tooltip .tt-name { font-weight: 600; font-size: 13px; }
    #tooltip .tt-kind { color: #90caf9; }
    #tooltip .tt-layer { color: #a5d6a7; }
    #tooltip .tt-file { color: #bbb; font-size: 11px; word-break: break-all; }
    #tooltip .tt-desc { margin-top: 4px; color: #ddd; }
    #tooltip .tt-forbidden { color: #ef5350; font-weight: 600; }

    #stats {
      position: fixed; bottom: 12px; left: 12px; z-index: 100;
      background: rgba(255,255,255,0.9); padding: 6px 12px;
      border-radius: 6px; font-size: 11px; color: #666;
      border: 1px solid #e0e0e0;
    }
    #stats .violation-count { color: #ef5350; font-weight: 600; }
  </style>
</head>
<body>
  <div id="toolbar">
    <h1>${escapeHtml(config.project.name)}</h1>
    <input type="text" id="search" placeholder="Search components...">
    <button class="btn" id="btn-zoom-in" title="Zoom in">+</button>
    <button class="btn" id="btn-zoom-out" title="Zoom out">-</button>
    <button class="btn" id="btn-fit" title="Fit to screen">Fit</button>
    <button class="btn" id="btn-violations" title="Show only violations">Violations</button>
    <div class="edge-toggles">
      <label class="edge-toggle"><input type="checkbox" id="toggle-dep" checked><span class="et-line" style="border-color:#333;"></span>Dep</label>
      <label class="edge-toggle"><input type="checkbox" id="toggle-extends" checked><span class="et-line" style="border-color:#1565c0;"></span>Ext</label>
      <label class="edge-toggle"><input type="checkbox" id="toggle-implements" checked><span class="et-line" style="border-color:#2e7d32;border-style:dashed;"></span>Impl</label>
      <label class="edge-toggle"><input type="checkbox" id="toggle-forbidden" checked><span class="et-line" style="border-color:#ef5350;border-width:3px;"></span>Viol</label>
    </div>
    <div class="layer-filters" id="layer-filters"></div>
  </div>
  <div id="cy"></div>
  <div id="legend">
    <div class="legend-title">Node Types</div>
    <div class="legend-item"><span class="legend-node" style="border-color:#42a5f5;background:#e3f2fd;border-radius:3px;"></span> Class</div>
    <div class="legend-item"><span class="legend-node" style="border-color:#ab47bc;background:#f3e5f5;border-style:dashed;border-radius:3px;"></span> Interface</div>
    <div class="legend-item"><span class="legend-node" style="border-color:#66bb6a;background:#e8f5e9;border-radius:3px;"></span> Function</div>
    <div class="legend-item"><span class="legend-node" style="border-color:#bdbdbd;background:#f5f5f5;border-radius:3px;border-width:1px;"></span> Type / Enum / Const</div>
    <div class="legend-title" style="margin-top:6px;">Edge Types</div>
    <div class="legend-item"><span class="legend-edge" style="border-color:#333;"></span><span style="margin-left:2px;">Dependency</span></div>
    <div class="legend-item"><span class="legend-edge" style="border-color:#1565c0;"></span><span style="margin-left:2px;">Extends</span></div>
    <div class="legend-item"><span class="legend-edge" style="border-color:#2e7d32;border-style:dashed;"></span><span style="margin-left:2px;">Implements</span></div>
    <div class="legend-item"><span class="legend-edge" style="border-color:#ef5350;border-width:3px;"></span><span style="margin-left:2px;color:#ef5350;font-weight:600;">Violation</span></div>
  </div>
  <div id="tooltip"></div>
  <div id="stats"></div>

  <script>
    const elements = ${JSON.stringify(elements)};
    const layerColors = ${JSON.stringify(layerColorMap)};

    // --- Pre-calculate grid positions with nested sub-directory grouping ---
    const CELL_W = 140;
    const CELL_H = 36;
    const LAYER_PAD = 12;
    const LAYER_GAP = 30;
    const SUBDIR_PAD = 6;
    const SUBDIR_GAP = 6;
    const SUBDIR_LABEL_H = 16;
    const COLS_PER_GROUP = 4;

    const layerNames = Object.keys(layerColors);

    // Build a tree of subdir nodes: parentId → children (subdir + component nodes)
    const childrenOf = {};  // parentId → [node elements]
    const subdirSet = new Set();
    for (const el of elements.nodes) {
      if (el.data.kind === 'subdir') subdirSet.add(el.data.id);
    }
    for (const el of elements.nodes) {
      if (el.data.kind === 'layer') continue;
      const pid = el.data.parent || '';
      if (!childrenOf[pid]) childrenOf[pid] = [];
      childrenOf[pid].push(el);
    }

    // Recursively calculate the size of a group (subdir or layer root)
    // Returns { w, h } and stores layout info in layoutMap
    const layoutMap = {}; // groupId → { x, y, w, h, childPositions: [{id, x, y}], subLayouts: [...] }

    function calcGroupLayout(groupId) {
      const children = childrenOf[groupId] || [];
      const subdirChildren = children.filter(c => c.data.kind === 'subdir');
      const leafChildren = children.filter(c => c.data.kind !== 'subdir');

      // Leaf nodes: arrange in grid
      const leafRows = Math.ceil(leafChildren.length / COLS_PER_GROUP) || 0;
      const leafCols = Math.min(leafChildren.length, COLS_PER_GROUP);
      const leafW = leafCols * CELL_W;
      const leafH = leafRows * CELL_H;

      // Subdir children: calculate each recursively, then stack in 2 columns
      const subLayouts = [];
      for (const sd of subdirChildren.sort((a, b) => a.data.label.localeCompare(b.data.label))) {
        const sub = calcGroupLayout(sd.data.id);
        subLayouts.push({ id: sd.data.id, ...sub });
      }

      // Stack subdirs in 2-column masonry
      const SD_COLS = 2;
      const sdColH = new Array(SD_COLS).fill(0);
      let sdMaxColW = 0;
      for (const sl of subLayouts) {
        let minC = 0;
        for (let c = 1; c < SD_COLS; c++) { if (sdColH[c] < sdColH[minC]) minC = c; }
        sl.col = minC;
        sl.colY = sdColH[minC];
        sdColH[minC] += sl.h + SUBDIR_GAP;
        sdMaxColW = Math.max(sdMaxColW, sl.w);
      }

      const subdirsW = subLayouts.length > 0 ? sdMaxColW * Math.min(SD_COLS, subLayouts.length) + (Math.min(SD_COLS, subLayouts.length) - 1) * SUBDIR_GAP : 0;
      const subdirsH = Math.max(0, ...sdColH) - (subLayouts.length > 0 ? SUBDIR_GAP : 0);

      // Total group size: leaf grid on top, subdirs below (or vice versa)
      const innerW = Math.max(leafW, subdirsW);
      const innerH = leafH + (leafH > 0 && subdirsH > 0 ? SUBDIR_GAP : 0) + subdirsH;

      const totalW = innerW + SUBDIR_PAD * 2;
      const totalH = innerH + SUBDIR_PAD * 2 + SUBDIR_LABEL_H;

      return {
        w: totalW,
        h: totalH,
        leafChildren,
        subLayouts,
        sdMaxColW: sdMaxColW || 0,
      };
    }

    // Position nodes recursively
    const positions = {};

    function positionGroup(groupId, layout, ox, oy) {
      // Group compound node
      positions[groupId] = { x: ox + layout.w / 2, y: oy + layout.h / 2 };

      let cy = oy + SUBDIR_PAD + SUBDIR_LABEL_H;

      // Leaf nodes in grid
      for (let i = 0; i < layout.leafChildren.length; i++) {
        const col = i % COLS_PER_GROUP;
        const row = Math.floor(i / COLS_PER_GROUP);
        positions[layout.leafChildren[i].data.id] = {
          x: ox + SUBDIR_PAD + col * CELL_W + CELL_W / 2,
          y: cy + row * CELL_H + CELL_H / 2,
        };
      }

      const leafRows = Math.ceil(layout.leafChildren.length / COLS_PER_GROUP) || 0;
      cy += leafRows * CELL_H;
      if (leafRows > 0 && layout.subLayouts.length > 0) cy += SUBDIR_GAP;

      // Sub-directory groups
      for (const sl of layout.subLayouts) {
        const sdX = ox + SUBDIR_PAD + sl.col * (layout.sdMaxColW + SUBDIR_GAP);
        const sdY = cy + sl.colY;
        positionGroup(sl.id, sl, sdX, sdY);
      }
    }

    // Calculate layout for each layer: first pass to get sizes
    const LAYOUT_COLS = 2;
    const layerLayouts = [];
    for (const name of layerNames) {
      const layerId = 'layer:' + name;
      const layout = calcGroupLayout(layerId);
      layerLayouts.push({ name, layerId, layout, w: layout.w, h: layout.h });
    }

    // Find max width per column for alignment
    // Sort layers into columns by shortest-column-first, then compute max width per column
    const colHeights = new Array(LAYOUT_COLS).fill(0);
    const colMaxW = new Array(LAYOUT_COLS).fill(0);
    const layerPlacements = [];

    for (const ll of layerLayouts) {
      let minCol = 0;
      for (let c = 1; c < LAYOUT_COLS; c++) {
        if (colHeights[c] < colHeights[minCol]) minCol = c;
      }
      layerPlacements.push({ ...ll, col: minCol, colY: colHeights[minCol] });
      colHeights[minCol] += ll.h + LAYER_GAP;
      colMaxW[minCol] = Math.max(colMaxW[minCol], ll.w);
    }

    // Compute column X offsets from max widths
    const colX = [0];
    for (let c = 1; c < LAYOUT_COLS; c++) {
      colX[c] = colX[c - 1] + colMaxW[c - 1] + LAYER_GAP;
    }

    // Position all layers
    for (const lp of layerPlacements) {
      positionGroup(lp.layerId, lp.layout, colX[lp.col], lp.colY);
    }

    // Build Cytoscape stylesheet
    const style = [
      // Layer compound nodes
      {
        selector: 'node[kind="layer"]',
        style: {
          'shape': 'round-rectangle',
          'background-opacity': 0.15,
          'border-width': 2,
          'label': 'data(label)',
          'text-valign': 'top',
          'text-halign': 'center',
          'font-size': 13,
          'font-weight': 'bold',
          'padding': '10px',
          'text-margin-y': -4,
          'color': '#444',
        }
      },
      // Sub-directory compound nodes
      {
        selector: 'node[kind="subdir"]',
        style: {
          'shape': 'round-rectangle',
          'background-color': '#fff',
          'background-opacity': 0.6,
          'border-width': 1,
          'border-color': '#ccc',
          'border-style': 'dashed',
          'label': 'data(label)',
          'text-valign': 'top',
          'text-halign': 'left',
          'font-size': 10,
          'font-weight': 'normal',
          'font-style': 'italic',
          'padding': '6px',
          'text-margin-y': -2,
          'text-margin-x': 4,
          'color': '#888',
        }
      },
      // Class nodes
      {
        selector: 'node[kind="class"]',
        style: {
          'shape': 'round-rectangle',
          'background-color': '#e3f2fd',
          'border-color': '#42a5f5',
          'border-width': 2,
          'label': 'data(label)',
          'text-valign': 'center',
          'font-size': 10,
          'font-weight': 'bold',
          'width': 'label',
          'height': 24,
          'padding': '4px',
          'color': '#111',
        }
      },
      // Interface nodes
      {
        selector: 'node[kind="interface"]',
        style: {
          'shape': 'round-rectangle',
          'background-color': '#f3e5f5',
          'border-color': '#ab47bc',
          'border-width': 2,
          'border-style': 'dashed',
          'label': 'data(label)',
          'text-valign': 'center',
          'font-size': 10,
          'font-weight': 'bold',
          'width': 'label',
          'height': 24,
          'padding': '4px',
          'color': '#111',
        }
      },
      // Function nodes
      {
        selector: 'node[kind="function"]',
        style: {
          'shape': 'round-rectangle',
          'background-color': '#e8f5e9',
          'border-color': '#66bb6a',
          'border-width': 1.5,
          'label': 'data(label)',
          'text-valign': 'center',
          'font-size': 9,
          'font-weight': 'bold',
          'width': 'label',
          'height': 22,
          'padding': '3px',
          'color': '#111',
        }
      },
      // Type/Enum/Const nodes
      {
        selector: 'node[kind="type"], node[kind="enum"], node[kind="const"]',
        style: {
          'shape': 'round-rectangle',
          'background-color': '#f5f5f5',
          'border-color': '#bdbdbd',
          'border-width': 1,
          'label': 'data(label)',
          'text-valign': 'center',
          'font-size': 8,
          'font-weight': 'bold',
          'width': 'label',
          'height': 20,
          'padding': '3px',
          'color': '#111',
        }
      },
      // Normal edges
      {
        selector: 'edge[type="dependency"], edge[type="association"], edge[type="import"]',
        style: {
          'line-color': '#333',
          'target-arrow-color': '#333',
          'target-arrow-shape': 'triangle',
          'curve-style': 'bezier',
          'width': 1.5,
          'arrow-scale': 1.2,
          'opacity': 0.5,
        }
      },
      // Extends edges
      {
        selector: 'edge[type="extends"]',
        style: {
          'line-color': '#1565c0',
          'target-arrow-color': '#1565c0',
          'target-arrow-shape': 'triangle',
          'target-arrow-fill': 'hollow',
          'curve-style': 'bezier',
          'width': 2,
          'arrow-scale': 1.4,
        }
      },
      // Implements edges
      {
        selector: 'edge[type="implements"]',
        style: {
          'line-color': '#2e7d32',
          'target-arrow-color': '#2e7d32',
          'target-arrow-shape': 'triangle',
          'target-arrow-fill': 'hollow',
          'line-style': 'dashed',
          'curve-style': 'bezier',
          'width': 2,
          'arrow-scale': 1.4,
        }
      },
      // Forbidden edges (violations)
      {
        selector: 'edge[type="forbidden"]',
        style: {
          'line-color': '#ef5350',
          'target-arrow-color': '#ef5350',
          'target-arrow-shape': 'triangle',
          'curve-style': 'bezier',
          'width': 4,
          'arrow-scale': 1.2,
          'label': 'data(count)',
          'font-size': 12,
          'font-weight': 'bold',
          'color': '#ef5350',
          'text-background-color': '#fff',
          'text-background-opacity': 0.9,
          'text-background-padding': '3px',
          'text-background-shape': 'round-rectangle',
          'z-index': 999,
        }
      },
      // Highlighted node
      {
        selector: 'node.highlighted',
        style: {
          'border-color': '#ff9800',
          'border-width': 4,
          'z-index': 999,
        }
      },
      // Selected node
      {
        selector: 'node:selected',
        style: {
          'border-color': '#1976d2',
          'border-width': 4,
          'z-index': 999,
        }
      },
      // Faded elements
      {
        selector: '.faded',
        style: { 'opacity': 0.15 }
      },
      // Connected elements on selection
      {
        selector: '.connected',
        style: { 'opacity': 1 }
      },
    ];

    // Apply per-layer colors to compound nodes
    for (const [layerName, colors] of Object.entries(layerColors)) {
      style.push({
        selector: 'node[id="layer:' + layerName + '"]',
        style: {
          'background-color': colors.bg,
          'border-color': colors.border,
        }
      });
    }

    // Initialize Cytoscape with preset (pre-calculated) layout
    const cy = cytoscape({
      container: document.getElementById('cy'),
      elements: [...elements.nodes, ...elements.edges],
      style: style,
      layout: {
        name: 'preset',
        positions: (node) => positions[node.id()] || { x: 0, y: 0 },
        padding: 30,
      },
      minZoom: 0.1,
      maxZoom: 5,
    });

    // Fit after layout
    cy.fit(undefined, 30);

    // --- Tooltip ---
    const tooltip = document.getElementById('tooltip');
    cy.on('mouseover', 'node[kind!="layer"]', (e) => {
      const d = e.target.data();
      let html = '<div class="tt-name">' + esc(d.label) + '</div>';
      html += '<span class="tt-kind">' + esc(d.kind) + '</span>';
      html += ' | <span class="tt-layer">' + esc(d.layer) + '</span>';
      if (d.category) html += ' | ' + esc(d.category);
      html += '<div class="tt-file">' + esc(d.filePath) + '</div>';
      if (d.description) html += '<div class="tt-desc">' + esc(d.description) + '</div>';
      if (d.dddRole) html += '<div class="tt-desc">DDD: ' + esc(d.dddRole) + '</div>';
      tooltip.innerHTML = html;
      tooltip.style.display = 'block';
    });

    cy.on('mouseover', 'edge[type="forbidden"]', (e) => {
      const d = e.target.data();
      let html = '<div class="tt-forbidden">Forbidden Import Violation</div>';
      html += '<div>' + esc(d.source) + ' -> ' + esc(d.target) + '</div>';
      if (d.count) html += '<div>' + d.count + ' violation(s)</div>';
      if (d.sourceFile) html += '<div class="tt-file">' + esc(d.sourceFile) + '</div>';
      if (d.importPath) html += '<div class="tt-file">' + esc(d.importPath) + '</div>';
      tooltip.innerHTML = html;
      tooltip.style.display = 'block';
    });

    cy.on('mousemove', (e) => {
      if (tooltip.style.display === 'block') {
        tooltip.style.left = (e.originalEvent.clientX + 12) + 'px';
        tooltip.style.top = (e.originalEvent.clientY + 12) + 'px';
      }
    });

    cy.on('mouseout', () => { tooltip.style.display = 'none'; });

    // --- Node selection: highlight connected ---
    cy.on('tap', 'node[kind!="layer"]', (e) => {
      const node = e.target;
      cy.elements().removeClass('faded connected');
      cy.elements().addClass('faded');
      const connected = node.closedNeighborhood();
      connected.removeClass('faded').addClass('connected');
      connected.forEach(n => {
        if (n.isNode() && n.parent().length) n.parent().removeClass('faded');
      });
      node.parent().removeClass('faded');
    });

    cy.on('tap', (e) => {
      if (e.target === cy) {
        cy.elements().removeClass('faded connected highlighted');
      }
    });

    // --- Zoom buttons ---
    document.getElementById('btn-zoom-in').addEventListener('click', () => {
      cy.zoom({ level: cy.zoom() * 1.3, renderedPosition: { x: cy.width() / 2, y: cy.height() / 2 } });
    });
    document.getElementById('btn-zoom-out').addEventListener('click', () => {
      cy.zoom({ level: cy.zoom() / 1.3, renderedPosition: { x: cy.width() / 2, y: cy.height() / 2 } });
    });

    // --- Fit button ---
    document.getElementById('btn-fit').addEventListener('click', () => {
      cy.elements().removeClass('faded connected highlighted');
      cy.fit(undefined, 30);
    });

    // --- Violations button ---
    let violationsMode = false;
    const btnViolations = document.getElementById('btn-violations');
    btnViolations.addEventListener('click', () => {
      violationsMode = !violationsMode;
      btnViolations.classList.toggle('active', violationsMode);

      if (violationsMode) {
        const forbiddenEdges = cy.edges('[type="forbidden"]');
        if (forbiddenEdges.length === 0) {
          violationsMode = false;
          btnViolations.classList.remove('active');
          return;
        }
        cy.elements().addClass('faded');
        forbiddenEdges.removeClass('faded');
        forbiddenEdges.connectedNodes().removeClass('faded');
        forbiddenEdges.connectedNodes().forEach(n => {
          if (n.parent().length) n.parent().removeClass('faded');
        });
      } else {
        cy.elements().removeClass('faded connected');
      }
    });

    // --- Search ---
    const searchInput = document.getElementById('search');
    searchInput.addEventListener('input', () => {
      const query = searchInput.value.trim().toLowerCase();
      cy.elements().removeClass('highlighted faded');
      if (!query) return;

      const matched = cy.nodes('[kind!="layer"]').filter(n =>
        n.data('label').toLowerCase().includes(query)
      );

      if (matched.length > 0) {
        cy.elements().addClass('faded');
        matched.removeClass('faded').addClass('highlighted');
        matched.forEach(n => {
          if (n.parent().length) n.parent().removeClass('faded');
        });
        cy.fit(matched, 60);
      }
    });

    // --- Layer filter chips ---
    const filtersContainer = document.getElementById('layer-filters');
    const layerVisibility = {};
    layerNames.forEach(name => { layerVisibility[name] = true; });

    for (const name of layerNames) {
      const colors = layerColors[name];
      const chip = document.createElement('label');
      chip.className = 'layer-chip';
      chip.style.background = colors.bg;
      chip.style.borderColor = colors.border;
      chip.style.color = '#333';
      chip.textContent = name;
      chip.addEventListener('click', () => {
        layerVisibility[name] = !layerVisibility[name];
        chip.classList.toggle('hidden', !layerVisibility[name]);

        const layerNode = cy.getElementById('layer:' + name);
        const descendants = layerNode.descendants();
        if (layerVisibility[name]) {
          layerNode.style('display', 'element');
          descendants.style('display', 'element');
        } else {
          layerNode.style('display', 'none');
          descendants.style('display', 'none');
        }
      });
      filtersContainer.appendChild(chip);
    }

    // --- Edge type toggles ---
    const edgeTypeMap = {
      'toggle-dep': ['dependency', 'association', 'import'],
      'toggle-extends': ['extends'],
      'toggle-implements': ['implements'],
      'toggle-forbidden': ['forbidden'],
    };
    for (const [id, types] of Object.entries(edgeTypeMap)) {
      document.getElementById(id).addEventListener('change', (e) => {
        const show = e.target.checked;
        for (const t of types) {
          cy.edges('[type="' + t + '"]').style('display', show ? 'element' : 'none');
        }
      });
    }

    // --- Stats ---
    const statsEl = document.getElementById('stats');
    const totalNodes = cy.nodes('[kind!="layer"]').length;
    const totalEdges = cy.edges().length;
    const violationEdges = cy.edges('[type="forbidden"]').length;
    let statsHtml = totalNodes + ' components | ' + totalEdges + ' relationships';
    if (violationEdges > 0) {
      statsHtml += ' | <span class="violation-count">' + violationEdges + ' violation(s)</span>';
    }
    statsEl.innerHTML = statsHtml;

    function esc(s) { return s ? String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;') : ''; }
  </script>
</body>
</html>`;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
