const express = require('express');
const mongoose = require('mongoose')
const dotenv = require('dotenv')
const cors = require("cors");

//Import Routes
const authRoute = require('./routes/auth')
const resultsRoute = require("./routes/results");


const app = express();
dotenv.config();


app.use(cors());


//Connect to DB
mongoose.connect(process.env.CONNECT_DB,
    {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        useFindAndModify: false,
    },
  () => console.log("Connected to DB")
);


//Middlewear
app.use(express.json());



//Route middlewear
app.use('/api/user', authRoute);
app.use("/api/results", resultsRoute);


//test route 
app.post('/temp/images', (req, res) => {
   res.json(req.body);
});




app.listen(process.env.LOCAL_PORT, () => console.log("Server is up and running"))