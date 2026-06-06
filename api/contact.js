const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function clean(value, maxLength) {
  return String(value || "").trim().slice(0, maxLength);
}

module.exports = async function contactHandler(request, response) {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    return response.status(405).json({ error: "Method not allowed." });
  }

  const body = request.body || {};
  const name = clean(body.name, 80);
  const email = clean(body.email, 160);
  const subject = clean(body.subject, 120);
  const message = clean(body.message, 4000);
  const honeypot = clean(body.website, 200);
  const elapsed = Number(body.elapsed);

  if (honeypot) {
    return response.status(200).json({ sent: true });
  }

  if (!name || !EMAIL_PATTERN.test(email) || !subject || !message) {
    return response.status(400).json({ error: "Please complete every field with a valid email address." });
  }

  if (Number.isFinite(elapsed) && elapsed < 1200) {
    return response.status(429).json({ error: "Please wait a moment and try again." });
  }

  try {
    const formSubmitResponse = await fetch(
      "https://formsubmit.co/ajax/aaron.matthewyuson@gmail.com",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          subject,
          message,
          _subject: `[Portfolio] ${subject}`,
          _replyto: email,
          _template: "table",
          _captcha: "false",
        }),
      }
    );

    const result = await formSubmitResponse.json().catch(() => ({}));
    if (!formSubmitResponse.ok || result.success === "false") {
      console.error("FormSubmit error", result);
      return response.status(502).json({ error: "Email delivery failed. Please try again shortly." });
    }

    return response.status(200).json({ sent: true });
  } catch (error) {
    console.error("Contact form error", error);
    return response.status(500).json({ error: "Email delivery failed. Please try again shortly." });
  }
};
