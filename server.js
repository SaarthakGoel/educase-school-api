require('dotenv').config();
const express = require('express');
const db = require('./database/connectDB');
const cors = require("cors");
const mysql = require('mysql2');


const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

app.post('/addSchool' , (req , res) => {
  try{
    const {name , address , latitude , longitude} = req.body;

    if(!name || !address || isNaN(latitude) || isNaN(longitude)){
      return res.status(400).json({error : 'Some of the fields are missing . Please ensure name , address , latitude and longitude are passed'});
    }

    if(name !== name.trim() || address !== address.trim()){
      return res.status(400).json({error : 'Name and address should not have leading or trailing whitespaces'});
    }

    if (typeof name !== 'string' || typeof address !== 'string') {
      return res.status(400).json({error: 'Name and address must be strings'});
    }

    if(latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180){
      return res.status(400).json({error : 'Invalid latitude or longitude provided'});
    }

    if(name.length > 100 || address.length > 100){
      return res.status(400).json({error : 'Name and address should not exceed 100 characters'});
    }

    if(latitude.toString().split('.')[1].length > 6 || longitude.toString().split('.')[1].length > 6){
      return res.status(400).json({error : 'Latitude and longitude should not have more than 6 decimal places'});
    }

    const query = `INSERT INTO schools (name , address , latitude , longitude) VALUES ( ? , ? , ? , ? )`;
    const values = [name , address , latitude , longitude];

    db.query(query , values , (err , result) => {
      if(err) {
        console.error('Database insertion error' ,  err);
        return res.status(500).json({error : 'Database insertion error'});
      }

      return res.status(200).json({message : 'School added successfully' , id : result.insertId});
    })
  }catch(error){
    console.log('Error in addSchool' , error);
    return res.status(500).json({error : 'Internal server error'});
  }
})


app.get('/getSchools' , (req , res) => {
  try{
    let {latitude , longitude} = req.query;
    latitude = parseFloat(latitude);
    longitude = parseFloat(longitude);
  
    if(isNaN(latitude) || isNaN(longitude)){
      return res.status(400).json({error : 'Invalid Co ordinates provided'});
    }

    if(latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180){
      return res.status(400).json({error : 'Invalid latitude or longitude provided'});
    }

    if(latitude.toString().split('.')[1].length > 6 || longitude.toString().split('.')[1].length > 6){
      return res.status(400).json({error : 'Latitude and longitude should not have more than 6 decimal places'});
    }
  
    db.query('SELECT * FROM schools' , (err , result) => {
      if(err) {
        console.error('Database query error' , err);
        return res.status(500).json({error : 'Database error'}); 
      }
  
      const  calculateDistance = (lat1 , lon1 , lat2 , lon2) => {
        //Haversine formula
         const RADIUSOFEARTH = 6371;
         const lat = (lat2 - lat1) * Math.PI / 180;
         const lon = (lon2 - lon1) * Math.PI / 180;
         const a = Math.sin(lat / 2) * Math.sin(lat / 2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(lon / 2) * Math.sin(lon / 2);
         const c = 2 * Math.atan2(Math.sqrt(a) , Math.sqrt(1 - a));
         return RADIUSOFEARTH * c;
      }
  
      result.forEach((school) => {
        school.distance = calculateDistance(latitude , longitude , school.latitude , school.longitude);
      });
  
      result.sort((a , b) => a.distance - b.distance);
      return res.status(200).json(result);
    })
  }catch(error){
    console.log('Error in getSchools' , error);
    return res.status(500).json({error : 'Internal server error'});
  }
  
})


app.listen(PORT , () => {
  console.log(`Server is running on port ${PORT}`);
} )


const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
});

db.connect((err) => {
  if(err){
    console.log(err);
  }else{
    console.log('Connected to the database');
  }
})