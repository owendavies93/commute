var parseDate     = d3.time.format("%Y-%m-%d").parse;
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
