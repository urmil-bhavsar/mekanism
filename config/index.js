const { Sequelize } = require('sequelize');

// Initialize Sequelize with your PostgreSQL details
const sequelize = new Sequelize('mekanism', 'postgres', 'Test@123', {
  host: 'localhost', // or 'localhost'
  dialect: 'postgres',
  logging: true,    // Set to console.log to see SQL queries in terminal
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
});

async function initDatabase() {
  try {
    await sequelize.authenticate();
    console.log('PostgreSQL database connection established successfully.');

    await sequelize.sync({ sync: true }); 
    console.log('All models were synchronized successfully.');

  } catch (error) {
    console.error('Unable to connect or sync the database:', error);
  }
}

initDatabase();

module.exports = sequelize;
