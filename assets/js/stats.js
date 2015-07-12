var margins   = { top: 40, right: 30, bottom: 70, left: 60 };
var width     = 850 - margins.left - margins.right;
var height    = 500 - margins.top - margins.bottom;
var parseDate = d3.time.format("%Y-%m-%d").parse;

var dateFormatter = d3.time.format("%b %d");
var timeFormatter = function(d) {
  var mins = Math.floor(d / 60);
  var secs = d % 60;
  secs = (secs < 10) ? '0' + secs : secs;
  return mins + ":" + secs;
}

function members_of_quantile_range(arr, x, y) {
  var l = ss.quantile(arr, x);
  var u = ss.quantile(arr, y);

  var res = [];
  for (var i = 0; i < arr.length; i++) {
    var m = arr[i];
    if (m >= l && m <= u) {
      res.push(m);
    }
  }
  console.log(res);
  return res;
}

function buildMainChart() {
  var x = d3.time.scale().range([0, width]);
  var y = d3.scale.linear().range([height, 0]);

  var xAxis = d3.svg.axis()
                .scale(x)
                .orient("bottom")
                .ticks(10)
                .tickFormat(dateFormatter);

  var yAxis = d3.svg.axis()
                .scale(y)
                .orient("left")
                .ticks(10)
                .tickFormat(timeFormatter);

  var tip = d3.tip()
              .attr('class', 'd3-tip')
              .offset([-10, 0])
              .html(function(d) {
                return "Date: <strong>" + dateFormatter(d.date) + "</strong><br>Total Time: <strong>" + timeFormatter(d.total_time) + "</strong><br>Direction: <strong>" + d.direction + "</strong>";
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
        .text("Total Time (mins:secs)");

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

    var times = data.map(function(d) { return d.total_time });
    var avg = ss.mean(times);

    var avgLine = d3.svg.line()
                    .x(function(d, i) {
                        if (i == 0) return 0;
                        if (i == data.length - 1) return i * (width / data.length) + (width / data.length);
                        return i * (width / data.length) + (width / data.length) / 2;
                    })
                    .y(function(d, i) { return y(avg); });

    svg.append("path")
        .attr("d", avgLine(data))
        .attr("stroke", "darkgreen")
        .attr("stroke-width", 2);

    var total  = data.length;
    var median = timeFormatter(Math.round(ss.median(times)));
    var stddev = ss.standard_deviation(times).toFixed(2);
    var range  = ss.max(times) - ss.min(times);
    var iqr    = ss.iqr(times);
    var iqa    = timeFormatter(Math.round(ss.mean(members_of_quantile_range(times, 0.25, 0.75))));

    $('#stat-total').html(total);
    $('#stat-avg').html(timeFormatter(Math.round(avg)));
    $('#stat-med').html(median);
    $('#stat-sd').html(stddev + " secs");
    $('#stat-range').html(range + " secs");
    $('#stat-iqr').html(iqr + " secs");
    $('#stat-iqa').html(iqa);
  });
}

$(document).ready(function() {
    buildMainChart();
});
