const { CustomerRepository } = require("../database");
const { v4: uuidv4 } = require('uuid');
const sendEmail = require("../utils/emailSender");

const {
  FormateData,
  GeneratePassword,
  GenerateSalt,
  GenerateSignature,
  ValidatePassword,
} = require("../utils");
const {
  NotFoundError,
  ValidationError,
} = require("../utils/errors/app-errors");

// All Business logic will be here
class CustomerService {
  constructor() {
    this.repository = new CustomerRepository();
  }

  async SignIn(userInputs) {
    const { email, password } = userInputs;

    const existingCustomer = await this.repository.FindCustomer({ email });

    if (!existingCustomer)
      throw new NotFoundError("user not found with provided email id!");

    const validPassword = await ValidatePassword(
      password,
      existingCustomer.password,
      existingCustomer.salt
    );
    if (!validPassword) throw new ValidationError("password does not match!");

    const token = await GenerateSignature({
      email: existingCustomer.email,
      _id: existingCustomer._id,
    });

    return { id: existingCustomer._id, token };
  }

  // async SignUp(userInputs) {
  //   const { email, password, phone } = userInputs;

  //   // Check if a user with the same email already exists
  //   const existingUser = await this.repository.FindCustomer({ email });
  //   if (existingUser) {
  //     throw new Error('A user with this email already exists');
  //   }



  //   // create salt
  //   let salt = await GenerateSalt();

  //   let userPassword = await GeneratePassword(password, salt);

  //   const existingCustomer = await this.repository.CreateCustomer({
  //     email,
  //     password: userPassword,
  //     phone,
  //     salt,
  //   });

  //   const token = await GenerateSignature({
  //     email: email,
  //     _id: existingCustomer._id,
  //   });
  //   return { id: existingCustomer._id, token };
  // }

  async SignUp(userInputs) {
    const { email, password, phone } = userInputs;

    // Check if a user with the same email already exists
    const existingUser = await this.repository.FindCustomer({ email });
    if (existingUser) {
      throw new Error('A user with this email already exists');
    }

    // Create salt and hash the password
    const salt = await GenerateSalt();
    const userPassword = await GeneratePassword(password, salt);

    // Generate a verification token
    const verifyToken = uuidv4(); // Make sure you have uuid installed and imported
    const verifyTokenExpiry = Date.now() + 3600000;

    // Create the user with the hashed password, salt, and verification token
    const newUser = await this.repository.CreateCustomer({
      email,
      password: userPassword,
      phone,
      salt,
      verifyToken,
      verifyTokenExpiry, // Token expiry set to 1 hour
    });

    // Send verification email
    const verificationUrl = `http://localhost:3000/verify/${verifyToken}`;
    console.log(verificationUrl);
    await sendEmail({
      to: newUser.email,
      subject: 'Verify Your Email',
      html: `Please click this link to verify your email: <a href="${verificationUrl}">${verificationUrl}</a>`,
    });

    // Return a response indicating that a verification email has been sent
    return { message: "Signup successful, please verify your email." };
  }


  async AddNewAddress(_id, userInputs) {
    const { street, postalCode, city, country } = userInputs;

    return this.repository.CreateAddress({
      _id,
      street,
      postalCode,
      city,
      country,
    });
  }

  async GetProfile(id) {
    return this.repository.FindCustomerById({ id });
  }

  async VerifyEmail(token) {
    const customer = await this.repository.FindCustomerByToken({ verifyToken: token });
    if (!customer) {
      throw new NotFoundError('Invalid or expired token');
    }

    if (customer.verifyTokenExpiry < Date.now()) {
      throw new ValidationError('Token has expired');
    }

    // Update the user's isVerified field to true and remove the verification token
    await this.repository.UpdateCustomerById(customer._id, {
      isVerified: true,
      verifyToken: null,
      verifyTokenExpiry: null,
    });

    return { message: 'Email verified successfully' };
  }

  async DeleteProfile(userId) {
    const data = await this.repository.DeleteCustomerById(userId);
    const payload = {
      event: "DELETE_PROFILE",
      data: { userId },
    };
    return { data, payload };
  }
}

module.exports = CustomerService;
