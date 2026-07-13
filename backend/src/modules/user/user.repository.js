import User from "./user.model.js";

class UserRepository {
  findByEmail = async (email) => {
    return await User.findOne({ email });
  };

  findByEmailWithPassword = async (email) => {
    return await User.findOne({ email }).select("+password");
  };

  findById = async (id) => {
    return await User.findById(id);
  };

  create = async (data) => {
    return await User.create(data);
  };

  update = async (id, data) => {
    return await User.findByIdAndUpdate(id, data, { new: true });
  };

  delete = async (id) => {
    return await User.findByIdAndDelete(id);
  };
}

export default new UserRepository();
