const express = require("express");
const app = express();
const mongoose = require("mongoose");
const shortid = require("shortid");
const bodyParser = require("body-parser");
const urlEncoded = bodyParser.urlencoded({ extended: false });
const monthNames = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];
//Connect to atlas mongodb
const URI =
  "mongodb+srv://mongo_1:mongo_1@cluster0.kfcyu.mongodb.net/exercise_app?retryWrites=true&w=majority";
mongoose.connect(URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
console.log("Connection Status : " + mongoose.connection.readyState);
// *make Schema user

const exerciseSchema = new mongoose.Schema(
  {
    description: { type: String, required: true },
    duration: {
      type: Number,
      required: true,
    },
    date: { type: Date, default: Date.now },
  },
  { _id: false }
);
// *make Schema exercise
const userSchema = new mongoose.Schema({
  _id: { type: String, default: shortid.generate() },
  username: { type: String, required: true },
  log: [
    {
      type: exerciseSchema,
      default: {},
    },
  ],
});

//*make Model user
const users = mongoose.model("users", userSchema);
//*make model exercise
const exercises = mongoose.model("exercise", exerciseSchema);
//*add new document to collection
const createUser = async (username, _id) => {
  let new_user = new users({
    _id,
    username,
    log: [],
  });

  new_user = await new_user.save();
  return { username, _id };
};

const addExercise = async (user, exercise) => {
  let new_exercise = new exercises(exercise);
  user.log.push(new_exercise);
  user = await user.save();
  return exercise;
};
//mA8E-9uQZ
//*post create user
app.use(urlEncoded);
app.post("/api/exercise/new-user", async (req, res) => {
  const username = req.body.username;
  const _id = shortid.generate();
  const findUser = await users.findOne({ username });
  if (findUser) {
    res.send("Username already taken");
  } else {
    createUser(username, _id).then(
      (value) => {
        res.json(value);
      },
      (error) => {
        res.send(error.errors["username"].properties.message);
      }
    );
  }
});
//*post exercise
app.post("/api/exercise/add", async (req, res) => {
  const { userId, description, duration, date } = req.body;

  let dateFormat = date !== "" ? new Date(date) : Date.now();
  /**const _id = req.body.userId;
  const description = req.body.description;
  const duration = req.body.duration;
  let date = req.body.date !== "" ? new Date(req.body.date) : new Date(); */
  // let date = new Date(`${dateYear}-${dateMonth}-${dateDay}`) || new Date();
  const log = {
    description,
    duration: parseInt(duration),
    date: dateFormat.toDateString(),
  };
  // date = `${date.getUTCDate()}-${
  //   monthNames[date.getMonth()]
  // }-${date.getFullYear()} `;

  // users.findByIdAndUpdate(
  //   userId,
  //   { $push: { log: log } },
  //   { new: true },
  //   (err, data) => {
  //     if (err) {
  //       res.send(error);
  //     } else {
  //       res.json({
  //         _id: userId,
  //         username: data.username,
  //         date: dateFormat.toDateString(),
  //         duration,
  //         description,
  //       });
  //     }
  //   }
  // );
  //SEVKksl5F
  const findUser = await users.findById(userId).catch((error) => {
    console.log(error);
  });

  if (!findUser) {
    res.send(`User "${userId}" not found`);
  } else {
    addExercise(findUser, log).then(
      (value) => {
        res.json({
          username: findUser.username,
          _id: findUser._id,
          duration: log.duration,
          description: log.description,
          date: log.date,
        });
      },
      (error) => {
        const keys = Object.keys(error.errors);
        res.send(error.errors[keys[0]].properties.message);
      }
    );
  }
});
//* show all users
app.get("/api/exercise/users", async (req, res) => {
  const allUsers = await users.find();
  res.send(allUsers);
});
//log user
app.get("/api/exercise/log", async (req, res) => {
  const { userId, from, to, limit } = req.query;
  if (!userId) {
    res.send("/api/exercise/log?userId=[yourId] is required");
    return;
  }
  let user = await users.findById(userId).catch((error) => {
    console.log(error);
  });
  let log;
  if (!user) {
    res.send("user not found");
  } else {
    log = [...user.log];
    if (from) {
      let dateFrom = new Date(from);
      log = log.filter((exercise) => exercise.date > dateFrom);
    }
    if (to) {
      let dateTo = new Date(to);
      log = log.filter((exercise) => exercise.date < dateTo);
    }
    if (limit === 0 || !limit) {
      res.json({
        _id: userId,
        username: user.username,
        count: log.length,
        log: log,
      });
    } else {
      res.json({
        _id: userId,
        username: user.username,
        count: log.length,
        log: log.slice(0, limit),
      });
    }
  }
});
//*show all userlogs

//*export module
module.exports = app;
