/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

 const fs = require('fs');
 const Transfer = require('transfer-sh');
 const async = require('async');

 module.exports = { Plugin };
 
 let intermediates = [];
 const resultfile = 'result.json';
 
function Plugin(script, events) {
   
  events.on('stats', function(stats) {
    let report = stats.report();
    intermediates.push(report);
  });

   events.on('done', async function(allStats) {
     //console.log('DONE plugin');
     
     let report = allStats; //.report();

      delete report.concurrency;
      delete report.pendingRequests;
      delete report.latencies;

      // report.phases = _.get(script, 'config.phases', []);
      report.phases = script.config.phases;

      fs.writeFileSync(
        resultfile,
        JSON.stringify(
          {
            aggregate: report,
            intermediate: intermediates
          },
          null,
          2
        ),
        { flag: 'w' }
      );
   });
 }

 Plugin.prototype.cleanup = function(done) {
  async.eachSeries(
    [1],
    (reporter, next) => {
      new Transfer('./' + resultfile).upload()
      .then(function (link) { 
        console.log(link) 
        next();
      })
      .catch(function (err) { 
        console.log(err) 
        next();
      });
    },
    () => {
      return done();
    });
};
 