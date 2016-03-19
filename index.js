'use strict';

// const ranges2 = Array.apply(0, Array(7 * 8)).map(function(elem, idx) { return idx; });
// console.log(ranges2);
// process.exit();

const now = () => Math.round(new Date().getTime() / 1000);

const events = require('./events.json');

let e = events.filter(node => {
  return ['2','4'].indexOf(node.user_id) === -1;
});

let profileViews = e.filter(node => node.event_name == 'profile-view');

console.log('Profile views: ', profileViews.length);

let searches = e.filter(node => node.event_name == 'search');

let goodSearches = searches.filter(node => node.metadata.num_results >= 1);


let secondSearches = goodSearches.filter(node => {
  const byThisUser = goodSearches.filter(c => c.user_id === node.user_id).map(c => c.created_at);
  return node.created_at > Math.min(...byThisUser);
});

let users = new Set();

secondSearches.map(node => {
  users.add(parseInt(node.user_id));
});

console.log('Searches: ', {
  total: searches.length,
  good: goodSearches.length,
  repeat: secondSearches.length,
  usersDidRepeat: users.size
});

const DAYS = 24 * 60 * 60;
const WEEKS = 7 * DAYS;

console.log((generateStats(profileViews, 8, WEEKS, 2 * DAYS)));

// const secondSearchesPerDay = generateStats(secondSearches, 8 * 7, DAYS);
// const secondSearchesPerWeek = generateStats(secondSearches, 8, WEEKS);
// const profileViewsPerDay = generateStats(profileViews, 8 * 7, DAYS);
// const profileViewsPerWeek = generateStats(profileViews, 12, WEEKS);

// console.log('secondSearchesPerDay', secondSearchesPerDay);
// console.log('secondSearchesPerWeek', secondSearchesPerWeek);
// console.log('profileViewsPerDay', profileViewsPerDay);
// console.log('profileViewsPerWeek', profileViewsPerWeek);
// console.log('cumulativeProfileViewsPerWeek', makeCumulative(profileViewsPerWeek));

// generateGraph(profileViewsPerWeek);


const personsPerWeek = {
  ranges: generateRanges(8),
  data: require('./person_counts')
};

const organizationsPerWeek = {
  ranges: generateRanges(8),
  data: require('./organization_counts')
};

// console.log('personsPerWeek', makeCumulative(organizationsPerWeek));
// console.log('organizationsPerWeek', organizationsPerWeek);

// generateGraph(personsPerWeek);
// generateGraph(makeCumulative(profileViewsPerWeek));




function generateStats(dataset, rangeCount, rangeSize, _offset) {
  const offset = _offset || 0;

  const ranges = generateRanges(rangeCount);

  const data = ranges.map(week => {
    let startDate = now() - offset - ((ranges.length - week + 1) * rangeSize);
    let endDate = now() - offset - ((ranges.length - week) * rangeSize);

    return dataset.filter(node => node.created_at >= startDate && node.created_at < endDate).length;
  });

  return { ranges, data };
}

function generateRanges(rangeCount) {
  return Array.apply(0, Array(rangeCount + 1)).map(function(elem, idx) { return idx; }).filter(item => item > 0);
}

function makeCumulative(stats) {
  const data = stats.data;
  const cumulativeData = data.map((views, index) => data.slice(0, index + 1).reduce((a, b) => a + b));

  return { ranges: stats.ranges, data: cumulativeData };
}

function generateGraph(stats) {
  var blessed = require('blessed')
   , contrib = require('blessed-contrib')
   , screen = blessed.screen()
   , line = contrib.line(
       { style:
         { line: "yellow"
         , text: "green"
         , baseline: "black"}
       , xLabelPadding: 3
       , xPadding: 5
       , label: 'Title'})
   , data = {
       x: stats.ranges,
       y: stats.data
    }
  screen.append(line) //must append before setting data
  line.setData([data])

  screen.key(['escape', 'q', 'C-c'], function(ch, key) {
   return process.exit(0);
  });

  screen.render();
}