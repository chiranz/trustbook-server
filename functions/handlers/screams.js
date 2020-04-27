const { db } = require("../utils/admin");

exports.getScreams = (req, res) => {
  db.collection("screams")
    .orderBy("createdAt", "desc")
    .get()
    .then((data) => {
      let screams = [];
      data.forEach((doc) => {
        screams.push({ screamId: doc.id, ...doc.data() });
      });
      return res.json(screams);
    })
    .catch((err) => console.log(err));
};

exports.createNewScream = (req, res) => {
  const newScream = {
    body: req.body.body,
    userHandle: req.user.handle,
    createdAt: new Date().toISOString(),
    userImage: req.user.imageUrl,
    likeCount: 0,
    commentCount: 0,
  };
  db.collection("screams")
    .add(newScream)
    .then((doc) => {
      newScream.screamId = doc.id;
      res.json(newScream);
    })
    .catch((err) => {
      res.status(500).json({ error: "Something went wrong" });
      console.log(err);
    });
};

// Get scream by ID
exports.getScream = (req, res) => {
  let screamData = {};
  db.doc(`screams/${req.params.screamId}`)
    .get()
    .then((doc) => {
      if (!doc.exists) {
        return res.status(404).json({ error: "Scream not found" });
      }
      screamData = doc.data();
      screamData.screamId = doc.id;
      return db
        .collection("comments")
        .where("screamId", "==", req.params.screamId)
        .get();
    })
    .then((data) => {
      screamData.comments = [];
      data.forEach((doc) => {
        screamData.comments.push(doc.data());
      });
      return res.json(screamData);
    })
    .catch((err) => {
      console.error(err);
      return res.status(500).json({ error: err.code });
    });
};

// Comment on a scream
exports.commentOnScream = (req, res) => {
  if (req.body.body.trim() == "") {
    res.status(403).json({ comment: "must not be empty" });
  }
  const screamId = req.params.screamId;
  const screamDocument = db.doc(`/screams/${screamId}`);
  const newComment = {
    body: req.body.body.trim(),
    userHandle: req.user.handle,
    createdAt: new Date().toISOString(),
    screamId: screamId,
    userImage: req.user.imageUrl,
  };
  screamDocument
    .get()
    .then((doc) => {
      if (!doc.exists) {
        return res.status(404).json({ error: "Scream not found" });
      }
      const currentScream = doc.data();
      currentScream.commentCount++;
      return db
        .collection("comments")
        .add(newComment)
        .then(() => {
          return screamDocument.update({
            commentCount: currentScream.commentCount,
          });
        });
    })
    .then(() => {
      res.json(newComment);
    })
    .catch((err) => {
      console.error(err);
      res.status(500).json({ error: err.code });
    });
};

// Like a scream
exports.likeScream = (req, res) => {
  const likeDocument = db
    .collection("likes")
    .where("userHandle", "==", req.user.handle)
    .where("screamId", "==", req.params.screamId)
    .limit(1);
  const screamDocument = db.doc(`/screams/${req.params.screamId}`);
  let screamData;
  screamDocument
    .get()
    .then((doc) => {
      if (doc.exists) {
        screamData = doc.data();
        screamData.screamId = doc.id;
        return likeDocument.get();
      } else {
        return res.status(404).json({ error: "Scream not found!" });
      }
    })
    .then(async (data) => {
      if (data.empty) {
        return await db
          .collection("likes")
          .add({ screamId: req.params.screamId, userHandle: req.user.handle })
          .then(() => {
            screamData.likeCount++;
            return screamDocument.update({ likeCount: screamData.likeCount });
          })
          .then(() => {
            return res.json(screamData);
          });
      } else {
        let likeId;
        await likeDocument.get().then((data) => {
          likeId = data.docs[0].id;
        });
        return db
          .doc(`/likes/${likeId}`)
          .delete()
          .then(() => {
            screamData.likeCount--;
            if (screamData.likeCount < 0) {
              screamData.likeCount = 0;
            }
            return screamDocument.update({ likeCount: screamData.likeCount });
          })
          .then(() => {
            return res.json(screamData);
          });
      }
    })
    .catch((err) => {
      console.error(err);
      return res.status(500).json({ error: err.code });
    });
};

// Delete a scream
exports.deleteScream = (req, res) => {
  const screamDocument = db.doc(`/screams/${req.params.screamId}`);
  screamDocument
    .get()
    .then((doc) => {
      if (!doc.exists) {
        return res.status(404).json({ error: "Scream not found" });
      }
      if (doc.data().userHandle !== req.user.handle) {
        return res.status(403).json({ error: "Unauthorized" });
      } else {
        return screamDocument.delete();
      }
    })
    .then(() => {
      return res.json({ message: "Scream deleted successfully" });
    })
    .catch((err) => {
      console.error(err);
      return res.status(500).json({ error: err.code });
    });
};
