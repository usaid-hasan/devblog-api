import { env } from 'node:process';
import nodemailer from 'nodemailer';
import mjml2html from 'mjml';
import { htmlToText } from 'html-to-text';

export default class Email {
  static {
    this.from = `${env.APP_NAME} <${env.EMAIL_ID}>`;
    this.tansporter = nodemailer.createTransport({
      host: env.EMAIL_HOST,
      port: env.EMAIL_PORT,
      auth: {
        user: env.EMAIL_USERNAME,
        pass: env.EMAIL_PASSWORD,
      },
      jsonTransport: import.meta.env.TEST,
    });
  }

  constructor({ username, email }) {
    this.email = email;
    this.username = username;
    this.to = `${username} <${email}>`;
  }

  async #sendEmail(subject, mjml) {
    const { html } = mjml2html(mjml);
    const text = htmlToText(mjml, {
      selectors: [
        {
          selector: 'mj-button',
          format: 'anchor',
          options: { linkBrackets: ['[', ']'] },
        },
        {
          selector: 'mj-title',
          format: 'heading',
        },
        {
          selector: '*',
          format: 'block',
        },
      ],
    });

    return await Email.tansporter.sendMail({
      from: Email.from,
      to: this.to,
      subject,
      html,
      text,
    });
  }

  async sendPasswordResetToken(resetToken) {
    const subject = 'Your password reset token';
    const preview = 'Valid for only (10) minutes';
    const url = `${env.CLIENT_URI}/reset-password/${resetToken}`;
    const mjml = `
<mjml>
<mj-head>
  <mj-title>${subject}</mj-title>
  <mj-preview>${preview}</mj-preview>
</mj-head>

<mj-body background-color="#e6e6e6">
  <mj-raw>
    <div style="color: transparent; display: none; height: 0; max-height: 0; max-width: 0; opacity: 0; overflow: hidden; mso-hide: all; visibility: hidden; width: 0;">
      &#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;
    </div>
  </mj-raw>
  <mj-wrapper padding="10px">
    <mj-section padding="25px 10px" background-color="#f6f6f6">
      <mj-column>
        <mj-text color="#333333" font-size="14px">
          Hi ${this.username},
        </mj-text>
        <mj-text color="#333333" font-size="14px">
          Forgot your password?
        </mj-text>
        <mj-text color="#333333" font-size="14px">
          If you requested a password reset, use the link below to complete the process. If you didn't make this request, ignore this email. The token is valid for only (10) minutes.
        </mj-text>
        <mj-button href="${url}" font-size="14px" font-weight="600" background-color="#fb923c" border-radius="8px" inner-padding="15px 25px">
          Reset Your Password
        </mj-button>
        <mj-text color="#333333" font-size="14px">
          If you need any other help, please don't hesitate to contact us by replying to this email.
        </mj-text>
      </mj-column>
    </mj-section>
    <mj-section padding="5px">
      <mj-column>
        <mj-text color="#999999" font-size="12px" align="center">
          &copy; ${env.APP_NAME}.
        </mj-text>
      </mj-column>
    </mj-section>
  </mj-wrapper>
</mj-body>
</mjml>
`;
    return await this.#sendEmail(subject, mjml);
  }
}
