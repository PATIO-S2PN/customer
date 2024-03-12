const { APIError } = require("../../utils/errors/app-errors");
const { CustomerModel, AddressModel } = require("../models");

//Dealing with data base operations
class CustomerRepository {
  async CreateCustomer({ email, password, phone, salt, verifyToken, verifyTokenExpiry}) {
    const customer = new CustomerModel({
      email,
      password,
      salt,
      phone,
      verifyToken,
      verifyTokenExpiry,
      resetToken: '',
      resetTokenExpiry: '',  
      otp: '',
      otp_expiry: '',
      firstName: '',
      lastName: '',
      isVerified: false,
      address: [],
    });

    const customerResult = await customer.save();
    return customerResult;
  }

  async CreateAddress({ _id, street, postalCode, city, country }) {
    const profile = await CustomerModel.findById(_id);

    if (profile) {
      const newAddress = new AddressModel({
        street,
        postalCode,
        city,
        country,
      });

      await newAddress.save();

      profile.address.push(newAddress);
    }

    return await profile.save();
  }

  async FindCustomer({ email }) {
    const existingCustomer = await CustomerModel.findOne({ email: email });
    return existingCustomer;
  }

  async FindCustomerByToken({ verifyToken }) {
    const existingCustomer = await CustomerModel.findOne({ verifyToken: verifyToken });
    return existingCustomer;
  }

  async FindCustomerByResetToken({ resetToken }) {
    const existingCustomer = await CustomerModel.findOne({ resetToken : resetToken });
    return existingCustomer;
  }

  async UpdateCustomerById(id, data) {
    const existingCustomer = await CustomerModel.findByIdAndUpdate(id, data, {
      new: true,
    });
    return existingCustomer;
  }
  

  async FindCustomerById({ id }) {
    const existingCustomer = await CustomerModel.findById(id).populate(
      "address"
    );
    return existingCustomer;
  }

  async DeleteCustomerById(id) {
    return CustomerModel.findByIdAndDelete(id);
  }
}

module.exports = CustomerRepository;
