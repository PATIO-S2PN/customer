const CustomerService = require("../services/customer-service");
const UserAuth = require("./middlewares/auth");
const { PublishMessage } = require("../utils");
const { SHOPPING_SERVICE } = require("../config");
const User = require('../database/models/Customer'); // Make sure this path is correct

module.exports = (app, channel) => {
  const service = new CustomerService();

  app.post("/signup", async (req, res, next) => {
    try {
      const { email, password, phone } = req.body;
      const data = await service.SignUp({ email, password, phone });
      return res.json(data);
    } catch (error) {
      next(error);
    }
  });

  app.post("/login", async (req, res, next) => {
    try {
      const { email, password } = req.body;
      const data = await service.SignIn({ email, password });
      return res.json(data);
    } catch (error) {
      next(error);
    }
  });

  app.post("/address", UserAuth, async (req, res, next) => {
    try {
      const { _id } = req.user;
      const { street, postalCode, city, country } = req.body;
      const data = await service.AddNewAddress(_id, {
        street,
        postalCode,
        city,
        country,
      });
      return res.json(data);
    } catch (error) {
      next(error);
    }
  });

  app.get("/profile", UserAuth, async (req, res, next) => {
    try {
      const { _id } = req.user;
      const data = await service.GetProfile({ _id });
      return res.json(data);
    } catch (error) {
      next(error);
    }
  });

  app.put("/profile", UserAuth, async (req, res, next) => {
    try {
      const userId = req.user._id; // Ensure your UserAuth middleware correctly identifies user ID
      const updateFields = req.body;
      const data = await service.UpdateProfile(userId, updateFields);
      return res.json(data);
    } catch (error) {
      next(error);
    }
  });
  
  

  app.post('/change-password', UserAuth, async (req, res, next) => {
    try {
      const userId = req.user._id; // Assuming UserAuth middleware adds user to req
      const { currentPassword, newPassword } = req.body;
  
      // Call the ChangePassword method
      const result = await service.ChangePassword(userId, currentPassword, newPassword);
  
      res.json(result);
    } catch (error) {
      next(error);
    }
  });
  


  app.delete("/profile", UserAuth, async (req, res, next) => {
    try {
      const { _id } = req.user;
      const { data, payload } = await service.DeleteProfile(_id);
      // Send message to Shopping Service for removing cart & wishlist
      PublishMessage(channel, SHOPPING_SERVICE, JSON.stringify(payload));
      return res.json(data);
    } catch (error) {
      next(error);
    }
  });

  app.get('/verify/:token', async (req, res, next) => {
    try {
      const { token } = req.params;
      console.log(token);
      const data = await service.VerifyEmail(token);
      return res.json(data);
    }
    catch (error) {
      next(error);
    }
});

app.post('/forgot-password', async (req, res, next) => {
  try {
      const { email } = req.body;
      const data = await service.ResetPasswordLink(email); // Pass email directly
      return res.json(data);
  } catch (error) {
      next(error);
  }
});

app.post('/reset-password', async (req, res, next) => {
  try {
      const { token, password } = req.body;
      const data = await service.ResetPassword(token, password);
      return res.json(data);
  } catch (error) {
      next(error);
  }
});

  app.get("/whoami", (req, res, next) => {
    return res.status(200).json({ msg: "/customer : I am Customer Service" });
  });
};
