const login = (req, res) => {
  res.render("login", { title: "Login" });
};

const register = (req, res) => {
  res.render("register", { title: "Register" });
};

module.exports = {
  login,
  register,
};
