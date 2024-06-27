const CustomerService = require('./customer-service');
const CustomerRepository = require('../database/repository/customer-repository');
const { ValidatePassword, GenerateSignature } = require('../utils');

jest.mock('../database/repository/customer-repository');
jest.mock('../utils');

describe('CustomerService', () => {
  let service;
  const mockCustomer = {
    _id: '1',
    email: 'user@example.com',
    password: 'hashedpassword',
    salt: 'randomsalt'
  };

  beforeEach(() => {
    CustomerRepository.prototype.FindCustomer = jest.fn();
    ValidatePassword.mockClear();
    GenerateSignature.mockClear();
    service = new CustomerService();
  });

  ////////////////////////// SignIn //////////////////////////////

  describe('SignIn', () => {
    it('should sign in successfully with correct credentials', async () => {
      CustomerRepository.prototype.FindCustomer.mockResolvedValue(mockCustomer);
      ValidatePassword.mockResolvedValue(true);
      GenerateSignature.mockResolvedValue('generatedToken');

      const result = await service.SignIn({ email: 'user@example.com', password: 'password123' });
      expect(result).toEqual({ id: '1', token: 'generatedToken' });
    });

    it('should throw NotFoundError if user does not exist', async () => {
      CustomerRepository.prototype.FindCustomer.mockResolvedValue(null);

      await expect(service.SignIn({ email: 'nonexistent@example.com', password: 'password123' }))
        .rejects.toThrow('user not found with provided email id!');
    });

    it('should throw ValidationError if password does not match', async () => {
      CustomerRepository.prototype.FindCustomer.mockResolvedValue(mockCustomer);
      ValidatePassword.mockResolvedValue(false);

      await expect(service.SignIn({ email: 'user@example.com', password: 'wrongpassword' }))
        .rejects.toThrow('password does not match!');
    });
  });

  ////////////////////////// SignUp //////////////////////////////

  describe('SignUp', () => {
    it('should throw an error if email already exists', async () => {
      CustomerRepository.prototype.FindCustomer.mockResolvedValue(mockCustomer);

      await expect(service.SignUp({ email: 'user@example.com', password: 'password123', phone: '1234567890' }))
        .rejects.toThrow('A user with this email already exists');
    });
  });

  ////////////////////////// Verify Email //////////////////////////////

  describe('VerifyEmail', () => {
    it('should verify the email successfully', async () => {
      CustomerRepository.prototype.FindCustomerByToken.mockResolvedValue({
        _id: '1',
        verifyTokenExpiry: Date.now() + 3600000
      });
      CustomerRepository.prototype.UpdateCustomerById.mockResolvedValue(true);

      const result = await service.VerifyEmail('validToken');
      expect(result).toEqual({ message: 'Email verified successfully' });
    });

    it('should throw NotFoundError if token is invalid', async () => {
      CustomerRepository.prototype.FindCustomerByToken.mockResolvedValue(null);

      await expect(service.VerifyEmail('invalidToken'))
        .rejects.toThrow('Invalid or expired token');
    });

    it('should throw ValidationError if token has expired', async () => {
      CustomerRepository.prototype.FindCustomerByToken.mockResolvedValue({
        _id: '1',
        verifyTokenExpiry: Date.now() - 1000
      });

      await expect(service.VerifyEmail('expiredToken'))
        .rejects.toThrow('Token has expired');
    });
  });

  ////////////////////////// Update Profile //////////////////////////////

  describe('UpdateProfile', () => {
    it('should throw NotFoundError if the user does not exist', async () => {
      CustomerRepository.prototype.UpdateCustomerById.mockResolvedValue(null);
      await expect(service.UpdateProfile('nonexistentId', { firstName: 'John' }))
      .rejects.toThrow('User not found.');
  });
});

////////////////////////// Change Password //////////////////////////////

describe('ChangePassword', () => {
  it('should change the password successfully', async () => {
    CustomerRepository.prototype.FindCustomerById.mockResolvedValue(mockCustomer);
    ValidatePassword.mockResolvedValue(true);
    CustomerRepository.prototype.UpdateCustomerById.mockResolvedValue(true);

    const result = await service.ChangePassword('1', 'oldPassword', 'newPassword');
    expect(result).toEqual({ message: 'Password updated successfully' });
  });

  it('should throw ValidationError if current password does not match', async () => {
    CustomerRepository.prototype.FindCustomerById.mockResolvedValue(mockCustomer);
    ValidatePassword.mockResolvedValue(false);

    await expect(service.ChangePassword('1', 'wrongPassword', 'newPassword'))
      .rejects.toThrow('Current password does not match');
  });

  it('should throw NotFoundError if the user does not exist', async () => {
    CustomerRepository.prototype.FindCustomerById.mockResolvedValue(null);

    await expect(service.ChangePassword('nonexistentId', 'password', 'newPassword'))
      .rejects.toThrow('User not found');
  });
});

////////////////////////// DeleteProfile //////////////////////////////

describe('DeleteProfile', () => {
  it('should delete the profile successfully with a valid user ID', async () => {
    const mockResult = { acknowledged: true, deletedCount: 1 };
    CustomerRepository.prototype.DeleteCustomerById.mockResolvedValue(mockResult);

    const result = await service.DeleteProfile('1');
    expect(result).toEqual({ data: mockResult, payload: { event: 'DELETE_PROFILE', data: { userId: '1' } } });
  });
});
});

