import nodemailer, { Transporter } from "nodemailer";
import ejs from "ejs";
import path from "path";

interface mailOptions {
  email: string;
  subject: string;
  template: string;
  data: any;
}

const sendMail = async (options: mailOptions) => {
  const transporter: Transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || "587"),
    service: process.env.SMTP_SERVICE,
    secure: true,
    auth: {
      user: process.env.SMTP_MAIL,
      pass: process.env.SMTP_PASSWORD,
    },
  });

  const { data, email, subject, template } = options;

  const templatePath = path.join(__dirname, "../mails", template);
  const html: string = await ejs.renderFile(templatePath, data);

  const mailOptions = {
    from: process.env.SMTP_MAIL,
    to: email,
    subject,
    html,
  };

  //   sending Email
  const mailStatus = await transporter.sendMail(mailOptions);
  return mailStatus;
};

export default sendMail;
