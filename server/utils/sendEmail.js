import nodemailer from 'nodemailer';

const sendEmail = async (options) => {
    // Use a generic SMTP configuration. For testing (if credentials aren't set) you can use Mailtrap or generic Gmail.
    const transporter = nodemailer.createTransport({
        service: process.env.EMAIL_SERVICE || 'gmail',
        auth: {
            user: process.env.EMAIL_USERNAME,
            pass: process.env.EMAIL_PASSWORD,
        },
    });

    const mailOptions = {
        from: `ARL Network <${process.env.EMAIL_FROM || 'noreply@arlnetwork.com'}>`,
        to: options.email,
        subject: options.subject,
        text: options.message,
        html: options.html,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Message sent: %s', info.messageId);
};

export default sendEmail;
