/**
 * Alignment and Distribution Utilities
 * Part of Phase 2: Advanced Snap-to-Align Enhancement
 * 
 * Provides functions for aligning and distributing nodes on the canvas
 */

/**
 * Align nodes based on the specified type
 * @param {Array} nodes - Array of selected nodes to align
 * @param {string} type - Alignment type: 'left', 'center-h', 'right', 'top', 'center-v', 'bottom'
 * @returns {Array} Updated nodes with new positions
 */
export const alignNodes = (nodes, type) => {
  if (!nodes || nodes.length < 2) return nodes;

  const nodeWidth = 200; // Default node width
  const nodeHeight = 100; // Default node height

  let reference;
  
  switch (type) {
    case 'left': {
      // Find leftmost position
      reference = Math.min(...nodes.map(n => n.position.x));
      return nodes.map(n => ({
        ...n,
        position: { ...n.position, x: reference }
      }));
    }
    
    case 'center-h': {
      // Align to horizontal center of all nodes
      const minX = Math.min(...nodes.map(n => n.position.x));
      const maxX = Math.max(...nodes.map(n => n.position.x + (n.width || nodeWidth)));
      reference = (minX + maxX) / 2 - nodeWidth / 2;
      return nodes.map(n => ({
        ...n,
        position: { ...n.position, x: reference }
      }));
    }
    
    case 'right': {
      // Find rightmost position
      const maxX = Math.max(...nodes.map(n => n.position.x + (n.width || nodeWidth)));
      reference = maxX - nodeWidth;
      return nodes.map(n => ({
        ...n,
        position: { ...n.position, x: reference }
      }));
    }
    
    case 'top': {
      // Find topmost position
      reference = Math.min(...nodes.map(n => n.position.y));
      return nodes.map(n => ({
        ...n,
        position: { ...n.position, y: reference }
      }));
    }
    
    case 'center-v': {
      // Align to vertical center of all nodes
      const minY = Math.min(...nodes.map(n => n.position.y));
      const maxY = Math.max(...nodes.map(n => n.position.y + (n.height || nodeHeight)));
      reference = (minY + maxY) / 2 - nodeHeight / 2;
      return nodes.map(n => ({
        ...n,
        position: { ...n.position, y: reference }
      }));
    }
    
    case 'bottom': {
      // Find bottommost position
      const maxY = Math.max(...nodes.map(n => n.position.y + (n.height || nodeHeight)));
      reference = maxY - nodeHeight;
      return nodes.map(n => ({
        ...n,
        position: { ...n.position, y: reference }
      }));
    }
    
    default:
      return nodes;
  }
};

/**
 * Distribute nodes evenly in the specified direction
 * @param {Array} nodes - Array of selected nodes to distribute
 * @param {string} direction - Distribution direction: 'horizontal' or 'vertical'
 * @returns {Array} Updated nodes with new positions
 */
export const distributeNodes = (nodes, direction) => {
  if (!nodes || nodes.length < 3) return nodes;

  const nodeWidth = 200;
  const nodeHeight = 100;

  if (direction === 'horizontal') {
    // Sort nodes by x position
    const sortedNodes = [...nodes].sort((a, b) => a.position.x - b.position.x);
    
    // Calculate total spacing needed
    const firstNode = sortedNodes[0];
    const lastNode = sortedNodes[sortedNodes.length - 1];
    const totalWidth = lastNode.position.x - firstNode.position.x;
    const spacing = totalWidth / (sortedNodes.length - 1);
    
    // Distribute nodes evenly
    return sortedNodes.map((node, index) => ({
      ...node,
      position: {
        ...node.position,
        x: firstNode.position.x + (spacing * index)
      }
    }));
  } else if (direction === 'vertical') {
    // Sort nodes by y position
    const sortedNodes = [...nodes].sort((a, b) => a.position.y - b.position.y);
    
    // Calculate total spacing needed
    const firstNode = sortedNodes[0];
    const lastNode = sortedNodes[sortedNodes.length - 1];
    const totalHeight = lastNode.position.y - firstNode.position.y;
    const spacing = totalHeight / (sortedNodes.length - 1);
    
    // Distribute nodes evenly
    return sortedNodes.map((node, index) => ({
      ...node,
      position: {
        ...node.position,
        y: firstNode.position.y + (spacing * index)
      }
    }));
  }

  return nodes;
};

/**
 * Snap node position to grid
 * @param {number} value - Position value (x or y)
 * @param {number} gridSize - Grid size for snapping (default: 20)
 * @returns {number} Snapped value
 */
export const snapToGrid = (value, gridSize = 20) => {
  return Math.round(value / gridSize) * gridSize;
};

/**
 * Auto-arrange nodes in a hierarchical layout
 * @param {Array} nodes - Array of all nodes
 * @param {Array} edges - Array of all edges
 * @returns {Array} Nodes with new positions
 */
export const autoArrangeNodes = (nodes, edges) => {
  if (!nodes || nodes.length === 0) return nodes;

  const nodeWidth = 200;
  const nodeHeight = 100;
  const horizontalSpacing = 100;
  const verticalSpacing = 140;

  // Find nodes with no incoming edges (start nodes)
  const hasIncomingEdge = new Set(edges.map(e => e.target));
  const startNodes = nodes.filter(n => !hasIncomingEdge.has(n.id));

  // Build adjacency list
  const adjacencyList = {};
  nodes.forEach(n => {
    adjacencyList[n.id] = [];
  });
  edges.forEach(e => {
    if (adjacencyList[e.source]) {
      adjacencyList[e.source].push(e.target);
    }
  });

  // Perform BFS to assign levels
  const levels = {};
  const visited = new Set();
  const queue = startNodes.map(n => ({ id: n.id, level: 0 }));

  while (queue.length > 0) {
    const { id, level } = queue.shift();
    
    if (visited.has(id)) continue;
    visited.add(id);

    if (!levels[level]) levels[level] = [];
    levels[level].push(id);

    // Add children to queue
    const children = adjacencyList[id] || [];
    children.forEach(childId => {
      if (!visited.has(childId)) {
        queue.push({ id: childId, level: level + 1 });
      }
    });
  }

  // Position nodes by level
  const updatedNodes = nodes.map(node => {
    const level = Object.keys(levels).find(l => levels[l].includes(node.id)) || 0;
    const nodesInLevel = levels[level] || [node.id];
    const indexInLevel = nodesInLevel.indexOf(node.id);
    
    const totalWidth = nodesInLevel.length * (nodeWidth + horizontalSpacing);
    const startX = -totalWidth / 2 + 400; // Center around x=400
    
    return {
      ...node,
      position: {
        x: startX + indexInLevel * (nodeWidth + horizontalSpacing),
        y: 100 + parseInt(level) * (nodeHeight + verticalSpacing)
      }
    };
  });

  return updatedNodes;
};

export default {
  alignNodes,
  distributeNodes,
  snapToGrid,
  autoArrangeNodes
};
