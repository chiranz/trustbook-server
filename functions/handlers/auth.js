// Module imports
const firebase = require("firebase");

// Local imports
const { config } = require("../utils/config");
const { db } = require("../utils/admin");
const {
  validateLoginData,
  validateSignupData,
} = require("../utils/validators");

firebase.initializeApp(config);

exports.login = (req, res) => {
  const { email, password } = req.body;
  const user = { email, password };
  const { errors, isValid } = validateLoginData(user);
  if (!isValid) {
    return res.status(400).json(errors);
  }
  return firebase
    .auth()
    .signInWithEmailAndPassword(user.email, user.password)
    .then((data) => data.user.getIdToken())
    .then((token) => {
      return res.json({ token });
    })
    .catch((err) => {
      return res
        .status(403)
        .json({ global: "wrong credentials, please try again" });
    });
};

exports.signup = (req, res) => {
  const { email, handle, password, confirmPassword } = req.body;
  const newUser = {
    email,
    handle,
    password,
    confirmPassword,
  };
  const { errors, isValid } = validateSignupData(newUser);
  if (!isValid) {
    return res.status(400).json(errors);
  }
  const defaultImage = "default.png";
  let token, userId;
  db.doc(`users/${newUser.handle}`)
    .get()
    .then((doc) => {
      if (doc.exists) {
        return res.status(400).json({ handle: "This handle is already taken" });
      } else {
        return firebase
          .auth()
          .createUserWithEmailAndPassword(newUser.email, newUser.password)
          .then((data) => {
            userId = data.user.uid;
            return data.user.getIdToken();
          })
          .then((authToken) => {
            token = authToken;
            const userCredentials = {
              handle: newUser.handle,
              email: newUser.email,
              createdAt: new Date().toISOString(),
              imageUrl: `https://firebasestorage.googleapis.com/v0/b/${config.storageBucket}/o/${defaultImage}?alt=media`,
              userId,
            };
            return db.doc(`/users/${newUser.handle}`).set(userCredentials);
          })
          .then(() => {
            return res.status(201).json({
              token,
            });
          })
          .catch((err) => {
            console.log(err);
            if (err.code === "auth/email-already-in-use") {
              return res
                .status(400)
                .json({ email: "This email is already taken" });
            } else if (err.code === "auth/weak-password") {
              return res.status(400).json({
                password: "password must be min 6 characters",
              });
            } else {
              return res.status(500).json({ error: err.code });
            }
          });
      }
    });
};
