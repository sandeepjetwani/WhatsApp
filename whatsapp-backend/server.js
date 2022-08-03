//importing
import  express from 'express';
import mongoose from 'mongoose';
import Messages from './dbMessages.js'
import Pusher from "pusher";
import cors from "cors"



//appconfig
const app= express()
const port= process.env.PORT || 9000
const pusher = new Pusher({
    appId: "1433582",
    key: "5631517de34d4f3989f1",
    secret: "eae48fc3f50d4f65d6db",
    cluster: "ap2",
    useTLS: true
  });

//middleware
app.use(express.json())
app.use(cors())

//DBconfig
const connection_url='mongodb+srv://sandeep:sandeep@cluster0.e5utpbj.mongodb.net/?retryWrites=true&w=majority'
mongoose.connect(connection_url)

const db= mongoose.connection;

db.once("open", () => {
    console.log("DB connected");

    const msgCollection= db.collection("messagecontents");
    const changeStream= msgCollection.watch();

    changeStream.on("change", (change) =>{
        console.log("a change occured",change);

        if(change.operationType==="insert"){
            const messageDetails= change.fullDocument;
            pusher.trigger("messages","inserted",
            {
                name:messageDetails.name,
                message: messageDetails.message,
                timestamp: messageDetails.timestamp,
                received: messageDetails.received

            });
        }else{
            console.log("error triggering pusher");
        }
    })
});

//apiroutes
app.get("/", (req,res)=> 
res.status(200).send('heyy')
)
app.get('/messages/sync', (req, res) => {
    Messages.find((err,data) =>{
        if(err){
            res.status(500).send(err)
        }else{
            res.status(200).send(data)
        }
    })
})
app.post('/messages/new',(req,res) =>{
    const dbMessage= req.body
    
    Messages.create(dbMessage, (err,data) => {
        if (err) {
            res.status(500).send(err)
        }else{
            res.status(201).send(data)
        }

    })
})


//listen
app.listen(port, ()=> console.log(`Listening on local host:${port}`))