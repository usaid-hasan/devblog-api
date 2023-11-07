export default `#graphql
  scalar ObjectId
  scalar DateTime

  type Post {
    id: ObjectId!
    content: String!
    author: User!
    likesCount: Int!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type User {
    id: ObjectId!
    username: String!
    avatar: String!
  }

  type Me {
    id: ObjectId!
    username: String!
    avatar: String!
    email: String!
    likedPosts: [ObjectId!]!
  }

  type PostFeed {
    results: Int
    posts: [Post!]!
    cursor: ObjectId
    hasNextPage: Boolean!
  }

  type ToggleLikeResult {
    likesCount: Int!
    liked: Boolean!
  }

  type Query {
    post(id: ObjectId!): Post!
    postFeed(cursor: ObjectId, limit: Int): PostFeed!
    me: Me!
    myPosts: [Post!]!
    myLikedPosts: [Post!]!
  }

  type Mutation {
    signIn(username: String, email: String, password: String!, rememberme: String): Me!
    signUp(username: String!, email: String!, password: String!, rememberme: String): Me!
    signOut: Boolean!
    updateUser(email: String!): Me!
    deleteUser(password: String!): ObjectId!
    updatePassword(currentPassword: String!, newPassword: String!): Me!
    forgotPassword(email: String!): String!
    resetPassword(resetToken: String!, password: String!): Me!
    createPost(content: String!): Post!
    updatePost(id: ObjectId!, content: String!): Post!
    deletePost(id: ObjectId!): ObjectId!
    toggleLike(id: ObjectId!): ToggleLikeResult!
  }
`;
