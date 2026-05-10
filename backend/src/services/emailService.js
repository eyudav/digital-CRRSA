export async function sendEmail({ to, subject, html }) {
  // Placeholder transport for now: keeps integration points stable.
  // Swap with SMTP/provider implementation in next milestone.
  console.log(
    JSON.stringify(
      {
        type: "email.dispatch",
        to,
        subject,
        html,
      },
      null,
      2
    )
  );
}

export function buildVerificationEmail({ fullName, verificationLink }) {
  return {
    subject: "Verify your Digital CERCA account",
    html: `<p>Hello ${fullName},</p><p>Please verify your email to activate your account:</p><p><a href="${verificationLink}">${verificationLink}</a></p>`,
  };
}
