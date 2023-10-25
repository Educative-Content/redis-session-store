const express = require('express');
const session = require('express-session');
const redis = require('redis');
const connectRedis = require('connect-redis');
const bodyParser = require('body-parser');
const ip = require("ip");

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));

app.set('trust proxy', 1);
const RedisStore = connectRedis(session);

const primary_endpoint = process.env.PRIMARY_ENDPOINT;

const redisClient = redis.createClient({
  host: primary_endpoint,
  port: 6379
});

redisClient.on('error', function (err) {
  console.log('Could not establish a connection with Redis. ' + err);
});

redisClient.on('connect', function (err) {
  console.log('Connected to Redis successfully.');
});

app.use(session({
  store: new RedisStore({ client: redisClient }),
  secret: 'secret_educative_string',
  resave: false,
  saveUninitialized: false,
  cookie: {
      secure: false,
      httpOnly: false,
      maxAge: 10000 * 60 * 10
  }
}));

const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  let form = `
  <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; background-color: #F3F3F3; font-family: Arial, sans-serif;">
    <form action="/set_custom_session" method="POST" style="padding: 30px; border: 1px solid #e0e0e0; background-color: #FFFFFF; border-radius: 5px; box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1); width: 350px;">
      <label for="customSession" style="color: #3498DB; font-size: 1.5em;">Enter Custom Session Value:</label><br>
      <input type="text" id="customSession" name="customSession" placeholder="Enter session value" style="margin-top: 20px; padding: 10px; width: 100%; font-size: 1.2em; border-radius: 3px;"><br>
      <input type="submit" value="Submit" style="margin-top: 30px; padding: 10px 20px; background-color: #2ECC71; border: none; color: white; cursor: pointer; font-size: 1.2em; border-radius: 3px;">
    </form>
    <div style="color: #7F8C8D; margin-top: 30px; background-color: #FFFFFF; padding: 20px; border-radius: 5px; box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1); width: 350px; text-align: center;">
      Host IP: ${ip.address()}<br>
      Custom Session Value: ${req.session.customSession || 'Not set'}
    </div>
    <a href="/clear_custom_session" style="color: #E74C3C; text-decoration: none; margin-top: 20px; font-size: 1.2em;">Clear Session</a>
  </div>`;
  
  res.send(form);
});

app.post('/set_custom_session', (req, res) => {
  req.session.customSession = req.body.customSession;
  res.redirect('/');
});

app.get('/clear_custom_session', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      return res.redirect('/');
    }
    res.redirect('/');
  });
});

app.listen(PORT, () => console.log(`Server listening at port ${PORT}`));
