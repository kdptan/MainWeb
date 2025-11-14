# Gmail SMTP Setup Guide

## Steps to Configure Gmail for Password Reset Emails

### 1. Enable 2-Step Verification
1. Go to your Google Account: https://myaccount.google.com/
2. Click on **Security** in the left menu
3. Under "How you sign in to Google", click **2-Step Verification**
4. Follow the steps to enable 2-Step Verification

### 2. Generate App Password
1. Go to: https://myaccount.google.com/apppasswords
2. You may need to sign in again
3. In the "Select app" dropdown, choose **Mail**
4. In the "Select device" dropdown, choose **Other (Custom name)**
5. Enter a name like "Django Petstore App"
6. Click **Generate**
7. Google will display a 16-character password (e.g., "abcd efgh ijkl mnop")
8. **Copy this password** - you'll need it for Django settings

### 3. Update Django Settings
Open `backend/chonkyweb_backend/settings.py` and update these lines:

```python
EMAIL_HOST_USER = 'your-email@gmail.com'  # Replace with YOUR Gmail address
EMAIL_HOST_PASSWORD = 'abcdefghijklmnop'  # Replace with the 16-char app password (no spaces)
DEFAULT_FROM_EMAIL = 'Chonky Boi Pet Store <your-email@gmail.com>'  # Replace with YOUR Gmail
```

**Example:**
```python
EMAIL_HOST_USER = 'chonkyboistore@gmail.com'
EMAIL_HOST_PASSWORD = 'xyzw abcd efgh ijkl'  # The app password from step 2
DEFAULT_FROM_EMAIL = 'Chonky Boi Pet Store <chonkyboistore@gmail.com>'
```

### 4. Security Notes
- **NEVER commit your email credentials to Git!** 
- Consider using environment variables for production:
  ```python
  EMAIL_HOST_USER = os.environ.get('EMAIL_HOST_USER', 'your-email@gmail.com')
  EMAIL_HOST_PASSWORD = os.environ.get('EMAIL_HOST_PASSWORD', 'your-app-password')
  ```
- Add `.env` to your `.gitignore` file

### 5. Testing
1. Restart your Django server after updating settings
2. Go to the forgot password page
3. Enter a registered email address
4. Check your Gmail inbox (and spam folder) for the reset email

### 6. Troubleshooting

**Error: "SMTPAuthenticationError"**
- Make sure 2-Step Verification is enabled
- Double-check your app password (no spaces)
- Make sure you're using the app password, NOT your regular Gmail password

**Error: "SMTPServerDisconnected"**
- Check your internet connection
- Make sure EMAIL_PORT is 587
- Make sure EMAIL_USE_TLS is True

**Emails not arriving:**
- Check your spam/junk folder
- Make sure the email address is registered in your system
- Check Django logs for error messages

### 7. For Development/Testing
If you want to test without setting up Gmail, you can switch back to console backend:

```python
EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'
```

This will print emails to the Django terminal instead of sending them.
