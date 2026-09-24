'use strict';

const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const process = require('process');
const basename = path.basename(__filename);
const env = process.env.NODE_ENV || 'development';
const config = require(__dirname + '/../config/config.json')[env];
const db = {};

let sequelize;
if (config.use_env_variable) {
  sequelize = new Sequelize(process.env[config.use_env_variable], config);
} else {
  sequelize = new Sequelize(config.database, config.username, config.password, config);
}

fs
fs
  .readdirSync(__dirname)
  .filter(file => {
    return (
      file.indexOf('.') !== 0 &&
      file !== basename &&
      file.slice(-3) === '.js' &&
      file.indexOf('.test.js') === -1
    );
  })
  .forEach(file => {
    const importedModule = require(path.join(__dirname, file));
    
    // Check if the file exports a function. If not, assume it's a pre-defined model instance.
    const model = typeof importedModule === 'function' 
      ? importedModule(sequelize, Sequelize.DataTypes) 
      : importedModule;

    if (model && model.name) {
      db[model.name] = model;
    } else {
      console.warn(`⚠️ Warning: ${file} did not export a valid Sequelize model.`);
    }
  });


Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;  
