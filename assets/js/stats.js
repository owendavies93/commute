var parseDate = d3.time.format("%Y-%m-%d").parse;

var dateFormatter = d3.time.format("%b %d");
var timeFormatter = function(d) {
  var mins = Math.floor(d / 60);
  mins = (mins < 10) ? '0' + mins : mins;
  var secs = d % 60;
  secs = (secs < 10) ? '0' + secs : secs;
  return mins + ":" + secs;
}
var startTimeFormatter = function(d) {
  var hours = Math.floor(d / 60 / 60);
  hours = (hours < 10) ? '0' + hours : hours;
  var mins = Math.floor((d - (hours * 60 * 60)) / 60);
  mins = (mins < 10) ? '0' + mins : mins;
  return hours + ":" + mins;
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
  return res;
}

function buildBaseChart(height, width, margins, container) {
  return d3.select(container).append("svg")
          .attr("width", width + margins.left + margins.right)
          .attr("height", height + margins.top + margins.bottom)
          .append("g")
          .attr("transform", "translate(" + margins.left + "," + margins.top + ")");
}

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

function populateScatterChart(chart, data, height, width, min, max) {
  var minStart = d3.min(data.map(function(d) { return d.start_time }));
  var maxStart = d3.max(data.map(function(d) { return d.start_time }));
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
}

function populateStats(container, data) {
  var times = data.map(function(d) { return d.total_time });

  var total  = data.length;
  var avg    = ss.mean(times);
  var median = timeFormatter(Math.round(ss.median(times)));
  var stddev = ss.standard_deviation(times).toFixed(2);
  var range  = ss.max(times) - ss.min(times);
  var iqr    = ss.iqr(times);
  var iqa    = timeFormatter(Math.round(ss.mean(members_of_quantile_range(times, 0.25, 0.75))));

  $('.stat-total', container).html(total);
  $('.stat-avg', container)  .html(timeFormatter(Math.round(avg)));
  $('.stat-med', container)  .html(median);
  $('.stat-sd', container)   .html(stddev + " secs");
  $('.stat-range', container).html(range + " secs");
  $('.stat-iqr', container)  .html(iqr + " secs");
  $('.stat-iqa', container)  .html(iqa);
}

$(document).ready(function() {
  var big_margins   = { top: 40, right: 30, bottom: 70, left: 60 };
  var small_margins = { top: 20, right: 15, bottom: 30, left: 60 };
  var width         = 850 - big_margins.left - big_margins.right;
  var height        = 500 - big_margins.top - big_margins.bottom;

  var bidir_svg    = buildBarChart(height, width, big_margins, "#bidir-graph-cont");
  var inbound_svg  = buildBarChart((3 * height) / 4, width / 2 + 50, small_margins, "#inbound-graph-cont");
  var outbound_svg = buildBarChart((3 * height) / 4, width / 2 + 50, small_margins, "#outbound-graph-cont");

  var i_scatter_svg = buildScatterChart((3 * height) / 4, width / 2 + 50, small_margins, "#inbound-scatter-cont");
  var o_scatter_svg = buildScatterChart((3 * height) / 4, width / 2 + 50, small_margins, "#outbound-scatter-cont");

  d3.json('/commute/commutes/all', function(error, data) {
    if (error) throw error;

    var min = Number.MAX_VALUE;
    var max = 0;
    data.forEach(function(d) {
      d.date       = parseDate(d.date);
      d.total_time = +d.total_time;

      d.start_date = new Date(d.start_time);
      d.start_time = (d.start_date.getTime() - d.start_date.setHours(0, 0, 0, 0)) / 1000 ;

      if (d.total_time < min) {
        min = d.total_time;
      } else if (d.total_time > max) {
        max = d.total_time;
      }
    });

    populateBarChart(bidir_svg, data, height, width, min, max);
    populateStats($(".stats-summary"), data);

    var inbound = data.filter(function(v) {
      return v.direction === 'in';
    });
    populateBarChart(inbound_svg, inbound, (3 * height) / 4, width / 2 + 50, min, max);
    populateStats($(".inbound-stats"), inbound);

    var outbound = data.filter(function(v) {
      return v.direction === 'out';
    });
    populateBarChart(outbound_svg, outbound, (3 * height) / 4, width / 2 + 50, min, max);
    populateStats($(".outbound-stats"), outbound);

    populateScatterChart(i_scatter_svg, inbound, (3 * height) / 4, width / 2 + 50, min, max);
    populateScatterChart(o_scatter_svg, outbound, (3 * height) / 4, width / 2 + 50, min, max);
  });
});
