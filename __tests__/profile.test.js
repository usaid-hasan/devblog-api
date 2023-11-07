import { beforeAll, describe, expect, test } from 'vitest';
import { createJwtToken } from '@/utils/helpers';
import { generateUsers } from '@/tests/helpers';

describe('tests for api calls related to user profile', () => {
  let user1, user2, user3, token1, token2, token3;
  const NO_OF_USERS = 3;

  beforeAll(async () => {
    [user1, user2, user3] = generateUsers(NO_OF_USERS);
    [token1, token2, token3] = await Promise.all([
      createJwtToken(user1.id),
      createJwtToken(user2.id),
      createJwtToken(user3.id),
    ]);

    await db.resetDb({ users: true });
    await db.initDb({ users: [user1, user2, user3] });
  });

  /************************************************************/

  describe('mutation [updateUser]', () => {
    const email = 'new_email@abc.com',
          avatar = '93b5f47475da518e33e0ac0150f83806';

    test('error if token does not exist or is invalid', async () => {
      const [{ data, errors }] = await client.execute(
        { query: query.UPDATE_USER, variables: { email } },
      );

      expect(data).toBeNull();
      expect(errors[0].message).toMatchInlineSnapshot('"You need to be signed in to update your email."');
      expect(errors[0].extensions.code).toMatchInlineSnapshot('"UNAUTHENTICATED"');
    });

    test('error if email is empty', async () => {
      const [{ data, errors }] = await client.execute(
        { query: query.UPDATE_USER, variables: { email: '' } },
        token1,
      );

      expect(data).toBeNull();
      expect(errors[0].message).toMatchInlineSnapshot('"Please provide a new email to update."');
      expect(errors[0].extensions.code).toMatchInlineSnapshot('"BAD_REQUEST"');
    });

    test('error if email is invalid', async () => {
      const [{ data, errors }] = await client.execute(
        { query: query.UPDATE_USER, variables: { email: 'anInvalidEmailDotCom' } },
        token1,
      );

      expect(data).toBeNull();
      expect(errors[0].message).toMatchInlineSnapshot('"Error! Please provide a valid email."');
      expect(errors[0].extensions.code).toMatchInlineSnapshot('"BAD_REQUEST"');
    });

    test('error if email has already been taken', async () => {
      const [{ data, errors }] = await client.execute(
        { query: query.UPDATE_USER, variables: { email: user2.email } },
        token1,
      );

      expect(data).toBeNull();
      expect(errors[0].message).toMatchInlineSnapshot('"Please use different email"');
      expect(errors[0].extensions.code).toMatchInlineSnapshot('"BAD_REQUEST"');
    });

    test('successfully updates their email', async () => {
      const [{ data }] = await client.execute({ query: query.UPDATE_USER, variables: { email } }, token1);

      expect(data.updateUser).toStrictEqual({
        ...user1,
        email,
        avatar,
      });
    });
  });

  /************************************************************/

  describe('mutation [updatePassword]', () => {
    const newPassword = 'pass1234',
          currentPassword = 'test1234';

    test('error if token does not exist or is invalid', async () => {
      const [{ data, errors }] = await client.execute(
        { query: query.UPDATE_PASSWORD, variables: { currentPassword, newPassword } },
      );

      expect(data).toBeNull();
      expect(errors[0].message).toMatchInlineSnapshot('"You need to be signed in to update password."');
      expect(errors[0].extensions.code).toMatchInlineSnapshot('"UNAUTHENTICATED"');
    });

    test('error if current password is incorrect', async () => {
      const [{ data, errors }] = await client.execute(
        { query: query.UPDATE_PASSWORD, variables: { currentPassword: 'wrong-password', newPassword } },
        token2,
      );

      expect(data).toBeNull();
      expect(errors[0].message).toMatchInlineSnapshot('"Incorrect password."');
      expect(errors[0].extensions.code).toMatchInlineSnapshot('"AUTHENTICATON_FAILED"');
    });

    test('error if new password is less than 8 characters', async () => {
      const [{ data, errors }] = await client.execute(
        { query: query.UPDATE_PASSWORD, variables: { currentPassword, newPassword: 'test123' } },
        token2,
      );

      expect(data).toBeNull();
      expect(errors[0].message).toMatchInlineSnapshot('"Error! Password must be atleast 8 characters long."');
      expect(errors[0].extensions.code).toMatchInlineSnapshot('"BAD_REQUEST"');
    });

    test('error if new password is empty', async () => {
      const [{ data, errors }] = await client.execute(
        { query: query.UPDATE_PASSWORD, variables: { currentPassword, newPassword: '' } },
        token2,
      );

      expect(data).toBeNull();
      expect(errors[0].message).toMatchInlineSnapshot('"Error! Please provide a password."');
      expect(errors[0].extensions.code).toMatchInlineSnapshot('"BAD_REQUEST"');
    });

    test('successfully updates their password', async () => {
      const [{ data }] = await client.execute(
        { query: query.UPDATE_PASSWORD, variables: { currentPassword, newPassword } },
        token2,
      );

      expect(data.updatePassword).toStrictEqual(user2);

      // Signin with the new password
      const [{ data: data1 }, jwt] = await client.execute(
        { query: query.SIGNIN_USER, variables: { username: user2.username, password: newPassword } },
      );

      expect(jwt).toBeDefined();
      expect(jwt.maxAge).toBeUndefined();
      expect(data1.signIn).toStrictEqual(user2);
    });
  });

  /************************************************************/

  describe('mutation [deleteUser]', () => {
    const password = 'test1234';

    test('error if token does not exist or is invalid', async () => {
      const [{ data, errors }] = await client.execute(
        { query: query.DELETE_USER, variables: { password } },
      );

      expect(data).toBeNull();
      expect(errors[0].message).toMatchInlineSnapshot('"You need to be signed in to delete your account."');
      expect(errors[0].extensions.code).toMatchInlineSnapshot('"UNAUTHENTICATED"');
    });

    test('error if current password is incorrect', async () => {
      const [{ data, errors }] = await client.execute(
        { query: query.DELETE_USER, variables: { password: 'wrong-password' } },
        token3,
      );

      expect(data).toBeNull();
      expect(errors[0].message).toMatchInlineSnapshot('"Incorrect password."');
      expect(errors[0].extensions.code).toMatchInlineSnapshot('"AUTHENTICATON_FAILED"');
    });

    test('successfully delete their profile', async () => {
      const [{ data }] = await client.execute(
        { query: query.DELETE_USER, variables: { password } },
        token3,
      );

      expect(data.deleteUser).toStrictEqual(user3.id);

      // Signin after deleting should fail
      const [{ data: data1, errors }, jwt] = await client.execute(
        { query: query.SIGNIN_USER, variables: { username: user3.username, password } },
      );

      expect(jwt).toBeUndefined();
      expect(data1).toBeNull();
      expect(errors[0].message).toMatchInlineSnapshot('"Incorrect email or password."');
      expect(errors[0].extensions.code).toMatchInlineSnapshot('"AUTHENTICATON_FAILED"');
    });
  });
});
