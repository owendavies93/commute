var margins = { top: 40, right: 30, bottom: 30, left: 60 };
var width   = 960 - margins.left - margins.right;
var height  = 500 - margins.top - margins.bottom;

function buildMainChart() {
    var x = d3.time.scale().range([0, width]);
    var y = d3.scale.linear().range([height, 0]);

    var chart = d3.select("#main-graph-container").append("svg")
                  .attr("width", width + (2 * margins.left) + margins.right)
                  .attr("height", height + margins.top + margins.bottom);

    var xAxis = d3.svg.axis().scale(x).orient("bottom");
    var yAxis = d3.svg.axis().scale(y).orient("left");

    d3.json('/commute/commutes/all', function(error, data) {
        x.domain(d3.extent(data, function(d) { return d.end_time }));
        y.domain([d3.min(data, function(d) { return d.total_time }) - 500, d3.max(data, function(d) { return d.total_time })]);

        var bar = chart.selectAll("g").data(data)
                       .enter().append("g")
                       .attr("transform", "translate(50, 0)");

        bar.append("rect")
           .attr("y",      function(d)    { return y(d.total_time); })
           .attr("x",      function(d, i) { return i * (width / data.length) + (margins.left / 4); })
           .attr("height", function(d)    { return height - y(d.total_time); })
           .attr("width",  width / data.length - 10);

        chart.append("g")
             .attr("class", "x axis")
             .attr("transform", "translate(" + margins.left + ", " + height + ")")
             .call(xAxis);

        chart.append("g")
             .attr("class", "y axis")
             .attr("transform", "translate(" + margins.left + ", 0)")
             .call(yAxis)
             .append("text")
             .attr("transform", "rotate(-90)")
             .attr("y", 6)
             .attr("dy", ".71em")
             .style("text-anchor", "end")
             .text("Total Time (seconds)");
    });
}

$(document).ready(function() {
    buildMainChart();
});
