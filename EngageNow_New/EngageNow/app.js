import express from "express";
import bodyParser from "body-parser";
import pg from "pg";

const db = new pg.Client({
    user: "postgres",
    database: "EngageNow",
    port: 5432,
    host: "localhost",
    password: "dbyeager123"
});

db.connect();

const app = express();
const port = 3000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

app.set("view engine", "ejs");

app.get("/", (req, res) => {
    res.render("login");
});

app.get("/index", (req, res) => {
    res.render("index");
});


app.get("/events", (req, res) => {
    res.render("events");
});


app.get("/dashboard", (req, res) => {
    res.render("dashboard");
});

app.get("/myevent", (req, res) => {
    res.render("myevent");
});

app.get("/orgdetails", (req, res) => {
    const userId = req.query.userid;

    try {
        res.render("orgdetails", { userId });
    } catch (err) {
        console.error("Error rendering orgdetails:", err);
        res.send("Error rendering orgdetails");
    }
 
});


app.get("/orgevents", (req, res) => {
    res.render("orgevents");
});

app.get("/regevents", (req, res) => {
    res.render("regevents");
});


app.get("/selectevent", (req, res) => {
    res.render("selectevent");
});

app.get("/services", (req, res) => {
    res.render("services");
});


app.post("/signup", async (req, res) => {
    const { username, password, role } = req.body;
    let query;
    let values;
  
    query = "INSERT INTO users(username, password, user_type) VALUES($1, $2, $3) RETURNING id";
    values = [username, password, role];
  
    try {
      const result = await db.query(query, values);
      const userId = result.rows[0].id;
  
      if (role === "organizer") {
        res.redirect(`/orgdetails?userId=${userId}`);
      } else {
        res.redirect("/index");
      }
    } catch (err) {
      console.error("Error in signup:", err);
      res.send("Error in signup");
    }
  });
  



  app.post("/login", async (req, res) => {
    const { username, password } = req.body;
    let query = "SELECT id, user_type FROM users WHERE username=$1 AND password=$2";
    let values = [username, password];

    try {
        const result = await db.query(query, values);

        if (result.rows.length > 0) {
            const userId = result.rows[0].id;
            const userType = result.rows[0].user_type;

            if (userType === "organizer") {
                res.redirect(`/orgdetails?userId=${userId}`);
            } else if (userType === "resident") {
                res.redirect(`/index?userId=${userId}`);
            } else {
               
                res.redirect("/");
            }
        } else {
            res.redirect("/");
        }
    } catch (err) {
        console.error("Error in login:", err);
        res.send("Error in login");
    }
});

app.post("/orgdetails", async (req, res) => {
    const userId = parseInt(req.query.userId);

    console.log("userId:", userId); 
    if (isNaN(userId)) {
        console.error("userId is NaN or not provided");
        res.status(400).send("userId is required and must be a number");
        return;
    }

    const { companyName, phoneNumber, service, location } = req.body;

    const query = `
        INSERT INTO organizer_details (organizer_id, company_name, phone_number, service, location)
        VALUES ($1, $2, $3, $4, $5)
    `;
    const values = [userId, companyName, phoneNumber, service, location];

    try {
        const result = await db.query(query, values);
        console.log("Insert successful:", result); 
        res.redirect("/dashboard");
    } catch (err) {
        res.render("/dashboard");
    }
});

app.post('/orgevents', async (req, res) => {
    const { eventName, eventDate, eventTime, eventLocation, eventDescription } = req.body;

    const query = `
        INSERT INTO events (event_name, event_date, event_time, event_location, event_description)
        VALUES ($1, $2, $3, $4, $5)
    `;
    const values = [eventName, eventDate, eventTime, eventLocation, eventDescription];

    try {
        const result = await db.query(query, values);
        console.log("Event added successfully:", result);
        res.redirect('/myevent');
    } catch (err) {
        console.error("Error adding event:", err);
        res.send("Error adding event");
    }
});


app.get('/events', async (req, res) => {
    try {
       
        const result = await db.query('SELECT * FROM events ORDER BY event_date DESC');

        res.render('events', { events: result.rows }); 
    
    } catch (err) {
        console.error('Error fetching events:', err);
    
    }
});

app.get('/myevent', async (req, res) => {
    try {
      const userId = req.query.userId;
  
      const query = `
        SELECT event_name, event_date, event_time, event_location
        FROM events
        WHERE user_id = $1;`;
  
      const { rows } = await db.query(query, [userId]);
      const events = rows;
  
      res.render('myevent', { events });
    } catch (err) {
      console.error('Error fetching events:', err);
      res.status(500).send('Error fetching events');
    }
  });
  

app.listen(port, ()=>{
    console.log(`server running on http://localhost:${port}`);
})