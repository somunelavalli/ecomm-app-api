require('dotenv/config');
const express = require('express');
const morgan = require('morgan');
const mongoose = require('mongoose');
const authJwt = require('./helpers/jwt');
const errorHandler = require('./helpers/error-handler');

const app = express();
const port = process.env.PORT || 3000;

//Middleware
app.use(express.json());
app.use(morgan('tiny'));
app.use(authJwt());
app.use(errorHandler);
app.use(express.static(__dirname + '/public'));

//Routers
const categoriesRoutes = require('./routers/categories');
const productsRoutes = require('./routers/products');
const usersRoutes = require('./routers/users');
const ordersRoutes = require('./routers/orders');

const api = process.env.API_URL;

app.use(`${api}/categories`, categoriesRoutes);
app.use(`${api}/products`, productsRoutes);
app.use(`${api}/users`, usersRoutes);
app.use(`${api}/orders`, ordersRoutes);

app.use('/health', (req, res) => {
  res.send({ message: `API health was good` });
});

//---Database connection----

mongoose
  .connect(process.env.DATABASE_URI)
  .then(() => {
    console.log('Database connection is ready..');
  })
  .catch((err) => {
    console.log('i am coming hereeeeee');
    console.log(err);
  });
app.listen(port, () => {
  console.log('Server is up on Port ' + port);
});
