import React, { useEffect, useRef } from 'react';
import * as d3 from "d3";
import { format, parseISO } from 'date-fns';

/**
 * RainfallLineGraph Component
 * Renders a D3.js line chart comparing rainfall data across multiple stations
 * 
 * @param {Object} props - Component props
 * @param {Object} props.stationData - Object containing station data for comparison
 * @param {boolean} props.loading - Whether data is currently loading
 * @param {string} props.error - Error message if any
 * @param {number} props.width - Width of the chart (default: 100%)
 * @param {number} props.height - Height of the chart (default: 300)
 */
export default function RainfallLineGraph({
  stationData,
  loading = false,
  error = null,
  width = '100%',
  height = 300
}) {
  const chartRef = useRef(null);

  // Create/update chart when data changes or container resizes
  useEffect(() => {
    if (loading || error || !stationData || Object.keys(stationData).length === 0) {
      return;
    }

    // Clear previous chart
    if (chartRef.current) {
      d3.select(chartRef.current).selectAll('*').remove();
    }

    const renderChart = () => {
      // Get container dimensions
      const container = chartRef.current;
      const containerWidth = container.clientWidth;
      const containerHeight = height;
      
      // Set margins
      const margin = { top: 20, right: 80, bottom: 50, left: 50 };
      const graphWidth = containerWidth - margin.left - margin.right;
      const graphHeight = containerHeight - margin.top - margin.bottom;

      // Create SVG element
      const svg = d3.select(container)
        .append('svg')
          .attr('width', containerWidth)
          .attr('height', containerHeight)
        .append('g')
          .attr('transform', `translate(${margin.left},${margin.top})`);

      // Prepare data for the chart
      let allDataPoints = [];
      const stationSeries = [];

      // Process and combine all data points
      Object.values(stationData).forEach(station => {
        if (!station.data || station.data.length === 0) return;

        const stationPoints = station.data.map(d => ({
          date: d.date ? (typeof d.date === 'string' ? parseISO(d.date) : d.date) : null,
          rainfall: d.rainfall !== undefined ? parseFloat(d.rainfall) : null,
          stationId: station.id,
          stationName: station.name
        }))
        // Filter out points with null dates, NaN rainfall values, or rainfall === null
        .filter(d => {
          return d.date && 
                 d.rainfall !== null && 
                 !isNaN(d.rainfall) && 
                 d.rainfall !== undefined;
        });

        if (stationPoints.length > 0) {
          allDataPoints = [...allDataPoints, ...stationPoints];
          stationSeries.push({
            id: station.id,
            name: station.name,
            color: station.color,
            values: stationPoints
          });
        }
      });

      // If no data points, show a message
      if (allDataPoints.length === 0) {
        svg.append('text')
          .attr('x', graphWidth / 2)
          .attr('y', graphHeight / 2)
          .attr('text-anchor', 'middle')
          .text('No rainfall data available for the selected period.');
        return;
      }

      // Sort data chronologically for proper line drawing
      allDataPoints.sort((a, b) => a.date - b.date);
      stationSeries.forEach(station => {
        station.values.sort((a, b) => a.date - b.date);
      });

      // Set up scales
      const x = d3.scaleTime()
        .domain(d3.extent(allDataPoints, d => d.date))
        .range([0, graphWidth]);

      const y = d3.scaleLinear()
        .domain([0, d3.max(allDataPoints, d => d.rainfall) * 1.1]) // Add 10% padding on top
        .range([graphHeight, 0]);

      // Line generator
      const line = d3.line()
        .defined(d => {
          return d.rainfall !== null && 
                 !isNaN(d.rainfall) && 
                 d.rainfall !== undefined;
        })
        .x(d => x(d.date))
        .y(d => y(d.rainfall))
        .curve(d3.curveMonotoneX); // Smooth curve

      // Add X axis
      svg.append('g')
        .attr('transform', `translate(0,${graphHeight})`)
        .call(d3.axisBottom(x).ticks(6).tickFormat(d3.timeFormat('%d %b %Y')))
        .selectAll('text')
          .style('text-anchor', 'end')
          .attr('dx', '-.8em')
          .attr('dy', '.15em')
          .attr('transform', 'rotate(-45)');
      
      // Add X axis label
      svg.append('text')
        .attr('x', graphWidth / 2)
        .attr('y', graphHeight + margin.bottom - 5)
        .attr('text-anchor', 'middle')
        .style('font-size', '12px')
        .text('Date');

      // Add Y axis
      svg.append('g')
        .call(d3.axisLeft(y))
        .append('text')
        .attr('fill', '#000')
        .attr('transform', 'rotate(-90)')
        .attr('y', -40)
        .attr('x', -graphHeight / 2)
        .attr('text-anchor', 'middle')
        .text('Rainfall (mm)');

      // Add grid lines
      svg.append('g')
        .attr('class', 'grid')
        .call(d3.axisLeft(y)
          .tickSize(-graphWidth)
          .tickFormat(''))
        .selectAll('line')
          .style('stroke', '#e0e0e0')
          .style('stroke-opacity', '0.7')
          .style('shape-rendering', 'crispEdges');
      
      svg.selectAll('.grid .domain')
        .style('stroke', 'none');

      // Draw lines for each station
      stationSeries.forEach(station => {
        svg.append('path')
          .datum(station.values)
          .attr('class', 'line')
          .attr('d', line)
          .attr('fill', 'none')
          .attr('stroke', station.color)
          .attr('stroke-width', 2);
        
        // Add dots for each data point
        svg.selectAll(`.dot-${station.id}`)
          .data(station.values.filter(d => 
            d.rainfall !== null && 
            !isNaN(d.rainfall) && 
            d.rainfall !== undefined
          ))
          .enter()
          .append('circle')
          .attr('class', `dot-${station.id}`)
          .attr('cx', d => x(d.date))
          .attr('cy', d => y(d.rainfall))
          .attr('r', 3.5)
          .attr('fill', station.color)
          .attr('stroke', '#fff')
          .attr('stroke-width', 1.5);
      });

      // Add a legend
      const legend = svg.append('g')
        .attr('class', 'legend')
        .attr('transform', `translate(${graphWidth + 5}, 0)`);

      stationSeries.forEach((station, i) => {
        const legendItem = legend.append('g')
          .attr('transform', `translate(0, ${i * 20})`);
        
        legendItem.append('rect')
          .attr('width', 15)
          .attr('height', 2)
          .attr('fill', station.color);
        
        legendItem.append('text')
          .attr('x', 20)
          .attr('y', 5)
          .style('font-size', '12px')
          .text(station.name);
      });

      // Add tooltip container
      const tooltip = d3.select(container)
        .append('div')
        .attr('class', 'tooltip')
        .style('opacity', 0)
        .style('position', 'absolute')
        .style('background-color', 'white')
        .style('border', '1px solid #ddd')
        .style('border-radius', '4px')
        .style('padding', '10px')
        .style('pointer-events', 'none')
        .style('box-shadow', '0 2px 5px rgba(0,0,0,0.1)');

      // Add interactive overlay
      svg.append('rect')
        .attr('class', 'overlay')
        .attr('width', graphWidth)
        .attr('height', graphHeight)
        .attr('fill', 'none')
        .attr('pointer-events', 'all')
        .on('mousemove', function(event) {
          const pointer = d3.pointer(event);
          const xDate = x.invert(pointer[0]);
          
          // Find the closest data point to the mouse position
          let closestPoint = null;
          let minDistance = Infinity;
          
          allDataPoints.forEach(d => {
            const distance = Math.abs(d.date - xDate);
            if (distance < minDistance) {
              minDistance = distance;
              closestPoint = d;
            }
          });
          
          if (closestPoint) {
            // Get all points for the same date
            const pointsOnDate = allDataPoints.filter(d => 
              format(d.date, 'yyyy-MM-dd') === format(closestPoint.date, 'yyyy-MM-dd')
            );
            
            // Highlight points
            svg.selectAll('circle')
              .attr('r', 3.5)
              .attr('stroke-width', 1.5);
            
            pointsOnDate.forEach(p => {
              svg.selectAll(`.dot-${p.stationId}`)
                .filter(d => format(d.date, 'yyyy-MM-dd') === format(p.date, 'yyyy-MM-dd'))
                .attr('r', 5)
                .attr('stroke-width', 2);
            });
            
            // Show tooltip
            tooltip.style('opacity', 0.9);
            tooltip.html(`<strong>${format(closestPoint.date, 'MMMM d, yyyy')}</strong><br/>`)
              .style('left', `${event.offsetX + 10}px`)
              .style('top', `${event.offsetY - 28}px`);
            
            // Add each station's rainfall to the tooltip
            pointsOnDate.forEach(p => {
              if (p.rainfall !== null && !isNaN(p.rainfall) && p.rainfall !== undefined) {
                tooltip.html(tooltip.html() + `${p.stationName}: ${p.rainfall.toFixed(1)} mm<br/>`);
              } else {
                tooltip.html(tooltip.html() + `${p.stationName}: No data<br/>`);
              }
            });
          }
        })
        .on('mouseout', function() {
          // Reset point sizes
          svg.selectAll('circle')
            .attr('r', 3.5)
            .attr('stroke-width', 1.5);
          
          // Hide tooltip
          tooltip.style('opacity', 0);
        });
    };

    renderChart();

    // Add window resize handler for responsiveness
    const handleResize = () => {
      if (chartRef.current) {
        d3.select(chartRef.current).selectAll('*').remove();
        renderChart();
      }
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [stationData, loading, error, height]);

  return (
    <div 
      ref={chartRef}
      style={{ 
        width: width, 
        height: height, 
        position: 'relative',
        backgroundColor: '#fff',
        borderRadius: '8px',
        border: '1px solid #e0e0e0'
      }}
    >
      {loading && (
        <div style={{ 
          position: 'absolute', 
          top: '50%', 
          left: '50%', 
          transform: 'translate(-50%, -50%)'
        }}>
          Loading...
        </div>
      )}
      {error && (
        <div style={{ 
          position: 'absolute', 
          top: '50%', 
          left: '50%', 
          transform: 'translate(-50%, -50%)',
          color: 'red'
        }}>
          {error}
        </div>
      )}
      {!loading && !error && (!stationData || Object.keys(stationData).length === 0) && (
        <div style={{ 
          position: 'absolute', 
          top: '50%', 
          left: '50%', 
          transform: 'translate(-50%, -50%)',
          color: '#666',
          textAlign: 'center'
        }}>
          Select at least two stations and a date range to compare rainfall data
        </div>
      )}
    </div>
  );
}