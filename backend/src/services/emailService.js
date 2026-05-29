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

