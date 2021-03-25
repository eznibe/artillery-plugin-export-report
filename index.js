/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

 const fs = require('fs');
 const Transfer = require('transfer-sh');
 const async = require('async');

 module.exports = { Plugin };
 
 let intermediates = [];
 
// NOTE: Will not work with `parallel` - need request UIDs for that
function Plugin(script, events) {
   console.log('INIT export report');
   if (!script.config.processor) {
     script.config.processor = {};
   }

  events.on('stats', function(stats) {
    let report = stats.report();
    intermediates.push(report);
  });

   events.on('done', async function(allStats) {
     console.log('DONE plugin', intermediates)
     // TODO store as json and send via Transfer, all with await
     let report = allStats; //.report();

      delete report.concurrency;
      delete report.pendingRequests;
      delete report.latencies;

      // report.phases = _.get(script, 'config.phases', []);

      let logfile = "plugin-result.json";
      fs.writeFileSync(
        logfile,
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
      new Transfer('./plugin-result.json').upload()
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
 
 function transferReport(logfile) {
  return new Promise((resolve, reject) => {
    console.log();
    new Transfer('./' + logfile).upload()
    .then(function (link) { 
      console.log(link) 
      resolve(link);
    })
    .catch(function (err) { 
      console.log(err) 
      reject();
    });
  });
  
 }