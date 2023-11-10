const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const { MongoClient, ServerApiVersion , ObjectId} = require('mongodb');
require('dotenv').config();
const app = express();
const port = process.env.PORT || 5000;

// middleware


app.use(cors({
  origin: ['http://localhost:5173'],
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

// user middleware 

const verifyToken = (req, res, next) => {
  const token = req.cookies?.token;
  if(!token)  return res.status(401).send({message: 'unauthorized access'})
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if(err) return res.status(401).send({message: 'unauthorized access'});
    req.user = decoded;
    console.log(req.user);
    next(); 
  })
}





const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.6nmlwzx.mongodb.net/?retryWrites=true&w=majority`;


const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {

    // await client.connect();

    const servicesCollection = client.db('carDoctorDB').collection('services');
    const bookingCollection = client.db('carDoctorDB').collection('bookings');


    // auth related api
    app.post('/jwt', async (req, res)  => {
      const user = req.body;
      // console.log(user);
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {expiresIn: '1h'});
      res
      .cookie('token', token, {
        httpOnly: true,
        secure: false,
        // sameSite: 'none'
      })
      .send({success: true});
    })

    // clear cookies
    app.post('/jwt/logout', async (req, res) => {
      res.clearCookie('token', {maxAge: 0}).send('cookie cleared');
    })



    // services related api
    app.get('/services', async(req, res) => {
        const cursor = servicesCollection.find();
        const result =  await cursor.toArray();
        res.send(result);
    })

    app.get('/services/:id', async(req, res) => {
        const id = req.params.id;
        const query = {_id: new ObjectId(id)}
       
        const result = await servicesCollection.findOne(query);
        res.send(result);
    })

    // booking post api
    app.post('/bookings', async(req, res) => {
      const booking = req.body;
      const result = await bookingCollection.insertOne(booking);
      res.send(result);
    })
    // bookings get api
    app.get('/bookings', verifyToken, async(req, res)  => {
      let query ={};
      if(req.user?.email !== req.query.email) return res.status(403).send({message: 'forbidden access'});
      if(req.query?.email) {
        query = {email: req.query.email};
      }
      const cursor = bookingCollection.find(query);
      const result = await cursor.toArray();
      res.send(result);
    })
    // deleteOne api by id from bookings
    app.delete('/bookings/:id', async (req, res)  => {
      const id = req.params.id;
      const query = {_id: new ObjectId(id)};
      const result = await bookingCollection.deleteOne(query);
      res.send(result);
    })

    // update sate api
    app.patch('/bookings/:id', async (req, res)  => {
      const id = req.params.id;
      const state = req.body;
      const filter = {_id: new ObjectId(id)};
      const options = { upsert: true };
      const updateDoc = {
        $set:{
          state: state.state,
        },
      }
      const result = await bookingCollection.updateOne(filter, updateDoc, options);
      res.send(result);
    })



    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.get('/', (req, res) => {
    res.send('CAR DOCTOR SERVER IS RUNNING...');
})

app.listen(port, () => console.log(`Car doctor server listening to ${port}`));