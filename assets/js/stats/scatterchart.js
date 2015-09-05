function buildScatterChart(height, width, margins, container) {
  var x = d3.scale.linear().range([0, width]);
  var y = d3.scale.linear().range([height, 0]);

  var xAxis = d3.svg.axis().scale(x).orient("bottom").ticks(5).tickFormat(startTimeFormatter);
  var yAxis = d3.svg.axis().scale(y).orient("left").tickFormat(timeFormatter);

  var svg = buildBaseChart(height, width, margins, container);

  var tip = d3.tip()
    .attr('class', 'd3-tip')
    .offset([-10, 0])
    .html(function(d) {
      return "Date: <strong>" + dateFormatter(d.date) + "</strong><br>Start Time: <strong>" + startTimeFormatter(d.start_time) + "</strong><br>Total Time: <strong>" + timeFormatter(d.total_time) + "</strong><br>Int. Time: <strong>" + timeFormatter(d.intermediate_time) + "</strong>";
    });
  svg.call(tip);

  return {
    svg:   svg,
    x:     x,
    y:     y,
    xAxis: xAxis,
    yAxis: yAxis,
    tip:   tip
  };
}

function alphaGenerator(d, maxDiff) {
  var ratio = Math.abs(d.end_total_time - d.total_time) / maxDiff;
  if (ratio > 0.9) ratio = 0.9;
  return 1 - ratio;
}

function baseScatter(chart, ranges) {
  var diff = (ranges.maxX - ranges.minX) * 0.1;

  chart.x.domain([ranges.minX - diff, ranges.maxX + diff]);
  chart.y.domain([ranges.minY - 600, ranges.maxY + 60]);

  chart.xAxis.tickValues(d3.range(ranges.minX, ranges.maxX + 150, diff));
  chart.yAxis.tickValues(d3.range(Math.floor(ranges.minY / 600) * 600, ranges.maxY, 600));

  chart.svg.append("g")
    .attr("class", "x axis")
    .attr("transform", "translate(0," + ranges.height + ")")
    .call(chart.xAxis);

  chart.svg.append("g")
    .attr("class", "y axis")
    .call(chart.yAxis)
    .append("text")
    .attr("transform", "rotate(-90)")
    .attr("y", 6)
    .attr("dy", ".71em")
    .style("text-anchor", "end")
    .text("Total Time (mins:secs)");
}

function baseIScatter(chart, ranges) {
  var Xdiff = (ranges.maxX - ranges.minX) * 0.1;
  var Ydiff = (ranges.maxY - ranges.minY) * 0.1;

  chart.x.domain([ranges.minX - Xdiff, ranges.maxX + Xdiff]);
  chart.y.domain([ranges.minY - Ydiff, ranges.maxY + Ydiff]);

  chart.xAxis.tickValues(d3.range(ranges.minX, ranges.maxX + 150, Xdiff));
  chart.yAxis.tickValues(d3.range(Math.floor(ranges.minY / 60) * 60, ranges.maxY, Math.round(Ydiff)));

  chart.svg.append("g")
    .attr("class", "x axis")
    .attr("transform", "translate(0," + ranges.height + ")")
    .call(chart.xAxis);

  chart.svg.append("g")
    .attr("class", "y axis")
    .call(chart.yAxis)
    .append("text")
    .attr("transform", "rotate(-90)")
    .attr("y", 6)
    .attr("dy", ".71em")
    .style("text-anchor", "end")
    .text("Intermediate Time (mins:secs)");
}

function addTrendline (chart, xs, ys, c) {
  var minX = d3.min(xs);
  var maxX = d3.max(xs);

  var ls = leastSquares(xs, ys);
  var x1 = minX - 5000;
  var y1 = (ls[0] * x1) + ls[1];
  var x2 = maxX + 5000;
  var y2 = (ls[0] * x2) + ls[1];

  var trend = [[x1, y1, x2, y2]];

  chart.svg.selectAll("." + c)
    .data(trend)
    .enter().append("line")
    .attr("class", c)
    .attr("x1", function(d) { return chart.x(d[0]) })
    .attr("y1", function(d) { return chart.y(d[1]) })
    .attr("x2", function(d) { return chart.x(d[2]) })
    .attr("y2", function(d) { return chart.y(d[3]) })
    .attr("stroke", "darkgreen")
    .attr("stroke-width", 1);

  chart.svg.append("text")
    .attr("x", chart.svg.attr("width") + 100)
    .attr("y", chart.svg.attr("height") + 100)
    .attr("dy", ".71em")
    .attr("class", "text-label")
    .style("fill", "black")
    .text("RSq: " + ls[2]);

  var generator = function(x) {
    return x * ls[0] + ls[1];
  }
  return generator;
}

function populateScatterChart(chart, data, height, width, min, max) {
  var startTimes = data.map(function(d) { return d.start_time });
  var totals     = data.map(function(d) { return d.total_time });

  var minStart = d3.min(startTimes);
  var maxStart = d3.max(startTimes);

  var ranges = {
    height: height,
    minX: minStart,
    maxX: maxStart,
    minY: min,
    maxY: max
  };
  baseScatter(chart, ranges);

  chart.svg.selectAll(".dot")
    .data(data)
    .enter().append("circle")
    .attr("class", "dot")
    .attr("r", 2)
    .attr("cx", function(d) { return chart.x(d.start_time); })
    .attr("cy", function(d) { return chart.y(d.total_time); })
    .on('mouseover', chart.tip.show)
    .on('mouseout', chart.tip.hide);

  addTrendline(chart, startTimes, totals, "scatter");
}

