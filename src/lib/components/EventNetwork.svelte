<script lang="ts">
  import { onMount } from "svelte";
  import * as d3 from "d3";
  import type { NDKEvent } from "@nostr-dev-kit/ndk";

  export let events: NDKEvent[] = [];

  let svg: SVGSVGElement;
  let isDarkMode = false;
  const nodeRadius = 20;
  const dragRadius = 45;
  const linkDistance = 120;
  let container: HTMLDivElement;
  let width: number;
  let height: number;

  // Reactive statement for container dimensions
  $: if (container) {
    width = container.clientWidth || 800;
    height = container.clientHeight || 600;
  }

  // Type definitions for network components
  interface NetworkNode extends d3.SimulationNodeDatum {
    id: string;
    event?: NDKEvent;
    index?: number;
    isContainer: boolean;
    title: string;
    content: string;
    author: string;
    type: "Index" | "Content";
    x?: number;
    y?: number;
    fx?: number | null;
    fy?: number | null;
  }

  interface NetworkLink extends d3.SimulationLinkDatum<NetworkNode> {
    source: NetworkNode;
    target: NetworkNode;
    isSequential: boolean;
  }

  // Create an efficient event map for O(1) lookups
  function createEventMap(events: NDKEvent[]): Map<string, NDKEvent> {
    return new Map(events.map((event) => [event.id, event]));
  }

  function getNode(
    id: string,
    nodeMap: Map<string, NetworkNode>,
    event?: NDKEvent,
    index?: number,
  ): NetworkNode | null {
    if (!id) return null;

    if (!nodeMap.has(id)) {
      const node: NetworkNode = {
        id,
        event,
        index,
        isContainer: event?.kind === 30040,
        title: event?.getMatchingTags("title")?.[0]?.[1] || "Untitled",
        content: event?.content || "",
        author: event?.pubkey || "",
        type: event?.kind === 30040 ? "Index" : "Content",
      };
      nodeMap.set(id, node);
    }
    return nodeMap.get(id) || null;
  }

  function getEventColor(eventId: string): string {
    const num = parseInt(eventId.slice(0, 4), 16);
    const hue = num % 360;
    return `hsl(${hue}, 70%, 75%)`;
  }

  function generateGraph(events: NDKEvent[]): {
    nodes: NetworkNode[];
    links: NetworkLink[];
  } {
    const nodes: NetworkNode[] = [];
    const links: NetworkLink[] = [];
    const nodeMap = new Map<string, NetworkNode>();
    const eventMap = createEventMap(events);

    const indexEvents = events.filter((e) => e.kind === 30040);

    indexEvents.forEach((index) => {
      if (!index.id) return;

      const contentRefs = index.getMatchingTags("e");
      const sourceNode = getNode(index.id, nodeMap, index);
      if (!sourceNode) return;
      nodes.push(sourceNode);

      contentRefs.forEach((tag, idx) => {
        if (!tag[1]) return;

        // Use O(1) lookup instead of O(n) find operation
        const targetEvent = eventMap.get(tag[1]);
        if (!targetEvent) return;

        const targetNode = getNode(tag[1], nodeMap, targetEvent, idx);
        if (!targetNode) return;
        nodes.push(targetNode);

        const prevNodeId =
          idx === 0 ? sourceNode.id : contentRefs[idx - 1]?.[1];
        const prevNode = nodeMap.get(prevNodeId);

        if (prevNode && targetNode) {
          links.push({
            source: prevNode,
            target: targetNode,
            isSequential: true,
          });
        }
      });
    });

    return { nodes, links };
  }

  function setupDragHandlers(
    simulation: d3.Simulation<NetworkNode, undefined>,
  ) {
    // Create drag behavior with proper typing
    const dragBehavior = d3
      .drag<SVGGElement, NetworkNode>()
      .on(
        "start",
        (
          event: d3.D3DragEvent<SVGGElement, NetworkNode, NetworkNode>,
          d: NetworkNode,
        ) => {
          // Warm up simulation when drag starts
          if (!event.active) simulation.alphaTarget(0.3).restart();
          // Fix node position during drag
          d.fx = d.x;
          d.fy = d.y;
        },
      )
      .on(
        "drag",
        (
          event: d3.D3DragEvent<SVGGElement, NetworkNode, NetworkNode>,
          d: NetworkNode,
        ) => {
          // Update fixed position to drag position
          d.fx = event.x;
          d.fy = event.y;
        },
      )
      .on(
        "end",
        (
          event: d3.D3DragEvent<SVGGElement, NetworkNode, NetworkNode>,
          d: NetworkNode,
        ) => {
          // Cool down simulation when drag ends
          if (!event.active) simulation.alphaTarget(0);
          // Release fixed position, allowing forces to take over
          d.fx = null;
          d.fy = null;
        },
      );

    return dragBehavior;
  }

  function drawNetwork() {
    if (!svg || !events?.length) return;

    const { nodes, links } = generateGraph(events);
    if (!nodes.length) return;

    const svgElement = d3.select(svg).attr("viewBox", `0 0 ${width} ${height}`);

    let g = svgElement.select("g");

    // Only create the base group and zoom behavior if it doesn't exist
    if (g.empty()) {
      const zoom = d3
        .zoom<SVGSVGElement, unknown>()
        .scaleExtent([0.1, 4])
        .on("zoom", (event) => {
          g.attr("transform", event.transform);
        });

      svgElement.call(zoom);
      g = svgElement.append("g");

      // Define arrow marker only once
      const marker = g
        .append("defs")
        .selectAll("marker")
        .data(["arrowhead"])
        .join("marker")
        .attr("id", "arrowhead")
        .attr("viewBox", "0 -5 20 20")
        .attr("refX", nodeRadius + 10)
        .attr("refY", 0)
        .attr("markerWidth", 8)
        .attr("markerHeight", 8)
        .attr("orient", "auto");

      marker
        .append("path")
        .attr("d", "M -8,-5 L 0, 0 L -8, 5 Z")
        .attr("class", "network-link-leather");
    }

    // Set up force simulation
    const simulation = d3
      .forceSimulation<NetworkNode>(nodes)
      .force(
        "link",
        d3
          .forceLink<NetworkNode, NetworkLink>(links)
          .id((d) => d.id)
          .distance(linkDistance),
      )
      .force("charge", d3.forceManyBody().strength(-500))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("x", d3.forceX(width / 2).strength(0.1))
      .force("y", d3.forceY(height / 2).strength(0.1))
      .force("collision", d3.forceCollide().radius(nodeRadius * 2.5));

    // Create drag handler
    const dragHandler = setupDragHandlers(simulation);

    // Update links with enter/update/exit pattern
    const link = g
      .selectAll<SVGPathElement, NetworkLink>("path.link")
      .data(links, (d: NetworkLink) => `${d.source.id}-${d.target.id}`)
      .join(
        (enter) =>
          enter
            .append("path")
            .attr("class", "network-link-leather link")
            .attr("stroke-width", 2)
            .attr("fill", "none")
            .attr("marker-end", "url(#arrowhead)"),
        (update) => update,
        (exit) => exit.remove(),
      );

    // Update nodes with enter/update/exit pattern
    const node = g
      .selectAll<SVGGElement, NetworkNode>("g.node")
      .data(nodes, (d: NetworkNode) => d.id)
      .join(
        (enter) => {
          const nodeEnter = enter
            .append("g")
            .attr("class", "node network-node-leather")
            .call(dragHandler);

          // Add drag circle
          nodeEnter
            .append("circle")
            .attr("r", dragRadius)
            .attr("fill", "transparent")
            .style("cursor", "move");

          // Add visible node circle
          nodeEnter
            .append("circle")
            .attr("r", nodeRadius)
            .attr("stroke", "#000000")
            .attr("stroke-width", 2);

          // Add text labels
          nodeEnter
            .append("text")
            .attr("dy", "0.35em")
            .attr("text-anchor", "middle")
            .attr("fill", "#000000")
            .attr("font-size", "12px")
            .attr("font-weight", "bold");

          return nodeEnter;
        },
        (update) => update,
        (exit) => exit.remove(),
      );

    // Update node appearances
    node
      .select("circle:nth-child(2)")
      .attr("fill", (d) =>
        !d.isContainer
          ? isDarkMode
            ? "#342718"
            : "#d6c1a8"
          : getEventColor(d.id),
      );

    node.select("text").text((d) => (d.isContainer ? "I" : "C"));

    // Handle simulation updates
    simulation.on("tick", () => {
      // Update link positions
      link.attr("d", (d) => {
        const dx = d.target.x! - d.source.x!;
        const dy = d.target.y! - d.source.y!;
        const angle = Math.atan2(dy, dx);
        const startX = d.source.x! + nodeRadius * Math.cos(angle);
        const startY = d.source.y! + nodeRadius * Math.sin(angle);
        const endX = d.target.x! - nodeRadius * Math.cos(angle);
        const endY = d.target.y! - nodeRadius * Math.sin(angle);
        return `M${startX},${startY}L${endX},${endY}`;
      });

      // Update node positions
      node.attr("transform", (d) => `translate(${d.x},${d.y})`);
    });
  }

  // Setup and cleanup
  onMount(() => {
    isDarkMode = document.body.classList.contains("dark");

    // Watch for theme changes
    const themeObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === "class") {
          const newIsDarkMode = document.body.classList.contains("dark");
          if (newIsDarkMode !== isDarkMode) {
            isDarkMode = newIsDarkMode;
            drawNetwork();
          }
        }
      });
    });

    // Watch for container size changes
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        width = entry.contentRect.width;
        height = entry.contentRect.height || width * 0.6;
      }
      if (svg) drawNetwork();
    });

    // Start observers
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    resizeObserver.observe(container);

    // Cleanup function
    return () => {
      themeObserver.disconnect();
      resizeObserver.disconnect();
    };
  });

  // Reactive redraw
  $: {
    if (svg && events?.length) {
      drawNetwork();
    }
  }
