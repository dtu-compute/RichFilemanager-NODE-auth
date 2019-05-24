# RichFilemanager-NODE-auth

Authorization wrapper for [RichFileManager-NODE](https://github.com/dekyfin/RichFilemanager-NODE).  Provides a mechanism for path-level and read/write level access control for RichFileManager-NODE.

## Installation
```
npm install rich-filemanager-node-auth --save
```

## Usage


This connector is implemented as a middleware for Expressjs, just as RichFilemanager-NODE is.

It is designed to wrap an instance of the RFM-N middleware, authorizing the operations before passing them to RFM-N.  It will also filter the results of the `readfolder` operation so that inaccessible paths aren't returned to the caller.

```javascript
const express = require( "express" );
const filemanager = require( "rich-filemanager-node" );
const filemanagerAuth = require( "rich-filemanager-node-auth" );
const fmConfigFile = "/path/to/filemanager.config.json";	// Change this to the actual location of your config file
var app = express();

// targetPath is the path to be authorized.
// req is the request object from express.  Depending on your authN system, req.user is what
// you'll use to determine the result of this function.
// isFile is true iff the path refers to a file
// access is 'r' or 'w'
// return true or false
function authPath(targetPath, req, isFile, access) {
  // ...
}

// called when the path(s) fail authorization. For example, you might want to log,
// and return a 403 with suitable JSON
function authError(req, res, paths) {
  if (typeof paths === 'String') { paths = [paths] }
  console.error(`user ${req.user.profile.user} not authorized for path(s) %o`, paths);
  console.error(JSON.stringify(req.user, null, 2));
  res.status(403);
  return res.json({error: 'unauthorized'});
}

const authConfig = {
   authPath,
   authError,
   filemanager: filemanager,
   // these two are the arguments for filemanager, passed to create its middleware
   richFileManagerNodeArgs: {
     appRoot: "/path/to/dir",
     configFile: fmConfigFile
   }
};

// Filemanager route
app.use( '/filemanager', filemanagerAuth(authConfig) );
// '/filemanager' is the connector url. 
// Don't forget to set it in the api.connectorUrl of `filemanager.config.json` for the frontend

//Listen for requests
const port = process.env.PORT || 9000;
app.listen( port, function(){
	console.log ( 'App listening on port ' + port );
})
```