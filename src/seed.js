const Q = require('q'),
  path = require('path'),
  fs = require('fs'),
  dir = path.resolve(process.cwd(), 'seeds/'),
  mongo = require('mongodb').MongoClient,
  json2mongo = require('json2mongo');

let getFiles = Q.promise((resolve, reject) => {
    console.log('Getting files from seeds/ directory.');
    if (!fs.existsSync(dir)) {
      return reject('Nothing to be done, seeds/ directory does not exist.');
    }
    let files = fs.readdirSync(dir);
    if (!files.length) {
      return reject('Nothing to be done, seeds/ directory empty.');
    }
    resolve(files.filter(file =>
      path.extname(file) === '.json'
    ).map(file =>
      path.resolve(dir, file)
    ));
  }),

  checkFiles = files =>
    Q.promise((resolve, reject) => {
      console.log('Done.\n\nChecking files.');
      let validFiles = [];
      files.forEach(file => {
        try {
          let content = require(file);
          if (content.length) {
            let { db, key = null, drop = false } = content[0];
            if (!db || (!drop && !key)) {
   //            if (flags['-a']) {
  //               reject(`${path.basename(file)} does not have the proper\
  //  config info.`);
   //            }
              return console.log(`${path.basename(file)} does not have the proper\
 config info.`);
            }
            validFiles.push({
              path: file,
              config: {
                db,
                key,
                drop,
                collection: path.basename(file, '.json')
              },
              content: content.slice(1).map(doc => json2mongo(doc))
            });
          } else {
            // if (flags['-a']) {
              // reject(`${path.basename(file)} is empty.`);
            // }
            return console.log(`${path.basename(file)} is empty.`);
          }
        } catch (e) {
          // if (flags['-a']) {
            // reject(`${path.basename(file)} is not a valid json file.`)
          // }
          return console.log(`${path.basename(file)} is not a valid json file.`);
        }
      });
      resolve(validFiles);
    }),

  getConnection = dbUrl =>
    Q.promise((resolve, reject) => {
      mongo.connect(dbUrl, (err, db) => {
        if (err) {
          return reject(err);
        }
        resolve(db);
      });
    }),

  seedDB = (db, file) => {
    if (file.config.drop) {
      return insert(db, file.config.collection, file.content);
    }
    return update(db, file);
  },

  seedFiles = files =>
    Q.promise((resolve, reject) => {
      let currentDB;
      console.log('Done.\n\nSeeding files.');
      files.forEach(file => {
        getConnection(file.config.db)
          .then(db => {
            currentDB = db;
            console.log(`${path.basename(file.path)} DB connection successful`);
            return seedDB(db, file);
          })
          .catch(reason => {
            reject(`${path.basename(file.path)}: ${reason}`);
          })
          .fin(() => {
            currentDB.close();
          });
      });
    });

module.exports = () => {
  getFiles
    .then(checkFiles)
    .then(seedFiles)
    .catch(reason => {
      console.error(`error yeeeaah: ${reason}`);
    })
    .done();
};
