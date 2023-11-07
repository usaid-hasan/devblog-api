import setCookieParser from 'set-cookie-parser';

export default class HttpClient {
  constructor(url) {
    this.url = url;
  }

  async execute(body, token) {
    const headers = new Headers({ 'Content-Type': 'application/json' });
    if (token) headers.append('Cookie', `jwt=${token}`);

    const res = await fetch(this.url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    if (!res.ok) throw new Error(await res.text());

    const { jwt } = setCookieParser.parse(res.headers.getSetCookie(), { map: true });
    const json = await res.json();
    return [json, jwt];
  }
}
