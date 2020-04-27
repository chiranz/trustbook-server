let db = {
  users: [
    {
      userId: "8F8BnOMU37bayRps2FVINF1OnR53",
      email: "chiran@email.com",
      handle: "chiranz",
      createdAt: "2020-04-01T13:01:42.497Z",
      imageUrl: "path/to/image",
      bio: "You will never know",
      website: "https://www.chiranpoudyal.com",
      location: "Banglore India"
    }
  ],
  screams: [
    {
      userHandle: "user",
      body: "this is the scream body",
      createdAt: "2020-03-30T02:31:05.031Z",
      likeCount: 5,
      commentCount: 2
    }
  ],
  comments: [
    {
      userHandle: "user",
      screamId: "3cvyny8qAS2W0i0HfOVK",
      body: "this is my first comment",
      createdAt: "2020-03-30T02:31:05.031Z"
    }
  ],
  notifications: [
    {
      recipient: "user",
      sender: "chiran",
      read: "true/false",
      type: "like/comment",
      createdAt: "2020-03-30T02:31:05.031Z"
    }
  ]
};

const userDetails = {
  credentials: {
    userId: "8F8BnOMU37bayRps2FVINF1OnR53",
    email: "chiran@email.com",
    handle: "chiranz",
    createdAt: "2020-04-01T13:01:42.497Z",
    imageUrl: "path/to/image",
    bio: "You will never know",
    website: "https://www.chiranpoudyal.com",
    location: "Banglore India"
  },
  likes: [
    {
      userHandle: "chiranz",
      screamId: "3cvyny8qAS2W0i0HfOVK"
    },
    {
      userHandle: "chiranz",
      screamId: "3cvyny8qAS2W0i0HfOVK"
    }
  ]
};
