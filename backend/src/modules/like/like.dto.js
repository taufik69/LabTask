class LikeDTO {
  static toLikerResponse(like) {
    return {
      id: like.user._id,
      firstName: like.user.firstName,
      lastName: like.user.lastName,
      username: like.user.username,
    };
  }

  static toLikersListResponse(likes) {
    return likes.map((like) => this.toLikerResponse(like));
  }
}

export { LikeDTO };
