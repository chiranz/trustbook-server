const functions = require("firebase-functions");
const app = require("express")();
const cors = require("cors");
// Local Imports
const { db } = require("./utils/admin");
const {
  uploadImage,
  addUserDetails,
  getAuthenticatedUser,
  getUserDetails,
  markNotificationsRead,
} = require("./handlers/users");
const { login, signup } = require("./handlers/auth");
const {
  getScreams,
  createNewScream,
  getScream,
  commentOnScream,
  likeScream,
  deleteScream,
} = require("./handlers/screams");
const { firebaseAuth } = require("./utils/firebaseAuth");

app.use(cors());

// SCREAM ROUTES
app.get("/screams", getScreams);
app.post("/scream", firebaseAuth, createNewScream);
app.get("/screams/:screamId", getScream);
// Like and Unlike a Scream
app.get("/screams/:screamId/like", firebaseAuth, likeScream);
// Comment on a scream
app.post("/screams/:screamId/comment", firebaseAuth, commentOnScream);
// TODO: Delete Scream
app.delete("/screams/:screamId", firebaseAuth, deleteScream);

// User Routes
app.post("/user", firebaseAuth, addUserDetails);
app.get("/user", firebaseAuth, getAuthenticatedUser);
app.post("/user/image", firebaseAuth, uploadImage);
app.get("/user/:handle", getUserDetails);
app.post("/notifications", firebaseAuth, markNotificationsRead);

// Auth Routes
app.post("/signup", signup);
app.post("/login", login);

exports.api = functions.region("asia-east2").https.onRequest(app);

exports.createNotificationOnLike = functions
  .region("asia-east2")
  .firestore.document("/likes/{id}")
  .onCreate(async (snapshot) => {
    return await db
      .doc(`/screams/${snapshot.data().screamId}`)
      .get()
      .then((doc) => {
        if (
          doc.exists &&
          doc.data().userHandle !== snapshot.data().userHandle
        ) {
          return db.doc(`/notifications/${snapshot.id}`).set({
            createdAt: new Date().toISOString(),
            recipient: doc.data().userHandle,
            sender: snapshot.data().userHandle,
            type: "like",
            read: false,
            screamId: doc.id,
          });
        }
      })
      .catch((err) => {
        console.error(err);
      });
  });

exports.createNotificationOnComment = functions
  .region("asia-east2")
  .firestore.document("/comments/{id}")
  .onCreate(async (snapshot) => {
    return await db
      .doc(`/screams/${snapshot.data().screamId}`)
      .get()
      .then((doc) => {
        if (
          doc.exists &&
          doc.data().userHandle !== snapshot.data().userHandle
        ) {
          return db.doc(`/notifications/${snapshot.id}`).set({
            createdAt: new Date().toISOString(),
            recipient: doc.data().userHandle,
            sender: snapshot.data().userHandle,
            type: "comment",
            read: false,
            screamId: doc.id,
          });
        }
      })

      .catch((err) => {
        console.error(err);
      });
  });

exports.deleteNotificationOnUnlike = functions
  .region("asia-east2")
  .firestore.document("/likes/{id}")
  .onDelete(async (snapshot) => {
    return await db
      .doc(`/notifications/${snapshot.id}`)
      .delete()
      .catch((err) => {
        console.error(err);
      });
  });

exports.onUserImageChange = functions
  .region("asia-east2")
  .firestore.document("/users/{userId}")
  .onUpdate(async (change) => {
    if (change.before.data().imageUrl !== change.after.data().imageUrl) {
      let batch = db.batch();
      return await db
        .collection("/screams/")
        .where("userHandle", "==", change.before.data().handle)
        .get()
        .then((data) => {
          data.forEach((doc) => {
            const screamRef = db.doc(`/screams/${doc.id}`);
            batch.update(screamRef, {
              userImage: change.after.data().imageUrl,
            });
          });
          return batch.commit();
        });
    } else return true;
  });

exports.onScreamDelete = functions
  .region("asia-east2")
  .firestore.document("/screams/{screamId}")
  .onDelete(async (snapshot, context) => {
    const screamId = context.params.screamId;
    const batch = db.batch();
    return await db
      .collection("comments")
      .where("screamId", "==", screamId)
      .get()
      .then((data) => {
        data.forEach((doc) => {
          const commentRef = db.doc(`comments/${doc.id}`);
          batch.delete(commentRef);
        });
        return db.collection("likes").where("screamId", "==", screamId).get();
      })
      .then((data) => {
        data.forEach((doc) => {
          const likeRef = db.doc(`/likes/${doc.id}`);
          batch.delete(likeRef);
        });
        return db
          .collection("notifications")
          .where("screamId", "==", screamId)
          .get();
      })
      .then((data) => {
        data.forEach((doc) => {
          const notificationRef = db.doc(`/notifications/${doc.id}`);
          batch.delete(notificationRef);
        });

        return batch.commit();
      })
      .catch((err) => {
        console.error(err);
      });
  });
