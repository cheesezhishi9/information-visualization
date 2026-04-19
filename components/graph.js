import {useEffect, useRef} from 'react'; 
import * as d3 from 'd3';
import { getNodes } from '../utils/getNodes';
import { getLinks } from '../utils/getLinks';   
import {drag} from '../utils/drag';


export function Graph(props) {
        const { margin, svg_width, svg_height, data } = props;

        const nodes = getNodes({rawData: data});
        const links = getLinks({rawData: data});
    
        const width = svg_width - margin.left - margin.right;
        const height = svg_height - margin.top - margin.bottom;

        const lineWidth = d3.scaleLinear().range([2, 6]).domain([d3.min(links, d => d.value), d3.max(links, d => d.value)]);
        const radius = d3.scaleLinear().range([10, 50])
                .domain([d3.min(nodes, d => d.value), d3.max(nodes, d => d.value)]);
        const color = d3.scaleOrdinal().range(d3.schemeCategory10).domain(nodes.map( d => d.name));
        
        const d3Selection = useRef();
        useEffect( ()=>{
            const simulation =  d3.forceSimulation(nodes)
                .force("link", d3.forceLink(links).id(d => d.name).distance(d => 20/d.value))
                .force("charge", d3.forceManyBody())
                .force("centrer", d3.forceCenter(width/2, height/2))
                .force("y", d3.forceY([height/2]).strength(0.02))
                .force("collide", d3.forceCollide().radius(d => radius(d.value)+20))
                .tick(3000);
            
            let g = d3.select(d3Selection.current);

            // --- Tooltip ---
            const tooltip = d3.select("body")
                .append("div")
                .attr("class", "graph-tooltip")
                .style("position", "absolute")
                .style("background", "rgba(0,0,0,0.75)")
                .style("color", "#fff")
                .style("padding", "6px 10px")
                .style("border-radius", "4px")
                .style("font-size", "13px")
                .style("pointer-events", "none")
                .style("opacity", 0);

            const onMouseOver = function(event, d) {
                tooltip
                    .style("opacity", 1)
                    .text(d.name);
            };

            const onMouseMove = function(event) {
                tooltip
                    .style("left", (event.pageX + 12) + "px")
                    .style("top",  (event.pageY - 28) + "px");
            };

            const onMouseOut = function() {
                tooltip.style("opacity", 0);
            };
            // --- End Tooltip ---

            const link = g.append("g")
                .attr("stroke", "#999")
                .attr("stroke-opacity", 0.6)
                .selectAll("line")
                .data(links)
                .join("line")
                .attr("stroke-width", d => lineWidth(d.value));

            const node = g.append("g")
                .attr("stroke", "#fff")
                .attr("stroke-width", 1.5)
                .selectAll("circle")
                .data(nodes)
                .enter();

            const point = node.append("circle")
                .attr("r", d => radius(d.value))
                .attr("fill", d => color(d.name))
                .call(drag(simulation))
                // --- Attach mouse events ---
                .on("mouseover", onMouseOver)
                .on("mousemove", onMouseMove)
                .on("mouseout",  onMouseOut);

            // --- Legend ---
            const legendSpacing = 24;
            const legendRectSize = 14;
            const legend = g.append("g")
                .attr("class", "legend")
                .attr("transform", `translate(0, 0)`);

            nodes.forEach((d, i) => {
                const legendRow = legend.append("g")
                    .attr("transform", `translate(0, ${i * legendSpacing})`);

                legendRow.append("rect")
                    .attr("width", legendRectSize)
                    .attr("height", legendRectSize)
                    .attr("fill", color(d.name));

                legendRow.append("text")
                    .attr("x", legendRectSize + 6)
                    .attr("y", legendRectSize - 2)
                    .style("font-size", "13px")
                    .style("fill", "black")
                    .attr("stroke", "none")
                    .text(d.name);
            });

            simulation.on("tick", () => {
                link
                    .attr("x1", d => d.source.x)
                    .attr("y1", d => d.source.y)
                    .attr("x2", d => d.target.x)
                    .attr("y2", d => d.target.y);

                point
                    .attr("cx", d => d.x)
                    .attr("cy", d => d.y);
            });

            // Cleanup tooltip on unmount
            return () => {
                tooltip.remove();
            };

        }, [width, height])


        return <svg 
            viewBox={`0 0 ${svg_width} ${svg_height}`}
            preserveAspectRatio="xMidYMid meet"
            style={{ width: "100%", height: "100%" }}
            > 
                <g ref={d3Selection} transform={`translate(${margin.left}, ${margin.top})`}>
                </g>
            </svg>
    };