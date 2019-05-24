const express = require('express');
const multer = require('multer');
const upload = multer({dest: 'public/'});

module.exports = (config) => { // eslint-disable-line max-statements
//Init config
  const router = express.Router();
  const { authPath, authError, filemanager } = config;

  const modeAuthMap = {
    'initiate': [],
    'getinfo': [{queryField: 'path', access: 'r'}],
    'readfolder': [{queryField: 'path', access: 'r'}],
    'getimage': [{queryField: 'path', access: 'r'}],
    'readfile': [{queryField: 'path', access: 'r'}],
    'download': [{queryField: 'path', access: 'r'}],
    'readfolder': [{queryField: 'path', access: 'r'}],
    'addfolder': [{queryField: 'path', access: 'r'}, {queryField: 'name', isFile: true, access: 'w'}],
    'delete': [{queryField: 'path', access: 'w'}],
    'rename': [{queryField: 'old', isFile: true, access: 'r'}, {queryField: 'new', isFile: true, access: 'w'}],
    'move': [{queryField: 'old', isFile: true, access: 'w'}, {queryField: 'new', isFile: true, access: 'w'}],
    'copy': [{queryField: 'source', isFile: true, access: 'r'}, {queryField: 'target', isFile: true, access: 'w'}],
  }

  // Preauthorization for GET requests.  Called before RFM-Node.
  const preauthGet = (req, res, next) => {
    const mode = (req.query.mode || "").trim();

    console.log(`preauth ${mode}`);

    if (mode in modeAuthMap) {
      const auths = modeAuthMap[mode];
      const unauthedPaths = auths.map((auth) => {
        const path = req.query[auth.queryField];
        if (!authPath(path, req, auth.isFile, auth.access)) {
          return path;
        }
      }).filter(path => path);
      if (unauthedPaths.length === 0) {
        return next();
      } else {
        return authError(req, res, unauthedPaths);
      }
    } else {
      console.error(`unknown mode! ${mode} ${modeAuthMap[mode]}`);
      next();
    }
  }

  // Preauthorization for POST requests.  Called before RFM-Node.
  const preauthPost = (req, res, next) => {
    const path = req.body.path;
    const mode = req.body.mode;

    console.log(`preauth ${mode} ${path}`);

    let authed = true;
    switch (mode) {
      case 'upload':
      case 'savefile':
        authed = authPath(path, req, true, 'w');
        break;
    }
    if (authed) {
      return next();
    } else {
      return authError(req, req, path);
    }
  }

  // post authorization for requests. Called AFTER RFM-Node
  const postauth = (req, res, next) => {
    const mode = (req.query.mode || "").trim();
    const path = req.query.path;

    console.log(`postauth ${req.method} ${mode}`);

    const obj = req.rfmNodeData;

    if (req.method === 'GET' && mode === 'readfolder') {
      let {data} = obj;
      data = data.filter(entry => authPath(entry.id, req, 'r'));
      obj.data = data;
    };

    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify(obj));
  }

  const preauthRouter = express.Router();
  preauthRouter.get('/', preauthGet);

  // TODO: actually parse the RFM-Node config file and get the real max number of files.
  preauthRouter.post('/', upload.array('files', 666/*config.upload.maxNumberOfFiles*/), preauthPost);

  const { richFileManagerNodeArgs } = config;
  const { appRoot, configFile } = richFileManagerNodeArgs;

  router.use('/', [preauthRouter, filemanager(appRoot, configFile), postauth]);

  return router;
}
