const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bodyParser = require('body-parser')
const cors = require('cors');
const userRoutes = require('./routes/user')
const formRoutes = require('./routes/formbot')

dotenv.config();

const app = express();

app.use(bodyParser.urlencoded());
app.use(cors())
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(userRoutes)
app.use(formRoutes)



app.get('/', (req, res) => {
    res.send('Server is running....')
})

app.listen(process.env.Port, (req, res) => {
    mongoose.connect(process.env.Mongo_Url)
    .then(() => {
        console.log('Database is connected!')
    })
    .catch((error) => {
        console.log('Error connecting Database !', error)
    })
})