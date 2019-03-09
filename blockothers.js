process.on('uncaughtException', (error) => {
  console.log('Error caught in test app.js');
  throw error
});

var sqljs = require('sql.js')

setTimeout(()=>{throw new Error('UH OH')}, 1000)
