var sqljs = require('sql.js')

process.on('uncaughtException', (error) => {
  console.log('Error caught in test app.js');
});

setTimeout(()=>{throw new Error('UH OH')}, 1000)
