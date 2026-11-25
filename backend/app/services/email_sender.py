import smtplib
import os
import requests
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.base import MIMEBase
from email import encoders
import base64
from app.config import settings

def send_via_brevo_api(
    to_email: str,
    subject: str,
    body: str,
    attachment_path: str = None,
    api_key: str = None,
    from_email: str = None,
    from_name: str = None
) -> dict:
    """
    Sends email via Brevo (formerly Sendinblue) REST API v3 (/v3/smtp/email).
    """
    key = api_key or getattr(settings, "BREVO_API_KEY", "") or os.getenv("BREVO_API_KEY", "")
    sender_email = from_email or settings.SMTP_FROM_EMAIL or "noreply@jobfinder.ai"
    sender_name = from_name or settings.SMTP_FROM_NAME or "Job Applicant"

    if not key or not key.strip():
        return {
            "success": False,
            "error": "Brevo API Key is missing. Please provide a valid Brevo API key (starts with xkeysib-)."
        }

    url = "https://api.brevo.com/v3/smtp/email"
    headers = {
        "accept": "application/json",
        "api-key": key.strip(),
        "content-type": "application/json"
    }

    payload = {
        "sender": {
            "name": sender_name,
            "email": sender_email
        },
        "to": [
            {
                "email": to_email,
                "name": to_email.split("@")[0]
            }
        ],
        "subject": subject,
        "textContent": body
    }

    # Attach file if present
    if attachment_path and os.path.exists(attachment_path):
        filename = os.path.basename(attachment_path)
        with open(attachment_path, "rb") as f:
            content_base64 = base64.b64encode(f.read()).decode("utf-8")
        payload["attachment"] = [
            {
                "content": content_base64,
                "name": filename
            }
        ]

    try:
        response = requests.post(url, json=payload, headers=headers, timeout=15)
        if response.status_code in [200, 201, 202]:
            resp_data = response.json()
            message_id = resp_data.get("messageId", "")
            return {
                "success": True,
                "demo_mode": False,
                "provider": "Brevo API",
                "message": f"Email successfully dispatched to {to_email} via Brevo API (Message ID: {message_id})"
            }
        else:
            return {
                "success": False,
                "demo_mode": False,
                "provider": "Brevo API",
                "error": f"Brevo API error ({response.status_code}): {response.text}"
            }
    except Exception as e:
        return {
            "success": False,
            "demo_mode": False,
            "provider": "Brevo API",
            "error": f"Failed to send email via Brevo API: {str(e)}"
        }

def send_application_email(
    to_email: str,
    subject: str,
    body: str,
    attachment_path: str = None,
    smtp_override: dict = None,
    brevo_key_override: str = None
) -> dict:
    """
    Sends application email via Brevo API or fallback SMTP with attachment.
    """
    brevo_key = brevo_key_override or getattr(settings, "BREVO_API_KEY", "") or os.getenv("BREVO_API_KEY", "")
    
    # 1. If Brevo API key is available, use Brevo
    if brevo_key and brevo_key.strip():
        sender_email = (smtp_override and smtp_override.get("from_email")) or settings.SMTP_FROM_EMAIL
        sender_name = settings.SMTP_FROM_NAME
        return send_via_brevo_api(
            to_email=to_email,
            subject=subject,
            body=body,
            attachment_path=attachment_path,
            api_key=brevo_key,
            from_email=sender_email,
            from_name=sender_name
        )

    # 2. Standard SMTP Dispatch
    host = (smtp_override and smtp_override.get("host")) or settings.SMTP_HOST
    port = int((smtp_override and smtp_override.get("port")) or settings.SMTP_PORT)
    user = (smtp_override and smtp_override.get("user")) or settings.SMTP_USER
    password = (smtp_override and smtp_override.get("password")) or settings.SMTP_PASSWORD
    from_email = (smtp_override and smtp_override.get("from_email")) or settings.SMTP_FROM_EMAIL or user
    from_name = settings.SMTP_FROM_NAME

    if not user or not password:
        return {
            "success": True,
            "demo_mode": True,
            "message": f"[DRY-RUN / SIMULATED SEND] Email successfully validated and queued to {to_email}. To send live emails, configure Brevo API Key or SMTP credentials."
        }

    try:
        msg = MIMEMultipart()
        msg["From"] = f"{from_name} <{from_email}>"
        msg["To"] = to_email
        msg["Subject"] = subject

        msg.attach(MIMEText(body, "plain"))

        if attachment_path and os.path.exists(attachment_path):
            filename = os.path.basename(attachment_path)
            with open(attachment_path, "rb") as f:
                part = MIMEBase("application", "octet-stream")
                part.set_payload(f.read())
            encoders.encode_base64(part)
            part.add_header("Content-Disposition", f"attachment; filename= {filename}")
            msg.attach(part)

        if port == 465:
            server = smtplib.SMTP_SSL(host, port, timeout=15)
        else:
            server = smtplib.SMTP(host, port, timeout=15)
            server.ehlo()
            server.starttls()
            server.ehlo()

        server.login(user, password)
        server.sendmail(from_email, [to_email], msg.as_string())
        server.quit()

        return {
            "success": True,
            "demo_mode": False,
            "message": f"Email successfully sent to {to_email} via SMTP ({host}:{port})"
        }
    except Exception as e:
        return {
            "success": False,
            "demo_mode": False,
            "error": str(e)
        }
