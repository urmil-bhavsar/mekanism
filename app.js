require('dotenv').config()
const express = require('express');
const db = require('./models'); // 1. Import the entire models directory (index.js)
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./swagger');
const rootRouter = require('./routes')

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api', rootRouter)
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));


// Sample Route
app.get('/health', (req, res) => {
  res.json({ message: "Express server running with Sequelize & PostgreSQL!" });
});

// 2. Use db.sequelize to authenticate and sync
db.sequelize.authenticate()
  .then(() => {
    console.log('✅ Connection to PostgreSQL database established successfully.');
    
    // 3. Sync all loaded models to the database
    // Use { alter: true } to update tables safely without losing your existing data
    return db.sequelize.sync({ alter: true });
  })
  .then(() => {
    console.log('✅ All database tables synchronized successfully.');
    
    // Start the server
    app.listen(PORT, () => {
      console.log(`🚀 Server is running smoothly on http://localhost:${PORT}`);
    });
  })
  .catch(err => {
    console.error('❌ Database initialization failed:', err);
    process.exit(1); 
  });
