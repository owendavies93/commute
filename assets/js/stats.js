var margins   = { top: 40, right: 30, bottom: 70, left: 60 };
var width     = 960 - margins.left - margins.right;
var height    = 600 - margins.top - margins.bottom;
var parseDate = d3.time.format("%Y-%m-%d").parse;

function buildMainChart() {
  var x = d3.time.scale()
            .range([0, width]);
  var y = d3.scale.linear()
            .range([height, 0]);

  var timeFormatter = d3.time.format("%b %d");
  var xAxis = d3.svg.axis()
                .scale(x)
                .orient("bottom")
                .ticks(10)
                .tickFormat(timeFormatter);

  var yAxis = d3.svg.axis()
                .scale(y)
                .orient("left")
                .ticks(5);

  var tip = d3.tip()
              .attr('class', 'd3-tip')
              .offset([-10, 0])
              .html(function(d) {
                return "Date: <strong>" + timeFormatter(d.date) + "</strong><br>Total Time: <strong>" + d.total_time + "</strong><br>Direction: <strong>" + d.direction + "</strong>";
              });

  var svg = d3.select("#main-graph-container").append("svg")
              .attr("width", width + margins.left + margins.right)
              .attr("height", height + margins.top + margins.bottom)
              .append("g")
              .attr("transform", "translate(" + margins.left + "," + margins.top + ")");

  svg.call(tip);

  d3.json('/commute/commutes/all', function(error, data) {
    if (error) throw error;

    data.forEach(function(d) {
      d.date = parseDate(d.date);
      d.total_time = +d.total_time;
    });

    x.domain(d3.extent(data, function(d) { return d.date }));
    y.domain([d3.min(data, function(d) { return d.total_time }) - 500,
              d3.max(data, function(d) { return d.total_time })]);

    svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis);

    svg.append("g")
        .attr("class", "y axis")
        .call(yAxis)
        .append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 6)
        .attr("dy", ".71em")
        .style("text-anchor", "end")
        .text("Total Time (seconds)");

    svg.selectAll(".bar")
        .data(data)
        .enter().append("rect")
        .attr("class", "bar")
        .attr("x", function(d, i) { return i * (width / data.length) + 5; })
        .attr("width", (width / data.length) - 5)
        .attr("y", function(d) { return y(d.total_time); })
        .attr("height", function(d) { return height - y(d.total_time); })
        .on('mouseover', tip.show)
        .on('mouseout', tip.hide);
  });
}

$(document).ready(function() {
    buildMainChart();
});
