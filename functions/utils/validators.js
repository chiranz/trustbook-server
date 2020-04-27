const isEmpty = (string) => {
  if (string.trim() === "") return true;
  return false;
};

const isEmail = (email) => {
  const regex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  if (email.match(regex)) {
    return true;
  } else {
    return false;
  }
};

exports.validateLoginData = (data) => {
  let errors = {};
  console.log(data);
  if (isEmpty(data.email)) {
    errors.email = "must not be empty";
  } else if (!isEmail(data.email)) {
    errors.email = "must be a valid email!";
  }
  if (isEmpty(data.password)) {
    errors.password = "must not be empty";
  }
  return { errors, isValid: Object.keys(errors).length === 0 };
};

exports.validateSignupData = (data) => {
  let errors = {};
  if (isEmpty(data.email)) {
    errors.email = "Must not be empty";
  } else if (!isEmail(data.email)) {
    errors.email = "must be a valid email!";
  }
  if (isEmpty(data.handle)) {
    errors.handle = "must not be empty";
  } else if (data.handle.length < 3) {
    errors.handle = "must be more than 2 chars";
  }
  if (isEmpty(data.password)) {
    errors.password = "most not be empty";
  }
  if (data.password !== data.confirmPassword) {
    errors.confirmPassword = "password's didn't match";
  }
  return { errors, isValid: Object.keys(errors).length === 0 };
};

const getTrimmedData = (data) => {
  if (data) {
    return data.trim();
  }
  return "";
};

exports.reduceUserDetails = (data) => {
  let userDetails = {};
  const trimmedBio = getTrimmedData(data.bio);
  const trimmedWebsite = getTrimmedData(data.website);
  const trimmedLocation = getTrimmedData(data.location);

  if (!isEmpty(trimmedBio)) userDetails.bio = trimmedBio;
  if (!isEmpty(trimmedLocation)) userDetails.location = trimmedLocation;
  if (!isEmpty(trimmedWebsite)) {
    if (trimmedWebsite.substring(0, 4) !== "http") {
      userDetails.website = `http://${trimmedWebsite}`;
    } else {
      userDetails.website = trimmedWebsite;
    }
  }
  return userDetails;
};
