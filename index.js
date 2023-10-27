const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion , ObjectId} = require('mongodb');
require('dotenv').config();
const app = express();
const port = process.env.PORT || 5000;

// middleware

app.use(cors());
app.use(express.json());




const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.6nmlwzx.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const servicesCollection = client.db('carDoctorDB').collection('services');
    const bookingCollection = client.db('carDoctorDB').collection('bookings');


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
    app.get('/bookings', async(req, res)  => {
      // console.log(req.query.email);
      let query ={};
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