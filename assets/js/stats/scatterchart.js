function buildScatterChart(height, width, margins, container) {
  var x = d3.scale.linear().range([0, width]);
  var y = d3.scale.linear().range([height, 0]);

  var xAxis = d3.svg.axis().scale(x).orient("bottom").ticks(5).tickFormat(startTimeFormatter);
  var yAxis = d3.svg.axis().scale(y).orient("left").tickFormat(timeFormatter);

  var svg = buildBaseChart(height, width, margins, container);

  return {
    svg:   svg,
    x:     x,
    y:     y,
    xAxis: xAxis,
    yAxis: yAxis
  };
}

function populateScatterChart(chart, data, height, width, min, max) {
  var startTimes = data.map(function(d) { return d.start_time });
  var totals     = data.map(function(d) { return d.total_time });

  var minStart = d3.min(startTimes);
  var maxStart = d3.max(startTimes);
  var diff     = ((maxStart - minStart) * 0.1);

  chart.x.domain([minStart - diff, maxStart + diff]);
  chart.y.domain([min - 60, max + 60]);

  chart.xAxis.tickValues(d3.range(minStart, maxStart + 150, diff));
  chart.yAxis.tickValues(d3.range(Math.floor(min / 600) * 600, max, 600));

  chart.svg.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + height + ")")
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

  chart.svg.selectAll(".dot")
      .data(data)
      .enter().append("circle")
      .attr("class", "dot")
      .attr("r", 2)
      .attr("cx", function(d) { return chart.x(d.start_time); })
      .attr("cy", function(d) { return chart.y(d.total_time); });

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