function populateIScatterChart(chart, data, height, width) {
  var startTimes = data.map(function(d) { return d.start_time });
  var totals     = data.map(function(d) { return d.intermediate_time });

  var minStart = d3.min(startTimes);
  var maxStart = d3.max(startTimes);
  var minTotal = d3.min(totals);
  var maxTotal = d3.max(totals);

  var ranges = {
    height: height,
    minX: minStart,
    maxX: maxStart,
    minY: minTotal,
    maxY: maxTotal,
  };
  baseIScatter(chart, ranges);
  chart.svg.selectAll(".dot")
    .data(data)
    .enter().append("circle")
    .attr("class", "dot")
    .attr("r", 2)
    .attr("cx", function(d) { return chart.x(d.start_time); })
    .attr("cy", function(d) { return chart.y(d.intermediate_time); })
    .on('mouseover', chart.tip.show)
    .on('mouseout', chart.tip.hide);

  addTrendline(chart, startTimes, totals, "scatter");
}

function populateRelationChart(chart, data, height, width, min, max) {
  var startTimes = data.map(function(d) { return d.start_time });
  var totals     = data.map(function(d) { return d.total_time });

  var minStart = d3.min(startTimes);
  var maxStart = d3.max(startTimes);

  var ranges = {
    height: height,
    minX: minStart,
    maxX: maxStart,
    minY: min,
    maxY: max
  };
  baseScatter(chart, ranges);

  var colours = d3.scale.category10();

  var inbound = data.filter(function(v) {
    return v.direction === 'in';
  });
  var outbound = data.filter(function(v) {
    return v.direction === 'out';
  });

  chart.svg.selectAll(".dot")
    .data(data)
    .enter().append("circle")
    .attr("class", "dot")
    .attr("r", 3)
    .attr("cx", function(d) { return chart.x(d.start_time); })
    .attr("cy", function(d) { return chart.y(d.total_time); })
    .style("fill", function(d) { return colours(d.direction); })
    .on('mouseover', chart.tip.show)
    .on('mouseout', chart.tip.hide);

  var inboundStarts = inbound.map(function(d) { return d.start_time });
  var inboundTotals = inbound.map(function(d) { return d.total_time });
  var inboundFunc   = addTrendline(chart, inboundStarts, inboundTotals, "inbound");

  var outboundStarts = outbound.map(function(d) { return d.start_time });
  var outboundTotals = outbound.map(function(d) { return d.total_time });
  var outboundFunc   = addTrendline(chart, outboundStarts, outboundTotals, "outbound");

  var inboundRanges  = { min: d3.min(inboundStarts), max: d3.max(inboundStarts) };
  var outboundRanges = { min: d3.min(outboundStarts), max: d3.max(outboundStarts) };
  var inboundAverage = ss.mean(inbound.map(function(d) { return d.total_time }));

  var eightMins = minimiseTotal(
    (8 * 60 * 60) + inboundAverage, inboundFunc, outboundFunc, inboundRanges, outboundRanges);
  var eightHalfMins = minimiseTotal(
    (8.5 * 60 * 60) + inboundAverage, inboundFunc, outboundFunc, inboundRanges, outboundRanges);
  var nineMins = minimiseTotal(
    (9 * 60 * 60) + inboundAverage, inboundFunc, outboundFunc, inboundRanges, outboundRanges);

  chart.svg.selectAll(".resultline1")
    .data(eightMins[1])
    .enter().append("line")
    .attr("class", "resultline1")
    .attr("x1", function(d) { return chart.x(d[0]) })
    .attr("y1", function(d) { return chart.y(d[1]) })
    .attr("x2", function(d) { return chart.x(d[2]) })
    .attr("y2", function(d) { return chart.y(d[3]) })
    .attr("stroke", "red")
    .attr("stroke-width", 1);

  chart.svg.selectAll(".resultline2")
    .data(eightHalfMins[1])
    .enter().append("line")
    .attr("class", "resultline2")
    .attr("x1", function(d) { return chart.x(d[0]) })
    .attr("y1", function(d) { return chart.y(d[1]) })
    .attr("x2", function(d) { return chart.x(d[2]) })
    .attr("y2", function(d) { return chart.y(d[3]) })
    .attr("stroke", "blue")
    .attr("stroke-width", 1);

  chart.svg.selectAll(".resultline3")
    .data(nineMins[1])
    .enter().append("line")
    .attr("class", "resultline3")
    .attr("x1", function(d) { return chart.x(d[0]) })
    .attr("y1", function(d) { return chart.y(d[1]) })
    .attr("x2", function(d) { return chart.x(d[2]) })
    .attr("y2", function(d) { return chart.y(d[3]) })
    .attr("stroke", "orange")
    .attr("stroke-width", 1);
}
