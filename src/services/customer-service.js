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
const { VERIFICATION_URL, RESET_URL } = require("../config");

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
    const verificationUrl =VERIFICATION_URL + verifyToken;
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

  async UpdateProfile(userId, updateFields) {
    // Specify which fields can be updated to prevent updating of sensitive fields
    const { firstName, lastName, phone } = updateFields;
  
    // Prepare the update object, excluding any fields not allowed or not provided
    const updates = {};
    if (firstName !== undefined) updates.firstName = firstName;
    if (lastName !== undefined) updates.lastName = lastName;
    if (phone !== undefined) updates.phone = phone;
    
    // Update the customer in the database
    const updatedCustomer = await this.repository.UpdateCustomerById(userId, updates);
  
    if (!updatedCustomer) {
      throw new NotFoundError("User not found.");
    }
  
    // Assuming FormateData formats the output
    return FormateData(updatedCustomer);
  }
  
  

  async ChangePassword(userId, currentPassword, newPassword) {
    // Find the user by ID
    const customer = await this.repository.FindCustomerById({ id: userId });
    if (!customer) {
      throw new NotFoundError('User not found');
    }
  
    // Validate current password
    const validPassword = await ValidatePassword(currentPassword, customer.password, customer.salt);
    if (!validPassword) {
      throw new ValidationError('Current password does not match');
    }
  
    // Generate a new salt and hash for the new password
    const newSalt = await GenerateSalt();
    const newHashedPassword = await GeneratePassword(newPassword, newSalt);
  
    // Update the user's password and salt in the database
    await this.repository.UpdateCustomerById(customer._id, { password: newHashedPassword, salt: newSalt });
  
    return { message: 'Password updated successfully' };
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

  async ResetPassword(token, password) {
    // Find a user with the provided reset token
    const customer = await this.repository.FindCustomerByResetToken({ resetToken: token });
    if (!customer) {
      throw new NotFoundError('Invalid or expired token');
    }

    if (customer.resetTokenExpiry < Date.now()) {
      throw new ValidationError('Token has expired');
    }

    // Generate a new salt and hash the new password
    const salt = await GenerateSalt();
    const hashedPassword = await GeneratePassword(password, salt);

    // Update the user's password, salt, and remove the reset token
    await this.repository.UpdateCustomerById(customer._id, {
      password: hashedPassword,
      salt: salt,
      resetToken: null,
      resetTokenExpiry: null,
    });

    return { message: 'Password reset successful' };
  }
  
  async ResetPasswordLink(email) {
    // Check if a user with the provided email exists
    const customer = await this.repository.FindCustomer({ email });
    if (!customer) {
      throw new NotFoundError('No user found with this email.');
    }
    const resetToken = uuidv4();
    const resetTokenExpiry = Date.now() + 3600000; // 1 hour from now

    // Assuming you have a method in your repository to update the customer
    await this.repository.UpdateCustomerById(customer._id, {
      resetToken: resetToken,
      resetTokenExpiry: resetTokenExpiry,
    });

    const resetUrl = RESET_URL + resetToken;
    console.log(resetUrl);
    await sendEmail({
      to: customer.email,
      subject: 'Password Reset',
      html: `Please click this link to reset your password: <a href="${resetUrl}">${resetUrl}</a>`,
    });

    // Return a meaningful message back to the controller to be sent to the user
    return { message: 'Password reset email sent.' };
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
