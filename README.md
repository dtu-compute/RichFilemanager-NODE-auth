# RichFilemanager-NODE-auth

Authorization wrapper for [RichFileManager-NODE](https://github.com/dekyfin/RichFilemanager-NODE).  Provides a mechanism for path-level and read/write level access control for RichFileManager-NODE.

## Installation
```
npm install rich-filemanager-node-auth --save
```

## Summary


This connector is implemented as a middleware for Expressjs, just as RichFilemanager-NODE (RFM-N) is.

It is designed to wrap an instance of the RFM-N middleware, authorizing the operations before passing them to RFM-N.  It will also filter the results of the `readfolder` operation so that inaccessible paths aren't returned to the caller.

### Configuration

The configuration looks like this:

```
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
```

The fields are the following:

* `authPath(targetPath, req, isFile, access)` 

`authPath` is a function you provide which returns `true`/`false` depending on whether the path `targetPath` (which is a file if `isFile` is truthy) has the access demand specified by `access` (i.e. `'r'` for read and `'w'` for write).  `req` is the express request object, which is useful in cases where the user information is added to the request by some previous middleware

* `authError(req, res, paths)`

`authError` is a function you provide to terminate the request in the case a path is unauthorized.  `paths` can be a single string path or an array of string paths to which access isn't allowed.  It is also passed the standard `req` request and `res` response objects.  Typically you'd send whatever response makes sense, such as an HTTP 403.

* `filemanager`

The RichFilemanager-NODE module, i.e. `require( "rich-filemanager-node" );`

* `richFileManagerNodeArgs`

The two arguments passed to the RichFilemanager-NODE constructor, i.e. the `appRoot` and the `configFile`.  See the RichFilemanager-NODE [](https://github.com/dekyfin/RichFilemanager-NODE)] for details.

### Example

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