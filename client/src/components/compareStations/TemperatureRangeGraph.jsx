import React, { useEffect, useRef } from 'react';
import * as d3 from "d3";
import { format, parseISO } from 'date-fns';
import { Card, CardContent, Box, CircularProgress, Alert, Typography } from '@mui/material';
import { useMapContext } from '../../context/MapContext';

/**
 * TemperatureRangeGraph Component
 * Renders a D3.js chart comparing minimum and maximum temperature ranges across multiple stations
 * 
 * @param {Object} props - Component props
 * @param {Object} props.stationData - Object containing station data for comparison
 * @param {boolean} props.loading - Whether data is currently loading
 * @param {string} props.error - Error message if any
 * @param {number} props.width - Width of the chart (default: 100%)
 * @param {number} props.height - Height of the chart (default: 400)
 * @param {string} props.frequency - Data frequency (daily, monthly, yearly)
 */
export default function TemperatureRangeGraph({
  stationData,
  loading = false,
  error = null,
  width = '100%',
  height = 400,
  frequency = 'daily'
}) {
  const { dateRange } = useMapContext();
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
      
      // Calculate max legend width based on station names
      const maxLegendWidth = Math.max(
        ...Object.values(stationData).map(station => station.name.length * 7), 
        150
      ); // At least 150px or calculated width
      
      // Set margins
      const margin = { 
        top: 50, 
        right: maxLegendWidth + 30, 
        bottom: 60, 
        left: 60 
      };
      
      const graphWidth = containerWidth - margin.left - margin.right;
      const graphHeight = containerHeight - margin.top - margin.bottom;

      // Create SVG element
      const svg = d3.select(container)
        .append('svg')
          .attr('width', containerWidth)
          .attr('height', containerHeight)
          .attr('id', 'chart')
          .style("background", "white")
        .append('g')
          .attr('transform', `translate(${margin.left},${margin.top})`);

      // Prepare data for the chart
      let allDataPoints = [];
      const stationSeries = [];
      const units = 'Celcius';

      // Process and combine all data points
      Object.values(stationData).forEach(station => {
        if (!station.data || station.data.length === 0) return;
        
        // Map data points based on frequency
        const stationPoints = station.data.map(d => {
          const dateValue = d.date ? (typeof d.date === 'string' ? parseISO(d.date) : d.date) : null;
          
          // If frequency is monthly or yearly, ensure we have proper year/month formatting
          let formattedDate = dateValue;
          if (frequency === 'monthly' && d.month && d.year) {
            // For monthly data, use the first day of the month
            formattedDate = new Date(parseInt(d.year), parseInt(d.month) - 1, 1);
          } else if (frequency === 'yearly' && d.year) {
            // For yearly data, use January 1 of that year
            formattedDate = new Date(parseInt(d.year), 0, 1);
          }
          
          return {
            date: formattedDate,
            min_temp: d.min_temp !== undefined ? parseFloat(d.min_temp) : null,
            max_temp: d.max_temp !== undefined ? parseFloat(d.max_temp) : null,
            stationId: station.id,
            stationName: station.name,
            year: d.year,
            month: d.month
          };
        });
        
        // Filter out points where both min and max are missing
        const validPoints = stationPoints.filter(d => {
          return d.date && 
                 ((d.min_temp !== null && !isNaN(d.min_temp)) || 
                  (d.max_temp !== null && !isNaN(d.max_temp)));
        });
        
        if (validPoints.length > 0) {
          allDataPoints = [...allDataPoints, ...validPoints];
          stationSeries.push({
            id: station.id,
            name: station.name,
            color: station.color,
            values: validPoints
          });
        }
      });

      // If no data points, show a message
      if (allDataPoints.length === 0) {
        svg.append('text')
          .attr('x', graphWidth / 2)
          .attr('y', graphHeight / 2)
          .attr('text-anchor', 'middle')
          .style('font-size', '14px')
          .style('font-weight', 'bold')
          .text('No data available for the selected period.');
        return;
      }
      
      // Sort data chronologically for proper display
      allDataPoints.sort((a, b) => a.date - b.date);
      stationSeries.forEach(station => {
        station.values.sort((a, b) => a.date - b.date);
      });

      // Find min and max temperature values across all data points
      const temperatureExtent = [
        d3.min(allDataPoints, d => d.min_temp !== null && !isNaN(d.min_temp) ? d.min_temp : Infinity) * 0.95, // 5% lower
        d3.max(allDataPoints, d => d.max_temp !== null && !isNaN(d.max_temp) ? d.max_temp : -Infinity) * 1.05 // 5% higher
      ];
      
      // Make sure we don't have invalid values
      if (!isFinite(temperatureExtent[0])) temperatureExtent[0] = 0;
      if (!isFinite(temperatureExtent[1])) temperatureExtent[1] = 50; // Default to 50°C if no max temps

      // Set up scales
      const x = d3.scaleTime()
        .domain(d3.extent(allDataPoints, d => d.date))
        .range([0, graphWidth]);

      const y = d3.scaleLinear()
        .domain(temperatureExtent)
        .range([graphHeight, 0]);

      // Line generators
      const minTempLine = d3.line()
        .defined(d => d.min_temp !== null && !isNaN(d.min_temp))
        .x(d => x(d.date))
        .y(d => y(d.min_temp));
        
      const maxTempLine = d3.line()
        .defined(d => d.max_temp !== null && !isNaN(d.max_temp))
        .x(d => x(d.date))
        .y(d => y(d.max_temp));
      
      // Area generator for temperature range
      const temperatureArea = d3.area()
        .defined(d => (d.min_temp !== null && !isNaN(d.min_temp)) && 
                       (d.max_temp !== null && !isNaN(d.max_temp)))
        .x(d => x(d.date))
        .y0(d => y(d.min_temp))
        .y1(d => y(d.max_temp));
      
      // Add title - determine title based on frequency
      let titleSuffix = '';
      if (frequency === 'monthly') {
        titleSuffix = ' (Monthly)';
      } else if (frequency === 'yearly') {
        titleSuffix = ' (Yearly)';
      }
      let dateFormat;
      switch (frequency) {
        case 'daily': { dateFormat = {day: 'numeric', month: 'short', year: 'numeric'}; break; }
        case 'monthly': { dateFormat = {month: 'short', year: 'numeric'}; break; }
        case 'yearly': { dateFormat = {year: 'numeric'}; break; }
        default: { console.log('Invalid frequency type') }
      } 
      svg.append('text')
        .attr('x', graphWidth / 2)
        .attr('y', -20)
        .attr('text-anchor', 'middle')
        .style('font-size', '18px')
        .style('font-weight', 'bold')
        .text(`Temperature Range from ${dateRange.startDate.toLocaleString('en-GB',dateFormat)} to ${dateRange.endDate.toLocaleString('en-GB',dateFormat)}${titleSuffix}`);
      
      // Configure X-axis ticks and format based on frequency
      let xAxisTickFormat;
      let xAxisTicks = 6;
      
      if (frequency === 'daily') {
        xAxisTickFormat = d3.timeFormat('%d %b %Y');
      } else if (frequency === 'monthly') {
        xAxisTickFormat = d3.timeFormat('%b %Y');
        xAxisTicks = Math.min(12, allDataPoints.length);
      } else if (frequency === 'yearly') {
        xAxisTickFormat = d3.timeFormat('%Y');
        xAxisTicks = Math.min(10, allDataPoints.length);
      }
      
      // Add X axis with larger font
      svg.append('g')
        .attr('transform', `translate(0,${graphHeight})`)
        .call(d3.axisBottom(x).ticks(xAxisTicks).tickFormat(xAxisTickFormat))
        .selectAll('text')
        .style('font-size', '12px');
      
      // Add X axis label
      svg.append('text')
        .attr('x', graphWidth / 2)
        .attr('y', graphHeight + margin.bottom - 10)
        .attr('text-anchor', 'middle')
        .style('font-size', '14px')
        .style('font-weight', 'bold')
        .text('Date');
      
      // Add Y axis with larger font
      svg.append('g')
        .call(d3.axisLeft(y))
        .selectAll('text')
        .style('font-size', '12px');
      
      // Add Y axis label
      svg.append('text')
        .attr('fill', '#000')
        .attr('transform', 'rotate(-90)')
        .attr('y', -40)
        .attr('x', -graphHeight / 2)
        .attr('text-anchor', 'middle')
        .style('font-size', '14px')
        .style('font-weight', 'bold')
        .text(`Temperature (${units})`);

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
        .style('box-shadow', '0 2px 5px rgba(0,0,0,0.1)')
        .style('font-size', '13px');
      
      // Add background rectangle for legend to make it more visible
      const legendBg = svg.append('rect')
        .attr('x', graphWidth + 5)
        .attr('y', -20)
        .attr('width', maxLegendWidth)
        .attr('height', stationSeries.length * 50 + 30) // Allow more space for each station
        .attr('fill', 'white')
        .attr('stroke', '#eee')
        .attr('stroke-width', 1)
        .attr('rx', 4)
        .attr('ry', 4);
      
      // Add legend
      const legend = svg.append('g')
        .attr('class', 'legend')
        .attr('transform', `translate(${graphWidth + 15}, 0)`);
      
      // Add legend title
      legend.append('text')
        .attr('x', 0)
        .attr('y', -5)
        .style('font-size', '14px')
        .style('font-weight', 'bold')
        .text('Stations');
      
      var lineNumber = 0;
      // Draw data for each station
      stationSeries.forEach((station, stationIndex) => {
        // Create area for temperature range
        svg.append('path')
          .datum(station.values.filter(d => 
            (d.min_temp !== null && !isNaN(d.min_temp)) && 
            (d.max_temp !== null && !isNaN(d.max_temp))
          ))
          .attr('class', `temp-area-${station.id}`)
          .attr('d', temperatureArea)
          .attr('fill', station.color)
          .attr('opacity', 0.3);
        
        // Create line for minimum temperature
        svg.append('path')
          .datum(station.values.filter(d => d.min_temp !== null && !isNaN(d.min_temp)))
          .attr('class', `min-temp-line-${station.id}`)
          .attr('d', minTempLine)
          .attr('fill', 'none')
          .attr('stroke', station.color)
          .attr('stroke-width', 2)
          .attr('stroke-dasharray', '5,5') // Dashed line for min temp
          .attr('opacity', 0.8);
        
        // Create line for maximum temperature
        svg.append('path')
          .datum(station.values.filter(d => d.max_temp !== null && !isNaN(d.max_temp)))
          .attr('class', `max-temp-line-${station.id}`)
          .attr('d', maxTempLine)
          .attr('fill', 'none')
          .attr('stroke', station.color)
          .attr('stroke-width', 2);
        
        // Add dots for minimum temperature points
        svg.selectAll(`.min-dot-${station.id}`)
          .data(station.values.filter(d => d.min_temp !== null && !isNaN(d.min_temp)))
          .enter()
          .append('circle')
          .attr('class', `min-dot-${station.id}`)
          .attr('cx', d => x(d.date))
          .attr('cy', d => y(d.min_temp))
          .attr('r', 3)
          .attr('fill', station.color)
          .attr('opacity', 0.7)
          .on('mouseover', function(event, d) {
            d3.select(this)
              .transition()
              .duration(100)
              .attr('r', 5);
              
            tooltip.transition()
              .duration(100)
              .style('opacity', 0.9);
              
            // Format date based on frequency
            let dateDisplay;
            if (frequency === 'daily') {
              dateDisplay = format(d.date, 'dd MMM yyyy');
            } else if (frequency === 'monthly') {
              dateDisplay = format(d.date, 'MMMM yyyy');
            } else { // yearly
              dateDisplay = format(d.date, 'yyyy');
            }
              
            const tooltipHtml = `
              <div style="font-weight: bold; margin-bottom: 5px; font-size: 14px;">
                ${station.name}
              </div>
              <div>
                <span style="font-weight: bold;">Date:</span> ${dateDisplay}
              </div>
              <div>
                <span style="font-weight: bold;">Min Temp:</span> ${d.min_temp.toFixed(1)}°C
              </div>
            `;
              
            tooltip.html(tooltipHtml)
              .style('left', `${event.offsetX}px`)
              .style('top', `${event.offsetY}px`);
          })
          .on('mouseout', function() {
            d3.select(this)
              .transition()
              .duration(100)
              .attr('r', 3);
              
            tooltip.transition()
              .duration(500)
              .style('opacity', 0);
          });
          
        // Add dots for maximum temperature points
        svg.selectAll(`.max-dot-${station.id}`)
          .data(station.values.filter(d => d.max_temp !== null && !isNaN(d.max_temp)))
          .enter()
          .append('circle')
          .attr('class', `max-dot-${station.id}`)
          .attr('cx', d => x(d.date))
          .attr('cy', d => y(d.max_temp))
          .attr('r', 3)
          .attr('fill', station.color)
          .on('mouseover', function(event, d) {
            d3.select(this)
              .transition()
              .duration(100)
              .attr('r', 5);
              
            tooltip.transition()
              .duration(100)
              .style('opacity', 0.9);
              
            // Format date based on frequency
            let dateDisplay;
            if (frequency === 'daily') {
              dateDisplay = format(d.date, 'dd MMM yyyy');
            } else if (frequency === 'monthly') {
              dateDisplay = format(d.date, 'MMMM yyyy');
            } else { // yearly
              dateDisplay = format(d.date, 'yyyy');
            }
              
            const tooltipHtml = `
              <div style="font-weight: bold; margin-bottom: 5px; font-size: 14px;">
                ${station.name}
              </div>
              <div>
                <span style="font-weight: bold;">Date:</span> ${dateDisplay}
              </div>
              <div>
                <span style="font-weight: bold;">Max Temp:</span> ${d.max_temp.toFixed(1)}°C
              </div>
            `;
              
            tooltip.html(tooltipHtml)
              .style('left', `${event.offsetX}px`)
              .style('top', `${event.offsetY}px`);
          })
          .on('mouseout', function() {
            d3.select(this)
              .transition()
              .duration(100)
              .attr('r', 3);
              
            tooltip.transition()
              .duration(500)
              .style('opacity', 0);
          });
          
        // Add legend item for this station
        const legendItemY = stationIndex * 50 + lineNumber*50 + 15;
        const legendItem = legend.append('g')
          .attr('transform', `translate(0, ${legendItemY})`);
          
        // Station name
        const nameText = legendItem.append('text')
          .attr('x', 0)
          .attr('y', 0)
          .attr('width', maxLegendWidth - 25)
          .style('font-size', '12px')
          .text(station.name);
          
        // Apply text wrapping if name is too long
        const words = station.name.split(/\s+/).reverse();
        let tspan = nameText.text(null).append("tspan")
          .attr("x", 0)
          .attr("y", 0)
          .text(words[0]);
        var word, line = [];
        while (word = words.pop()) {
          line.push(word);
          tspan.text(line.join(" "));
          if (tspan.node().getComputedTextLength() > 150) {
              line.pop();
              tspan.text(line.join(" "));
              line = [word];
              tspan = nameText.append("tspan")
                              .attr("x", 20)
                              .attr("y", 3)
                              .attr("dy", ++lineNumber * 1.2 + "em")
                              .text(word);
              legendBg.attr("height", stationSeries.length * 50 + (lineNumber+1) * 25)
            }
        }
          
        // Min temp line example
        legendItem.append('line')
          .attr('x1', 0)
          .attr('x2', 20)
          .attr('y1', 15*(lineNumber+1))
          .attr('y2', 15*(lineNumber+1))
          // .attr('transform', `translate(0, ${lineNumber*50})`)
          .attr('stroke', station.color)
          .attr('stroke-width', 2)
          .attr('stroke-dasharray', '5,5')
          .attr('opacity', 0.8);
        
        legendItem.append('text')
          .attr('x', 25)
          .attr('y', 15*lineNumber+19)
          .style('font-size', '10px')
          .text('Min Temp');
          
        // Max temp line example
        legendItem.append('line')
          .attr('x1', 0)
          .attr('x2', 20)
          .attr('y1', 15*(lineNumber+2))
          .attr('y2', 15*(lineNumber+2))
          .attr('stroke', station.color)
          .attr('stroke-width', 2);
          
        legendItem.append('text')
          .attr('x', 25)
          .attr('y', 15*(lineNumber)+34)
          .style('font-size', '10px')
          .text('Max Temp');
      });
    };

    renderChart();
    
    // Add resize event listener for responsive chart
    const handleResize = () => {
      if (chartRef.current) {
        d3.select(chartRef.current).selectAll('*').remove();
        renderChart();
      }
    };
    
    window.addEventListener('resize', handleResize);
    
    // Clean up on unmount
    return () => {
      window.removeEventListener('resize', handleResize);
    };
    
  }, [stationData, loading, error, height, frequency]);

  // Determine if we have data to display
  const hasData = stationData && Object.keys(stationData).length > 0;
  
  return (
    <Card sx={{ 
      mb: 3,
      bgcolor: 'var(--card-bg, #ffffff)',
      borderRadius: '12px',
      boxShadow: 'var(--card-shadow, 0 4px 6px rgba(0, 0, 0, 0.05), 0 1px 3px rgba(0, 0, 0, 0.1))',
    }}>
      <CardContent>
        <Box sx={{ position: 'relative', minHeight: '400px' }}>
          {loading && (
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center', 
              position: 'absolute', 
              top: 0, 
              left: 0, 
              right: 0, 
              bottom: 0,
              backgroundColor: 'rgba(255, 255, 255, 0.7)',
              zIndex: 10
            }}>
              <CircularProgress />
            </Box>
          )}

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {!hasData && !loading && !error && (
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center', 
              height: '400px',
              backgroundColor: 'rgba(0, 0, 0, 0.02)',
              borderRadius: '8px'
            }}>
              <Typography color="text.secondary">
                Select date range to display data
              </Typography>
            </Box>
          )}

          <div 
            ref={chartRef} 
            style={{ 
              width: width, 
              height: height,
              position: 'relative'
            }}
          ></div>
        </Box>
      </CardContent>
    </Card>
  );
} 