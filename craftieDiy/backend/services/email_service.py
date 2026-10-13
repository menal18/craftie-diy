import html
import smtplib
import socket
from email.message import EmailMessage
from email.utils import formataddr, parseaddr

from flask import current_app


def _mail_configuration():
    config = current_app.config
    server = config.get("MAIL_SERVER")
    sender = config.get("MAIL_DEFAULT_SENDER")
    port = config.get("MAIL_PORT")
    timeout = config.get("MAIL_TIMEOUT", 20)

    if not server or not sender or not port:
        return None, "Email is not configured: MAIL_SERVER, MAIL_PORT, and MAIL_DEFAULT_SENDER are required"

    sender_name, sender_address = parseaddr(sender)
    if not sender_address or "@" not in sender_address:
        return None, "Email is not configured: MAIL_DEFAULT_SENDER must be a valid email address"
    if not 1 <= int(port) <= 65535 or int(timeout) <= 0:
        return None, "Email is not configured: MAIL_PORT and MAIL_TIMEOUT are invalid"

    username = config.get("MAIL_USERNAME")
    password = config.get("MAIL_PASSWORD")
    if bool(username) != bool(password):
        return None, "Email is not configured: MAIL_USERNAME and MAIL_PASSWORD must both be set or both be empty"

    use_tls = bool(config.get("MAIL_USE_TLS", True))
    if username and not use_tls:
        return None, "Email is not configured: authenticated SMTP requires MAIL_USE_TLS=true"

    return {
        "server": server,
        "port": port,
        "sender_name": sender_name or "CraftieDIY",
        "sender_address": sender_address,
        "username": username,
        "password": password,
        "use_tls": use_tls,
        "timeout": timeout,
    }, None


def send_notification_email(recipient, title, message, notification_id):
    mail, config_error = _mail_configuration()
    if config_error:
        return False, config_error

    if "\r" in title or "\n" in title:
        return False, "Email subject cannot contain line breaks"

    recipient = recipient.strip() if recipient else ""
    if not recipient or "@" not in recipient:
        return False, "Recipient has no valid registered email address"

    safe_title = html.escape(title)
    safe_message = html.escape(message).replace("\n", "<br>")

    email = EmailMessage()
    email["Subject"] = title
    email["From"] = formataddr((mail["sender_name"], mail["sender_address"]))
    email["To"] = recipient
    email["Message-ID"] = f"<craftiediy-notification-{notification_id}@{mail['sender_address'].split('@')[-1]}>"
    email.set_content(f"{title}\n\n{message}\n\nCraftieDIY")
    email.add_alternative(
        f"""<!doctype html>
<html lang="en">
  <body style="margin:0;background:#f7f3ed;font-family:Arial,sans-serif;color:#30272a">
    <div style="max-width:600px;margin:32px auto;background:#fff;border:1px solid #eadfe0;border-radius:10px;overflow:hidden">
      <div style="background:#5a0b18;padding:22px 28px;color:#fff">
        <div style="font-size:12px;letter-spacing:2px;font-weight:bold">CRAFTIEDIY</div>
        <div style="font-size:14px;margin-top:5px;color:#f1e6e2">Thoughtful handmade finds</div>
      </div>
      <div style="padding:30px 28px">
        <h1 style="margin:0 0 18px;color:#5a0b18;font-size:22px">{safe_title}</h1>
        <p style="margin:0;line-height:1.7">{safe_message}</p>
      </div>
      <div style="padding:16px 28px;border-top:1px solid #eee7e5;color:#756a6b;font-size:12px">
        This is an update from CraftieDIY. Please do not reply to this automated message.
      </div>
    </div>
  </body>
</html>""",
        subtype="html"
    )

    try:
        with smtplib.SMTP(
            mail["server"], mail["port"], timeout=mail["timeout"]
        ) as smtp:
            smtp.ehlo()
            if mail["use_tls"]:
                smtp.starttls()
                smtp.ehlo()
            if mail["username"]:
                smtp.login(mail["username"], mail["password"])
            refused = smtp.send_message(email)
            if refused:
                return False, "SMTP provider refused delivery to the recipient"
    except (smtplib.SMTPException, OSError, socket.timeout) as error:
        current_app.logger.warning(
            "Notification email delivery failed for notification %s: %s",
            notification_id,
            error
        )
        return False, "SMTP delivery failed"

    return True, None
