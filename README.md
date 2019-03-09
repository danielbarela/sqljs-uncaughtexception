# sqljs-uncaughtexception
Demonstrating how the uncaughtException handler in sql.js is causing problems in node

# problem
sqljs contains an uncaughtException handler which then re-throws the exception.  When this happens node stops all processing and exits which does not allow any other exception handlers to be called see: https://nodejs.org/api/process.html#process_event_uncaughtexception
``
Exceptions thrown from within the event handler will not be caught. Instead the process will exit with a non-zero exit code and the stack trace will be printed. This is to avoid infinite recursion.
``

This also forcefully kills the node process which means that any process.on('exit') handlers never get executed and resources that may need to be cleaned up, never are.

line 111 in sql-debug.js contains the following:
```
process['on']('uncaughtException', function(ex) {
  // suppress ExitStatus exceptions from showing an error
  if (!(ex instanceof ExitStatus)) {
    throw ex;
  }
});
```

Not sure where to go from here or how that piece of code is getting included, however, throwing an exception from an exception handler is 100% going to crash whatever process requires this library and that seems overbearing.  If SQL.js wants to handle some kind of exception and print something, fine, but to just throw the error is, in my opinion, not correct

# solution?
sql.js should not throw an exception from the exception handler.  I don't know how this is getting put in there, if it is an emscripten thing, or something else, but I believe it is incorrect.

# demonstration

First run app.js.  This demonstrates how the current code works and how, if your app registers the uncaughtException handler after requiring sql.js, it never gets hit. This is how people, generally, set up their app.  They require their dependencies and then set up their uncaughtException handlers.  You will see that ``Error caught in test app.js`` is never printed.

```
$ node app.js
/data/github/danielbarela/sqljs-uncaughtexception/node_modules/sql.js/js/sql.js:3
var Module=typeof Module!=="undefined"?Module:{};var moduleOverrides={};var key;for(key in Module){if(Module.hasOwnProperty(key)){moduleOverrides[key]=Module[key]}}var ENVIRONMENT_IS_WEB=false;var ENVIRONMENT_IS_WORKER=false;var ENVIRONMENT_IS_NODE=false;var ENVIRONMENT_IS_SHELL=false;if(Module["ENVIRONMENT"]){if(Module["ENVIRONMENT"]==="WEB"){ENVIRONMENT_IS_WEB=true}else if(Module["ENVIRONMENT"]==="WORKER"){ENVIRONMENT_IS_WORKER=true}else if(Module["ENVIRONMENT"]==="NODE"){ENVIRONMENT_IS_NODE=true}else if(Module["ENVIRONMENT"]==="SHELL"){ENVIRONMENT_IS_SHELL=true}else{throw new Error("The provided Module['ENVIRONMENT'] value is not valid. It must be one of: WEB|WORKER|NODE|SHELL.")}}else{ENVIRONMENT_IS_WEB=typeof window==="object";ENVIRONMENT_IS_WORKER=typeof importScripts==="function";ENVIRONMENT_IS_NODE=typeof process==="object"&&typeof require==="function"&&!ENVIRONMENT_IS_WEB&&!ENVIRONMENT_IS_WORKER;ENVIRONMENT_IS_SHELL=!

Error: UH OH
    at Timeout.setTimeout [as _onTimeout] (/data/github/danielbarela/sqljs-uncaughtexception/app.js:7:23)
    at ontimeout (timers.js:427:11)
    at tryOnTimeout (timers.js:289:5)
    at listOnTimeout (timers.js:252:5)
    at Timer.processTimers (timers.js:212:10)

```

Now run expected.js.  This is what most people would actaully want to happen.  Set up an uncaught exception handler and have it hit when an exception is thrown.  Problem is, if sql.js is required, at any point, before the exception handler is registered, it is the only one that is hit.  You will see the first line is ``Error caught in test app.js``

```
$ node expected.js
Error caught in test app.js
/data/github/danielbarela/sqljs-uncaughtexception/node_modules/sql.js/js/sql.js:3
var Module=typeof Module!=="undefined"?Module:{};var moduleOverrides={};var key;for(key in Module){if(Module.hasOwnProperty(key)){moduleOverrides[key]=Module[key]}}var ENVIRONMENT_IS_WEB=false;var ENVIRONMENT_IS_WORKER=false;var ENVIRONMENT_IS_NODE=false;var ENVIRONMENT_IS_SHELL=false;if(Module["ENVIRONMENT"]){if(Module["ENVIRONMENT"]==="WEB"){ENVIRONMENT_IS_WEB=true}else if(Module["ENVIRONMENT"]==="WORKER"){ENVIRONMENT_IS_WORKER=true}else if(Module["ENVIRONMENT"]==="NODE"){ENVIRONMENT_IS_NODE=true}else if(Module["ENVIRONMENT"]==="SHELL"){ENVIRONMENT_IS_SHELL=true}else{throw new Error("The provided Module['ENVIRONMENT'] value is not valid. It must be one of: WEB|WORKER|NODE|SHELL.")}}else{ENVIRONMENT_IS_WEB=typeof window==="object";ENVIRONMENT_IS_WORKER=typeof importScripts==="function";ENVIRONMENT_IS_NODE=typeof process==="object"&&typeof require==="function"&&!ENVIRONMENT_IS_WEB&&!ENVIRONMENT_IS_WORKER;ENVIRONMENT_IS_SHELL=!

Error: UH OH
    at Timeout.setTimeout [as _onTimeout] (/data/github/danielbarela/sqljs-uncaughtexception/expected.js:7:23)
    at ontimeout (timers.js:427:11)
    at tryOnTimeout (timers.js:289:5)
    at listOnTimeout (timers.js:252:5)
    at Timer.processTimers (timers.js:212:10)
```

If you run blockothers.js this demonstrates essentially what sql.js is doing.  My sample app is now catching the uncaughtException and rethrowing it which stops all other uncaughtException handlers.  You will notice that the sql.js handler never prints anything.

```
$ node blockothers.js
Error caught in test app.js
/data/github/danielbarela/sqljs-uncaughtexception/blockothers.js:3
  throw error
  ^

Error: UH OH
    at Timeout.setTimeout [as _onTimeout] (/data/github/danielbarela/sqljs-uncaughtexception/blockothers.js:8:23)
    at ontimeout (timers.js:427:11)
    at tryOnTimeout (timers.js:289:5)
    at listOnTimeout (timers.js:252:5)
    at Timer.processTimers (timers.js:212:10)
```
