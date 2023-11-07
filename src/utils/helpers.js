import { env } from 'node:process';
import { createHash, randomBytes } from 'node:crypto';
import { promisify } from 'node:util';
import { SignJWT, jwtVerify } from 'jose';
import bcrypt from 'bcrypt';
import ms from 'ms';

const randomBytesAsync = promisify(randomBytes);
const secret = new TextEncoder().encode(env.JWT_SECRET);

/************************************************************/

export async function createJwtToken(id, rememberme) {
  const token = await new SignJWT({ id })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime(rememberme ? env.JWT_PERSISTENT_EXP : env.JWT_SESSION_EXP)
    .sign(secret);

  return token;
}

/************************************************************/

export async function verifyJwtToken(token) {
  const { payload } = await jwtVerify(token, secret);
  return payload;
}

/************************************************************/

export function setJwtCookieOnRes(res, token, rememberme) {
  res.cookie('jwt', token, {
    maxAge: rememberme ? ms(env.JWT_COOKIE_EXP) : null,
    httpOnly: true,
    secure: true,
    sameSite: 'None',
  });
}

/************************************************************/

export function unsetJwtCookieOnRes(res) {
  res.clearCookie('jwt', {
    httpOnly: true,
    secure: true,
    sameSite: 'None',
  });
}

/************************************************************/

export async function createResetToken() {
  const SIZE = 32;
  return (await randomBytesAsync(SIZE)).toString('hex');
}

/************************************************************/

export function resetTokenHash(resetToken) {
  return createHash('sha256').update(resetToken).digest('hex');
}

/************************************************************/

export function avatarHash(email) {
  return createHash('md5').update(email).digest('hex');
}

/************************************************************/

export async function passwordMatch(password, hash) {
  return await bcrypt.compare(password, hash);
}

/************************************************************/

export async function passwordHash(password) {
  const ROUNDS = 10;
  return await bcrypt.hash(password, ROUNDS);
}
