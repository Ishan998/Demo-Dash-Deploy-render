# # users/utils/captcha.py
# import requests
# from django.conf import settings

# def validate_captcha(token, remoteip=None):
#     url = "https://www.google.com/recaptcha/api/siteverify"
#     data = {"secret": settings.RECAPTCHA_SECRET_KEY, "response": token}
#     if remoteip:
#         data["remoteip"] = remoteip
#     resp = requests.post(url, data=data, timeout=5)
#     result = resp.json()
#     return result.get("success", False)
# users/utils/captcha.py
import requests
from django.conf import settings

def validate_captcha(token: str, ip: str = None) -> bool:
    secret = getattr(settings, "RECAPTCHA_SECRET_KEY", None)
    if not secret:
        print("Captcha secret key not configured; rejecting captcha validation.")
        return False
    payload = {"secret": secret, "response": token}
    if ip:
        payload["remoteip"] = ip
    try:
        r = requests.post(
            "https://www.google.com/recaptcha/api/siteverify",
            data=payload,
            timeout=5,
        )
        result = r.json()
        if getattr(settings, "CAPTCHA_DEBUG", False):
            # Only log safe fields; never log token or secret
            to_log = {
                key: result.get(key)
                for key in ("success", "challenge_ts", "hostname", "error-codes")
                if key in result
            }
            print("[CAPTCHA-DEBUG] siteverify result:", to_log)
        return result.get("success", False)
    except Exception as e:
        print("Captcha validation error:", e)
        return False
