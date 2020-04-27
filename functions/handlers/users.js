// Local imports
const { db, admin } = require("../utils/admin");
const { reduceUserDetails } = require("../utils/validators");
const { config } = require("../utils/config");

exports.uploadImage = (req, res) => {
  const BusBoy = require("busboy");
  const path = require("path");
  const fs = require("fs");
  const os = require("os");
  const busboy = new BusBoy({
    headers: req.headers,
  });
  let imageFileName;
  let imageToBeUploaded = {};
  busboy.on("file", (fieldname, file, filename, encoding, mimetype) => {
    if (
      mimetype !== "image/jpeg" &&
      mimetype !== "image/png" &&
      mimetype !== "image/jpg"
    ) {
      return res.status(400).json({ error: "Wrong file type submitted" });
    }
    const imageExtension = filename.split(".")[filename.split(".").length - 1];
    imageFileName = `${((Math.random() * 0xffffff) << 0).toString(
      16
    )}.${imageExtension}`;
    const filePath = path.join(os.tmpdir(), imageFileName);

    imageToBeUploaded = {
      filePath,
      mimetype,
    };
    file.pipe(fs.createWriteStream(filePath));
  });
  busboy.on("finish", () => {
    admin
      .storage()
      .bucket(config.storageBucket)
      .upload(imageToBeUploaded.filePath, {
        resumable: false,
        metadata: {
          metadata: {
            contentType: imageToBeUploaded.mimetype,
          },
        },
      })
      .then(() => {
        const imageUrl = `https://firebasestorage.googleapis.com/v0/b/${config.storageBucket}/o/${imageFileName}?alt=media`;
        return db
          .doc(`users/${req.user.handle}`)
          .update({
            imageUrl,
          })
          .then(() => {
            return res.json({ message: "Image Uploaded Successfully" });
          })
          .catch((err) => {
            console.log(err);
            return res.status(500).json({
              error: err.code,
            });
          });
      });
  });
  busboy.end(req.rawBody);
};

// Add user details
exports.addUserDetails = (req, res) => {
  // Check if request has body
  if (Object.keys(req.body).length === 0) {
    res.json({
      message: "Request body is empty. Please send fields with data",
    });
  }

  // get trimmed and modified data
  let userDetails = reduceUserDetails(req.body);

  db.doc(`/users/${req.user.handle}`)
    .update(userDetails)
    .then(() => {
      return res.json({
        message: `Details updated successfully for ${req.user.handle}`,
      });
    })
    .catch((err) => {
      console.log(err);
      return res.status(500).json({ error: err.code });
    });
};

// Get own user details
exports.getAuthenticatedUser = (req, res) => {
  let userData = {};
  db.doc(`/users/${req.user.handle}`)
    .get()
    .then((doc) => {
      if (doc.exists) {
        userData.credentials = doc.data();
        return db
          .collection("likes")
          .where("userHandle", "==", req.user.handle)
          .get();
      }
    })
    .then((data) => {
      userData.likes = [];
      data.forEach((doc) => {
        userData.likes.push(doc.data());
      });
      return db
        .collection("notifications")
        .where("recipient", "==", req.user.handle)
        .orderBy("createdAt", "desc")
        .limit(10)
        .get();
    })
    .then((data) => {
      userData.notifications = [];

      data.forEach((doc) => {
        userData.notifications.push({
          ...doc.data(),
          notificationsId: doc.id,
        });
      });
      return res.json(userData);
    })
    .catch((err) => {
      console.error(err);
      return res.status(500).json({ error: err.code });
    });
};

exports.getUserDetails = (req, res) => {
  let userData = {};
  db.doc(`/users/${req.params.handle}`)
    .get()
    .then((doc) => {
      if (!doc.exists) {
        return res.status(404).json({ error: "User not found" });
      }
      userData.user = doc.data();
      return db
        .collection("/screams/")
        .where("userHandle", "==", req.params.handle)
        .orderBy("createdAt", "desc")
        .get();
    })
    .then((data) => {
      userData.screams = [];
      data.forEach((doc) => {
        userData.screams.push({
          ...doc.data(),
          screamId: doc.id,
        });
      });
      return res.json(userData);
    })
    .catch((err) => {
      console.error(err);
      return res.status(500).json({ error: err.code });
    });
};

exports.markNotificationsRead = (req, res) => {
  const batch = db.batch();
  req.body.forEach((notificationId) => {
    const docRef = db.doc(`notifications/${notificationId}`);
    batch.update(docRef, { read: true });
  });
  batch
    .commit()
    .then(() => {
      return res.status(201).json({ message: "notifications marked read" });
    })
    .catch((err) => {
      console.error(err);
      return res.status(500).json({ error: err.code });
    });
};
