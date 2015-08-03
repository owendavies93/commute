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
      return "Date: <strong>" + dateFormatter(d.date) + "</strong><br>Start Time: <strong>" + startTimeFormatter(d.start_time) + "</strong><br>Total Time: <strong>" + timeFormatter(d.total_time) + "</strong>";
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

  var diff = (maxStart - minStart) * 0.1;
  var ls = leastSquares(startTimes, totals);
  var x1 = minStart - (diff / 2);
  var y1 = (ls[0] * x1) + ls[1];
  var x2 = maxStart + (diff / 2);
  var y2 = (ls[0] * x2) + ls[1];
  var trend = [[x1, y1, x2, y2]];

  var trendline = chart.svg.selectAll(".trendline")
    .data(trend)
    .enter().append("line")
    .attr("class", "trendline")
    .attr("x1", function(d) { return chart.x(d[0]) })
    .attr("y1", function(d) { return chart.y(d[1]) })
    .attr("x2", function(d) { return chart.x(d[2]) })
    .attr("y2", function(d) { return chart.y(d[3]) })
    .attr("stroke", "darkgreen")
    .attr("stroke-width", 2);
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
  var lineColours = d3.scale.category20();

  var inbound = data.filter(function(v) {
    return v.direction === 'in';
  });
  var outbound = data.filter(function(v) {
    return v.direction === 'out';
  });

  for (var i = 0; i < inbound.length; i++) {
    for (var j = 0; j < outbound.length; j++) {
      if (inbound[i].date.getTime() == outbound[j].date.getTime()) {
        inbound[i].end_start_time = outbound[j].start_time;
        inbound[i].end_total_time = outbound[j].total_time;
        break;
      }
    }
  }

  var inbound = inbound.filter(function(v) {
    return v.end_start_time != null;
  });
  data = data.filter(function(v) {
    return v.end_start_time != null || v.direction === 'out';
  });

  var maxDiff = d3.max(inbound.map(function(d) {
    return Math.abs(d.end_total_time - d.total_time)
  }));

  chart.svg.selectAll(".link")
    .data(inbound)
    .enter().append("line")
    .attr("class", "link")
    .attr("x1", function(d) { return chart.x(d.start_time) })
    .attr("y1", function(d) { return chart.y(d.total_time) })
    .attr("x2", function(d) { return chart.x(d.end_start_time) })
    .attr("y2", function(d) { return chart.y(d.end_total_time) })
    .attr("stroke", function(d, i) { return lineColours(i) })
    .attr("stroke-width", 1)
    .attr("stroke-opacity", function(d) { return alphaGenerator(d, maxDiff) });

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
}
