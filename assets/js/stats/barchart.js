function buildBarChart(height, width, margins, container) {
  var x = d3.time.scale().range([0, width]);
  var y = d3.scale.linear().range([height, 0]);

  var xAxis = d3.svg.axis().scale(x).orient("bottom").tickFormat(dateFormatter);
  var yAxis = d3.svg.axis().scale(y).orient("left")  .tickFormat(timeFormatter);

  var tip = d3.tip()
              .attr('class', 'd3-tip')
              .offset([-10, 0])
              .html(function(d) {
                return "Date: <strong>" + dateFormatter(d.date) + "</strong><br>Total Time: <strong>" + timeFormatter(d.total_time) + "</strong><br>Direction: <strong>" + d.direction + "</strong>";
              });

  var svg = buildBaseChart(height, width, margins, container);

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

function populateBarChart(chart, data, height, width, min, max) {
  chart.x.domain(d3.extent(data, function(d) { return d.date }));
  chart.y.domain([min - 600, max + 60]);

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

  chart.svg.selectAll(".bar")
      .data(data)
      .enter().append("rect")
      .attr("class", "bar")
      .attr("x", function(d, i) { return i * (width / data.length) + 5; })
      .attr("width", (width / data.length) - 5)
      .attr("y", function(d) { return chart.y(d.total_time); })
      .attr("height", function(d) { return height - chart.y(d.total_time); })
      .on('mouseover', chart.tip.show)
      .on('mouseout', chart.tip.hide);

  var times = data.map(function(d) { return d.total_time });
  var avg = ss.mean(times);
  var lowerQ = ss.quantile(times, 0.25);
  var upperQ = ss.quantile(times, 0.75);

  function straightLineGenerator(d, i) {
    if (i == 0) return 0;
    if (i == data.length - 1) return i * (width / data.length) + (width / data.length);
    return i * (width / data.length) + (width / data.length) / 2;
  }

  var avgLine = d3.svg.line()
                  .x(straightLineGenerator)
                  .y(function(d, i) { return chart.y(avg); });

  var lQLine = d3.svg.line()
                  .x(straightLineGenerator)
                  .y(function(d, i) { return chart.y(lowerQ); });

  var uQLine = d3.svg.line()
                  .x(straightLineGenerator)
                  .y(function(d, i) { return chart.y(upperQ); });

  chart.svg.append("path")
      .attr("d", avgLine(data))
      .attr("stroke", "darkgreen")
      .attr("stroke-width", 2);

  chart.svg.append("path")
      .attr("d", lQLine(data))
      .attr("stroke", "#555")
      .attr("stroke-width", 1)
      .attr("stroke-dasharray", "10, 5");

  chart.svg.append("path")
      .attr("d", uQLine(data))
      .attr("stroke", "#555")
      .attr("stroke-width", 1)
      .attr("stroke-dasharray", "10, 5");
}
