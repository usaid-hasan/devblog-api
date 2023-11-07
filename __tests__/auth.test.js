import { env } from 'node:process';
import { beforeAll, describe, expect, test, vi } from 'vitest';
import ms from 'ms';
import Email from '@/utils/email';
import { createResetToken, resetTokenHash } from '@/utils/helpers';
import { generateUsers } from '@/tests/helpers';

describe('tests for api calls related to user authentication', () => {
  let user1, user2, user3;
  const NO_OF_USERS = 3;

  beforeAll(async () => {
    [user1, user2, user3] = generateUsers(NO_OF_USERS);
    await db.resetDb({ users: true });
    await db.initDb({ users: [user1, user2, user3] });
  });

  /************************************************************/

  describe('mutation [signIn]', () => {
    const password = 'test1234';

    test('error if username does not exist', async () => {
      const [{ data, errors }] = await client.execute(
        { query: query.SIGNIN_USER, variables: { username: 'not_in_db', password } },
      );

      expect(data).toBeNull();
      expect(errors[0].message).toMatchInlineSnapshot('"Incorrect email or password."');
      expect(errors[0].extensions.code).toMatchInlineSnapshot('"AUTHENTICATON_FAILED"');
    });

    test('error if password is incorrect', async () => {
      const [{ data, errors }] = await client.execute(
        { query: query.SIGNIN_USER, variables: { username: user1.username, password: 'test1235' } },
      );

      expect(data).toBeNull();
      expect(errors[0].message).toMatchInlineSnapshot('"Incorrect email or password."');
      expect(errors[0].extensions.code).toMatchInlineSnapshot('"AUTHENTICATON_FAILED"');
    });

    test('successfully login with a session cookie', async () => {
      const [{ data }, jwt] = await client.execute(
        { query: query.SIGNIN_USER, variables: { username: user1.username, password } },
      );

      expect(jwt).toBeDefined();
      expect(jwt.maxAge).toBeUndefined();
      expect(data.signIn).toStrictEqual(user1);
    });

    test('successfully login with a persistent cookie', async () => {
      const [{ data }, jwt] = await client.execute(
        { query: query.SIGNIN_USER, variables: { username: user1.username, password, rememberme: 'yes' } },
      );

      expect(jwt).toBeDefined();
      // eslint-disable-next-line no-magic-numbers
      expect(jwt.maxAge).toBe(ms(env.JWT_PERSISTENT_EXP) / 1000);
      expect(data.signIn).toStrictEqual(user1);
    });
  });

  /************************************************************/

  describe('mutation [signOut]', () => {
    test('clear the jwt cookie', async () => {
      const [{ data }, jwt] = await client.execute({ query: query.SIGNOUT_USER });

      expect(jwt).toBeDefined();
      expect(jwt.value).toBe('');
      expect(jwt.maxAge).toBeUndefined();
      expect(data.signOut).toBeTruthy();
    });
  });

  /************************************************************/

  describe('mutation [signUp]', () => {
    const username = 'test_user',
          password = 'test1234',
          email = 'test_email@abc.com',
          avatar = '5e2a703ddbf96190900c35c3a3aa3cb5';

    test('error if username is less than 3 characters', async () => {
      const [{ data, errors }] = await client.execute(
        { query: query.SIGNUP_USER, variables: { username: 'a', password, email } },
      );

      expect(data).toBeNull();
      expect(errors[0].message).toMatchInlineSnapshot('"Error! Please provide a username with atleast 3 characters."');
      expect(errors[0].extensions.code).toMatchInlineSnapshot('"BAD_REQUEST"');
    });

    test('error if username is longer than 20 characters', async () => {
      const [{ data, errors }] = await client.execute(
        { query: query.SIGNUP_USER, variables: { username: 'a_really_long_username', password, email } },
      );

      expect(data).toBeNull();
      expect(errors[0].message).toMatchInlineSnapshot('"Error! Please provide a username with less than 20 characters."');
      expect(errors[0].extensions.code).toMatchInlineSnapshot('"BAD_REQUEST"');
    });

    test('error if username is empty', async () => {
      const [{ data, errors }] = await client.execute(
        { query: query.SIGNUP_USER, variables: { username: '', password, email } },
      );

      expect(data).toBeNull();
      expect(errors[0].message).toMatchInlineSnapshot('"Error! Please provide a username."');
      expect(errors[0].extensions.code).toMatchInlineSnapshot('"BAD_REQUEST"');
    });

    test('error if username contains invalid characters', async () => {
      const [{ data, errors }] = await client.execute(
        { query: query.SIGNUP_USER, variables: { username: 'test$1234', password, email } },
      );

      expect(data).toBeNull();
      expect(errors[0].message).toMatchInlineSnapshot('"Error! Only letters, numbers & underscores allowed with no consecutive underscores at start or end."');
      expect(errors[0].extensions.code).toMatchInlineSnapshot('"BAD_REQUEST"');
    });

    test('error if username starts with double underscore', async () => {
      const [{ data, errors }] = await client.execute(
        { query: query.SIGNUP_USER, variables: { username: '__test1234', password, email } },
      );

      expect(data).toBeNull();
      expect(errors[0].message).toMatchInlineSnapshot('"Error! Only letters, numbers & underscores allowed with no consecutive underscores at start or end."');
      expect(errors[0].extensions.code).toMatchInlineSnapshot('"BAD_REQUEST"');
    });

    test('error if username ends with double underscore', async () => {
      const [{ data, errors }] = await client.execute(
        { query: query.SIGNUP_USER, variables: { username: 'test1234__', password, email } },
      );

      expect(data).toBeNull();
      expect(errors[0].message).toMatchInlineSnapshot('"Error! Only letters, numbers & underscores allowed with no consecutive underscores at start or end."');
      expect(errors[0].extensions.code).toMatchInlineSnapshot('"BAD_REQUEST"');
    });

    test('error if username already exists', async () => {
      const [{ data, errors }] = await client.execute(
        { query: query.SIGNUP_USER, variables: { username: user1.username, password, email } },
      );

      expect(data).toBeNull();
      expect(errors[0].message).toMatchInlineSnapshot('"Please use different username"');
      expect(errors[0].extensions.code).toMatchInlineSnapshot('"BAD_REQUEST"');
    });

    test('error if password is less than 8 characters', async () => {
      const [{ data, errors }] = await client.execute(
        { query: query.SIGNUP_USER, variables: { username, password: 'test123', email } },
      );

      expect(data).toBeNull();
      expect(errors[0].message).toMatchInlineSnapshot('"Error! Password must be atleast 8 characters long."');
      expect(errors[0].extensions.code).toMatchInlineSnapshot('"BAD_REQUEST"');
    });

    test('error if password is empty', async () => {
      const [{ data, errors }] = await client.execute(
        { query: query.SIGNUP_USER, variables: { username, password: '', email } },
      );

      expect(data).toBeNull();
      expect(errors[0].message).toMatchInlineSnapshot('"Error! Please provide a password."');
      expect(errors[0].extensions.code).toMatchInlineSnapshot('"BAD_REQUEST"');
    });

    test('error if email is invalid', async () => {
      const [{ data, errors }] = await client.execute(
        { query: query.SIGNUP_USER, variables: { username, password, email: 'test_emaildotcom' } },
      );

      expect(data).toBeNull();
      expect(errors[0].message).toMatchInlineSnapshot('"Error! Please provide a valid email."');
      expect(errors[0].extensions.code).toMatchInlineSnapshot('"BAD_REQUEST"');
    });

    test('error if email is empty', async () => {
      const [{ data, errors }] = await client.execute(
        { query: query.SIGNUP_USER, variables: { username, password, email: '' } },
      );

      expect(data).toBeNull();
      expect(errors[0].message).toMatchInlineSnapshot('"Error! Please provide a valid email."');
      expect(errors[0].extensions.code).toMatchInlineSnapshot('"BAD_REQUEST"');
    });

    test('error if email already exists', async () => {
      const [{ data, errors }] = await client.execute(
        { query: query.SIGNUP_USER, variables: { username, password, email: user1.email } },
      );

      expect(data).toBeNull();
      expect(errors[0].message).toMatchInlineSnapshot('"Please use different email"');
      expect(errors[0].extensions.code).toMatchInlineSnapshot('"BAD_REQUEST"');
    });

    test('successfully creates a user', async () => {
      const [{ data }, jwt] = await client.execute(
        { query: query.SIGNUP_USER, variables: { username, password, email } },
      );

      expect(jwt).toBeDefined();
      expect(data.signUp).toStrictEqual({
        id: expect.any(String),
        username,
        email,
        avatar,
        likedPosts: [],
      });
    });
  });

  /************************************************************/

  describe('mutation [forgotPassword]', () => {
    test('fake response for non existent email', async () => {
      const [{ data }] = await client.execute(
        { query: query.FORGOT_PASSWORD, variables: { email: 'fake_email@abc.com' } },
      );

      expect(data.forgotPassword).toMatchInlineSnapshot('"Your reset token is sent to email. Token is valid for only (10) minutes."');
    }, { timeout: 6000 });

    test('successfully send the email with reset token', async () => {
      const [{ data }] = await client.execute(
        { query: query.FORGOT_PASSWORD, variables: { email: user1.email } },
      );

      expect(data.forgotPassword).toMatchInlineSnapshot('"Your reset token is sent to email. Token is valid for only (10) minutes."');
    }, { timeout: 6000 });

    test('token has already been sent and not expired', async () => {
      const [{ data: data1 }] = await client.execute(
        { query: query.FORGOT_PASSWORD, variables: { email: user2.email } },
      );

      expect(data1.forgotPassword).toMatchInlineSnapshot('"Your reset token is sent to email. Token is valid for only (10) minutes."');

      // Send the token again
      const [{ data: data2 }] = await client.execute(
        { query: query.FORGOT_PASSWORD, variables: { email: user2.email } },
      );

      expect(data2.forgotPassword).toMatchInlineSnapshot('"Your reset token is sent to email. Token is valid for only (10) minutes."');
    }, { timeout: 12000 });

    test('error if unable to send email', async () => {
      vi.spyOn(Email.prototype, 'sendPasswordResetToken').mockRejectedValueOnce(new Error('Error sending email'));
      const { body: { singleResult: { data, errors } } } = await server.executeOperation(
        { query: query.FORGOT_PASSWORD, variables: { email: user3.email } },
      );

      expect(data).toBeNull();
      expect(errors[0].message).toMatchInlineSnapshot('"Problem sending the email! Try again later."');
      expect(errors[0].extensions.code).toMatchInlineSnapshot('"INTERNAL_SERVER_ERROR"');

      const { body: { singleResult: { data: data1 } } } = await server.executeOperation(
        { query: query.FORGOT_PASSWORD, variables: { email: user3.email } },
      );

      expect(data1.forgotPassword).toMatchInlineSnapshot('"Your reset token is sent to email. Token is valid for only (10) minutes."');
    });
  });

  /************************************************************/

  describe('mutation [resetPassword]', () => {
    let resetToken, expiredToken;
    const password = 'test1234';

    beforeAll(async () => {
      resetToken = await createResetToken();
      expiredToken = await createResetToken();

      await db.updateDb(user1, 'users', '$set', {
        passwordResetToken: resetTokenHash(resetToken),
        passwordResetTokenExpiresAt: Date.now() + ms('10m'),
      });
      await db.updateDb(user2, 'users', '$set', {
        passwordResetToken: resetTokenHash(expiredToken),
        passwordResetTokenExpiresAt: Date.now() - ms('10m'),
      });
    });

    test('error if reset token does not exist or is invalid', async () => {
      const [{ data, errors }] = await client.execute(
        { query: query.RESET_PASSWORD, variables: { resetToken: '', password } },
      );

      expect(data).toBeNull();
      expect(errors[0].message).toMatchInlineSnapshot('"Reset token is invalid or has expired."');
      expect(errors[0].extensions.code).toMatchInlineSnapshot('"BAD_REQUEST"');
    });

    test('error if reset token is valid but expired', async () => {
      const [{ data, errors }] = await client.execute(
        { query: query.RESET_PASSWORD, variables: { resetToken: expiredToken, password } },
      );

      expect(data).toBeNull();
      expect(errors[0].message).toMatchInlineSnapshot('"Reset token is invalid or has expired."');
      expect(errors[0].extensions.code).toMatchInlineSnapshot('"BAD_REQUEST"');
    });

    test('error if new password is less than 8 characters', async () => {
      const [{ data, errors }] = await client.execute(
        { query: query.RESET_PASSWORD, variables: { resetToken, password: 'test123' } },
      );

      expect(data).toBeNull();
      expect(errors[0].message).toMatchInlineSnapshot('"Error! Password must be atleast 8 characters long."');
      expect(errors[0].extensions.code).toMatchInlineSnapshot('"BAD_REQUEST"');
    });

    test('error if new password is empty', async () => {
      const [{ data, errors }] = await client.execute(
        { query: query.RESET_PASSWORD, variables: { resetToken, password: '' } },
      );

      expect(data).toBeNull();
      expect(errors[0].message).toMatchInlineSnapshot('"Error! Please provide a password."');
      expect(errors[0].extensions.code).toMatchInlineSnapshot('"BAD_REQUEST"');
    });

    test('successfully reset account password', async () => {
      const [{ data }, jwt] = await client.execute(
        { query: query.RESET_PASSWORD, variables: { resetToken, password } },
      );

      expect(jwt).toBeDefined();
      expect(jwt.maxAge).toBeUndefined();
      expect(data.resetPassword).toStrictEqual(user1);

      // Error if user try to reuse the token after resetting the new password
      const [{ data: data1, errors }] = await client.execute(
        { query: query.RESET_PASSWORD, variables: { resetToken, password } },
      );

      expect(data1).toBeNull();
      expect(errors[0].message).toMatchInlineSnapshot('"Reset token is invalid or has expired."');
      expect(errors[0].extensions.code).toMatchInlineSnapshot('"BAD_REQUEST"');
    });
  });
});
