import React, { useEffect, useRef } from 'react';
import * as d3 from "d3";
import wrap from "../utils/textWrap";
import { format, parseISO } from 'date-fns';
import { Button } from '@mui/material';
import { useMapContext } from '../../context/MapContext';
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
 * @param {string} props.frequency - Data frequency (daily, monthly, yearly)
 */

export default function RainfallLineGraph({
  stationData,
  selectedType,
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
    console.log(selectedType);
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
      
      // Set margins with adjusted right margin for legend
      const margin = { 
        top: 50, 
        right: maxLegendWidth + 30, // Add padding to legend width
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
      var typeString, units;
      const stationSeries = [];

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
            rainfall: d.rainfall !== undefined ? parseFloat(d.rainfall) : null,
            stationId: station.id,
            stationName: station.name,
            year: d.year,
            month: d.month
          };
        });
        
        // Filter out points with null dates, NaN rainfall values, or rainfall === null
        const rainfallPoints = stationPoints.filter(d => {
          return d.date && 
                 d.rainfall !== null && 
                 !isNaN(d.rainfall) && 
                 d.rainfall !== undefined;
        }).map(d => ({
          date: d.date,
          dataPoint: d.rainfall,
          month: d.month,
          year: d.year
      }));
        

        const maxTempStationPoints = stationPoints.filter(d => {
          return d.date && 
                 d.max_temp !== null && 
                 !isNaN(d.max_temp) && 
                 d.max_temp !== undefined;
        }).map(d => ({
          date: d.date,
          dataPoint: d.max_temp,
          month: d.month,
          year: d.year
      }));

        const minTempStationPoints = stationPoints.filter(d => {
          return d.date && 
                 d.min_temp !== null && 
                 !isNaN(d.min_temp) && 
                 d.min_temp !== undefined;
        }).map(d => ({
            date: d.date,
            dataPoint: d.min_temp,
            month: d.month,
            year: d.year
        }));

        switch (selectedType) {
          case "rainfall":
            var dataPoints = rainfallPoints;
            typeString = "Rainfall";
            units = 'mm';
            break;
          case "max_temp":
            var dataPoints = maxTempStationPoints;
            units = '°C';
            typeString = "Maximum Temperature";
            break;
          case "min_temp":
            var dataPoints = minTempStationPoints;
            units = '°C';
            typeString = "Minimum Temperature";
            break;
          default:
            console.log("No data type selected");
        }
        
        if (dataPoints.length > 0) {
          allDataPoints = [...allDataPoints, ...dataPoints];
          stationSeries.push({
            id: station.id,
            name: station.name,
            color: station.color,
            values: dataPoints
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
        .domain([0, d3.max(allDataPoints, d => d.dataPoint) * 1.1]) // Add 10% padding on top
        .range([graphHeight, 0]);

      // Line generator
      const line = d3.line()
        .defined(d => {
          return d.dataPoint !== null && 
                 !isNaN(d.dataPoint) && 
                 d.dataPoint !== undefined;
        })
        .x(d => x(d.date))
        .y(d => y(d.dataPoint));
      
      let dateFormat;
      switch (frequency) {
        case 'daily': { dateFormat = {timeZone: 'Australia/Melbourne', day: 'numeric', month: 'short', year: 'numeric'}; break; }
        case 'monthly': { dateFormat = {month: 'short', year: 'numeric'}; break; }
        case 'yearly': { dateFormat = {year: 'numeric'}; break; }
        default: { console.log('Invalid frequency type') }
      } 

      // Add chart title with frequency indication
      let titleText = `${typeString} from ${dateRange.startDate.toLocaleString('en-GB',dateFormat)} to ${dateRange.endDate.toLocaleString('en-GB',dateFormat)}`;
      if (frequency === 'monthly') {
        titleText += ' (Monthly)';
      } else if (frequency === 'yearly') {
        titleText += ' (Yearly)';
      }
      
      svg.append('text')
        .attr('x', graphWidth / 2)
        .attr('y', -20)
        .attr('text-anchor', 'middle')
        .style('font-size', '18px')  // Slightly increased font size
        .style('font-weight', 'bold')
        .text(titleText);
      
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
        .text(`${typeString} (${units})`);

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
            d.dataPoint !== null && 
            !isNaN(d.dataPoint) && 
            d.dataPoint !== undefined
          ))
          .enter()
          .append('circle')
          .attr('class', `dot-${station.id}`)
          .attr('cx', d => x(d.date))
          .attr('cy', d => y(d.dataPoint))
          .attr('r', 3.5)
          .attr('fill', station.color)
          
          // Mouse events for dots
          .on('mouseover', function(event, d) {
            d3.select(this)
              .transition()
              .duration(100)
              .attr('r', 5);
  
            tooltip.transition()
              .duration(100)
              .style('opacity', 0.8);
            
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
                <span style="font-weight: bold;">${typeString}:</span> ${d.dataPoint.toFixed(1)} ${units}
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
              .attr('r', 3.5);
            
            tooltip.transition()
              .duration(500)
              .style('opacity', 0);
          });
      });
      
      // Add background rectangle for legend to make it more visible
      const legendBg = svg.append('rect')
        .attr('x', graphWidth + 5)
        .attr('y', -20)
        .attr('width', maxLegendWidth)
        .attr('height', stationSeries.length * 25 + 30)
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
      // Add legend items with improved text wrapping
      stationSeries.forEach((station, i) => {
        const legendItem = legend.append('g')
          .attr('transform', `translate(0, ${(lineNumber+i) * 25 + 15})`);
        
        // Color rectangle
        legendItem.append('rect')
          .attr('width', 15)
          .attr('height', 3)
          .attr('fill', station.color);
        
        // Station name with proper wrapping
        const nameText = legendItem.append('text')
          .attr('x', 20)
          .attr('y', 3)
          .attr('width', maxLegendWidth - 25) // Set width for text wrapping
          .style('font-size', '12px')
          .text(station.name);
        
        // Apply text wrapping if name is too long
        const words = station.name.split(/\s+/).reverse();
        let tspan = nameText.text(null).append("tspan")
          .attr("x", 20)
          .attr("y", 3)
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
              legendBg.attr("height", stationSeries.length * 25 + (lineNumber+i) * 25 -10)
            }
        }
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
    
  }, [stationData, selectedType, loading, error, height, frequency]);
  
  return (
    <div 
      ref={chartRef} 
      style={{ 
        width: width, 
        height: height,
        position: 'relative'
      }}
    ></div>
  );
}