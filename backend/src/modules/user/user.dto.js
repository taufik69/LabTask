class UserDTO {
  static toResponse(user) {
    return {
      id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      username: user.username,
      email: user.email,
      createdAt: user.createdAt,
    };
  }

  static toListResponse(users) {
    return users.map((user) => this.toResponse(user));
  }
}

export { UserDTO };
