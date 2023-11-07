import Server from '@/server';

export async function setup() {
  await Server.start();
}

export async function teardown() {
  await Server.stop();
}
