class UserDTO {
  static toResponse(user) {
    return {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
    };
  }

  static toListResponse(users) {
    return users.map((user) => this.toResponse(user));
  }
}

export { UserDTO };
