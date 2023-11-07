/** Fragments */

const postFragment = `#graphql
  id
  content
  likesCount
  createdAt
  updatedAt
  author {
    id
    username
    avatar
  }
`;
const userFragment = `#graphql
  id
  username
  email
  avatar
  likedPosts
`;

/** Queries */

export const GET_POST = `#graphql
  query GetPost($id: ObjectID!) {
    post(id: $id) {
      ${postFragment}
    }
  }
`;

export const GET_POSTFEED = `#graphql
  query GetPostFeed($cursor: ObjectID, $limit: Int) {
    postFeed(cursor: $cursor, limit: $limit) {
      results
      cursor
      hasNextPage
      posts {
        ${postFragment}
      }
    }
  }
`;

export const GET_MY_POSTS = `#graphql
  query GetMyPosts {
    myPosts {
      ${postFragment}
    }
  }
`;

export const GET_MY_LIKED_POSTS = `#graphql
  query GetMyLikedPosts {
    myLikedPosts {
      ${postFragment}
    }
  }
`;

export const GET_ME = `#graphql
  query GetMe {
    me {
      ${userFragment}
    }
  }
`;

/** Mutations */

export const CREATE_POST = `#graphql
  mutation CreatePost($content: String!) {
    createPost(content: $content) {
      ${postFragment}
    }
  }
`;
export const UPDATE_POST = `#graphql
  mutation UpdatePost($id: ObjectID!, $content: String!) {
    updatePost(id: $id, content: $content) {
      ${postFragment}
    }
  }
`;
export const DELETE_POST = `#graphql
  mutation DeletePost($id: ObjectID!) {
    deletePost(id: $id)
  }
`;
export const TOGGLE_LIKE = `#graphql
  mutation ToggleLike($id: ObjectID!) {
    toggleLike(id: $id) {
      likesCount
      liked
    }
  }
`;

export const SIGNIN_USER = `#graphql
  mutation SignIn($username: String!, $password: String!, $rememberme: String) {
    signIn(username: $username, password: $password, rememberme: $rememberme) {
      ${userFragment}
    }
  }
`;

export const SIGNUP_USER = `#graphql
  mutation SignUp($username: String!, $email: String!, $password: String!, $rememberme: String) {
    signUp(username: $username, email: $email, password: $password, rememberme: $rememberme) {
      ${userFragment}
    }
  }
`;

export const SIGNOUT_USER = `#graphql
  mutation SignOut {
    signOut
  }
`;

export const FORGOT_PASSWORD = `#graphql
  mutation ForgotPassword($email: String!) {
    forgotPassword(email: $email)
  }
`;

export const RESET_PASSWORD = `#graphql
  mutation ResetPassword($resetToken: String!, $password: String!) {
    resetPassword(resetToken: $resetToken, password: $password) {
      ${userFragment}
    }
  }
`;

export const UPDATE_USER = `#graphql
  mutation UpdateUser($email: String!) {
    updateUser(email: $email) {
      ${userFragment}
    }
  }
`;

export const UPDATE_PASSWORD = `#graphql
  mutation UpdatePassword($currentPassword: String!, $newPassword: String!) {
    updatePassword(currentPassword: $currentPassword, newPassword: $newPassword) {
      ${userFragment}
    }
  }
`;
export const DELETE_USER = `#graphql
  mutation DeleteUser($password: String!) {
    deleteUser(password: $password)
  }
`;
