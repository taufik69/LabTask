import User from "./user.model.js";

class UserRepository {
  create = async (data) => {
    return User.create(data);
  };

  findById = async (id) => {
    return User.findById(id);
  };

  findByEmail = async (email) => {
    return User.findOne({ email });
  };

  findAll = async () => {
    return User.find();
  };

  updateById = async (id, data) => {
    return User.findByIdAndUpdate(id, data, { new: true });
  };

  deleteById = async (id) => {
    return User.findByIdAndDelete(id);
  };
}

export default new UserRepository();