</script>

# /lib/components/EventNetwork.svelte
<div class="w-full h-[600px]" bind:this={container}>
  <svg
    bind:this={svg}
    class="w-full h-full border border-gray-300 dark:border-gray-700 rounded"
  />
  <div
    class="mt-4 p-4 bg-primary-0 dark:bg-primary-1000 rounded-lg shadow border border-gray-200 dark:border-gray-800"
  >
    <h3 class="text-lg font-bold mb-2 text-gray-800 dark:text-gray-300">
      Legend
    </h3>
    <ul class="list-disc pl-5 space-y-2 text-gray-800 dark:text-gray-300">
      <li class="flex items-center">
        <div class="relative w-6 h-6 mr-2">
          <!-- Increased size to match network -->
          <span
            class="absolute inset-0 rounded-full border-2 border-black"
            style="background-color: hsl(200, 70%, 75%)"
          />
          <span
            class="absolute inset-0 flex items-center justify-center text-black"
            style="font-size: 12px;">I</span
          >
        </div>
        <span>Index events (kind 30040) - Each with a unique pastel color</span>
      </li>
      <li class="flex items-center">
        <div class="relative w-6 h-6 mr-2">
          <span
            class="absolute inset-0 rounded-full border-2 border-black bg-gray-700 dark:bg-gray-300"
            style="background-color: #d6c1a8"
          />
          <span
            class="absolute inset-0 flex items-center justify-center text-black"
            style="font-size: 12px;  ">C</span
          >
        </div>
        <span>Content events (kind 30041) - Publication sections</span>
      </li>
      <li class="flex items-center">
        <svg class="w-6 h-6 mr-2" viewBox="0 0 24 24">
          <path
            d="M4 12h16M16 6l6 6-6 6"
            class="network-link-leather"
            stroke-width="2"
            stroke-linecap="round"
            marker-end="url(#arrowhead)"
          />
        </svg>
        <span>Arrows indicate reading/sequence order</span>
      </li>
    </ul>
  </div>
</div>
