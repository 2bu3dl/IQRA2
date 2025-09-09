# Username-Only Authentication Setup Guide

This guide will help you set up username-only authentication for your IQRA2 app, allowing users to create accounts with just a username and optionally add an email for account recovery.

## 🚀 Quick Setup Steps

### 1. Database Setup
Run the SQL script in your Supabase SQL Editor:

```bash
# Copy and paste the contents of username_auth_setup.sql into Supabase SQL Editor
# This will create all necessary tables, functions, and triggers
```

### 2. Supabase Configuration
In your Supabase dashboard:

1. **Authentication → Settings**:
   - ✅ Enable email sign-ups
   - ✅ Disable email confirmation (since we're using username-only)
   - ✅ Set redirect URLs to include `iqra2://auth/callback`

2. **Authentication → Providers**:
   - ✅ Enable Email provider
   - ✅ Configure any other providers you want to support

### 3. Test the Setup

1. **Build and run your app**:
   ```bash
   cd /Users/nadoom/Desktop/IQRA2
   npm run ios  # or npm run android
   ```

2. **Test username registration**:
   - Open the app
   - Go to Auth screen
   - Switch to "Username" mode
   - Create a new account with just a username
   - Optionally add an email for recovery

3. **Test username login**:
   - Log out
   - Log back in using your username
   - Verify it works correctly

## 🔧 How It Works

### Registration Flow
1. User enters username and password
2. App checks username availability
3. Creates account with temporary email (`username@iqra2.local`)
4. Database trigger creates user profile with actual username
5. Optional email is stored for recovery

### Login Flow
1. User enters username and password
2. App looks up username in `user_profiles` table
3. Gets associated email from profile
4. Uses Supabase auth with the email
5. Updates last login time

### Password Recovery
1. User enters username
2. App checks if email is associated with username
3. If email exists, sends password reset to that email
4. If no email, shows error message

## 📱 User Experience

### Registration Options
- **Email Mode**: Traditional email + password registration
- **Username Mode**: Username + password with optional email for recovery

### Login Options
- Users can login with either:
  - Their email address (if they have one)
  - Their username

### Account Recovery
- Users with email can reset password via email
- Users without email need to contact support

## 🛠️ Customization Options

### Username Requirements
Current rules (in `AuthScreen.js`):
- Minimum 3 characters
- Only letters, numbers, and underscores
- Must be unique

To modify, update the validation in `handleAuth()` function.

### Email Recovery
The `EmailRecoveryManager` component allows users to:
- Add an email to their username-only account
- Change their recovery email
- Remove their recovery email
- Verify email status

## 🔍 Troubleshooting

### Common Issues

1. **"Database error saving new user"**
   - Check if the SQL script was run completely
   - Verify all tables and triggers exist
   - Check Supabase logs for specific errors

2. **"Username not found" during login**
   - Verify the user profile was created
   - Check if the username exists in `user_profiles` table
   - Ensure the email lookup is working

3. **"Username is already taken"**
   - The username uniqueness check is working
   - Try a different username

4. **Password reset not working**
   - Check if user has an email associated with their username
   - Verify email provider is configured in Supabase
   - Check Supabase logs for email sending errors

### Debug Steps

1. **Check database tables**:
   ```sql
   SELECT * FROM user_profiles WHERE username = 'your_username';
   SELECT * FROM user_progress WHERE user_id = 'user_id';
   SELECT * FROM leaderboard_stats WHERE username = 'your_username';
   ```

2. **Check Supabase logs**:
   - Go to Supabase Dashboard → Logs
   - Look for authentication and database errors

3. **Test functions**:
   ```sql
   SELECT generate_unique_username('test');
   SELECT update_username('new_username');
   SELECT reset_password_by_username('username');
   ```

## 🔐 Security Considerations

1. **Username Uniqueness**: Enforced at database level
2. **Password Security**: Uses Supabase's built-in password hashing
3. **Email Verification**: Optional but recommended for recovery
4. **Rate Limiting**: Handled by Supabase
5. **Session Management**: Handled by Supabase

## 📈 Future Enhancements

Consider adding:
- Username change functionality
- Email verification for recovery emails
- Two-factor authentication
- Social login integration
- Account deletion functionality

## 🆘 Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review Supabase logs
3. Test with a fresh database setup
4. Contact support with specific error messages

---

**Note**: This setup maintains backward compatibility with existing email-based accounts while adding username-only functionality.
