/**
 * Simple Email Service Simulation
 * In a real app, replace this with Resend, SendGrid, or Nodemailer.
 */

interface EmailPayload {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: EmailPayload) {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 500));

  console.log("================ EMAIL SENT ================");
  console.log(`TO: ${to}`);
  console.log(`SUBJECT: ${subject}`);
  console.log(`BODY: ${html}`);
  console.log("============================================");

  return { success: true };
}

export async function sendNominationStatusEmail(
  to: string,
  nomineeName: string,
  status: "APPROVED" | "REJECTED",
  eventTitle: string,
  reason?: string
) {
  const subject = `Update on your nomination for ${eventTitle}`;

  let body = "";
  if (status === "APPROVED") {
    body = `
      <h1>Congratulations, ${nomineeName}! 🎉</h1>
      <p>We are pleased to inform you that your nomination for <strong>${eventTitle}</strong> has been <strong>APPROVED</strong>.</p>
      <p>You are now an official candidate. Get ready to campaign!</p>
    `;
  } else {
    body = `
      <h1>Nomination Update</h1>
      <p>Dear ${nomineeName},</p>
      <p>Thank you for your interest in <strong>${eventTitle}</strong>.</p>
      <p>After careful review, we regret to inform you that your nomination was not successful at this time.</p>
      ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ""}
    `;
  }

  return sendEmail({ to, subject, html: body });
}
