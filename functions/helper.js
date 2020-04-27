const isEmpty = string => {
  if (string.trim() === "") return true;
  return false;
};

const isEmail = email => {
  const regex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  if (string.match(regex)) {
    return true;
  }
  return false;
};

exports = { isEmail, isEmpty };
