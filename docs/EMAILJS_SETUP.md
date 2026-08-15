# EmailJS Setup Guide

EmailJS sends transactional emails (password resets, onboarding alerts, maintenance reminders) directly from your Apps Script backend — no server required.

---

## Step 1 — Create an EmailJS Account

1. Go to [emailjs.com](https://emailjs.com) and sign up for a free account.
2. The free tier allows 200 emails/month — plenty for your team.

---

## Step 2 — Add an Email Service

1. In the EmailJS dashboard, click **Email Services → Add New Service**
2. Choose your email provider (Gmail is easiest):
   - Click **Gmail**
   - Click **Connect Account** and authorise your Google account
   - Name the service: `CBC Worship`
3. Click **Create Service**
4. Note your **Service ID** (looks like `service_abc123`)

---

## Step 3 — Create Email Templates

Create one template for each of the 6 email types below. For each:
1. Click **Email Templates → Create New Template**
2. Set the Subject and Body using the variables shown
3. Click **Save**

---

### Template 1 — New Announcement
**Template ID name**: `cbc_announcement`

**Subject**: 📢 {{team_name}} — New Notice: {{title}}

**Body**:
```
Hi {{to_name}},

A new announcement has been posted for {{team_name}}:

{{title}}
{{body}}

Log in to the portal to read the full notice.

God bless,
{{team_name}}
```

---

### Template 2 — Password Reset
**Template ID name**: `cbc_password_reset`

**Subject**: Reset your CBC Worship Portal password

**Body**:
```
Hi {{name}},

You requested a password reset for your CBC Thane Worship Portal account.

Your reset token is: {{token}}

If you did not request this, please ignore this email.

God bless,
CBC Worship Team
```

---

### Template 3 — Maintenance Overdue
**Template ID name**: `cbc_maintenance`

**Subject**: ⚠️ Maintenance Overdue — {{asset_name}}

**Body**:
```
Hi {{name}},

This is a reminder that maintenance is overdue for a worship team asset:

Asset: {{asset_name}}
Due Date: {{due_date}}
Type: {{maintenance_type}}

Please log in to the portal to update the maintenance log.

God bless,
CBC Worship Portal
```

---

### Template 4 — Onboarding Complete
**Template ID name**: `cbc_onboarding`

**Subject**: ✅ {{member_name}} has completed onboarding

**Body**:
```
Hi {{name}},

Great news! {{memberName}} has completed their onboarding for the CBC Thane Worship Team.

They have:
✓ Read the Vision & Mission
✓ Passed the quiz with 100%
✓ Confirmed their commitment
✓ Completed the checklist

Log in to the portal to view their profile.

God bless,
CBC Worship Portal
```

---

### Template 5 — Monthly V&M Reminder
**Template ID name**: `cbc_vm_reminder`

**Subject**: 📖 Monthly Vision & Mission Review — {{month}}

**Body**:
```
Hi {{name}},

This is your monthly reminder to complete your Vision & Mission review for {{team_name}}.

Log in to the portal and tap "Review V&M" on your dashboard.

It only takes a few minutes and keeps us all aligned in purpose.

God bless,
{{team_name}}
```

---

### Template 6 — Audition Suggestion
**Template ID name**: `cbc_audition`

**Subject**: 🎵 New Talent Suggestion — {{suggestedName}}

**Body**:
```
Hi {{name}},

A team member has suggested a new talent for the worship team:

Name: {{suggestedName}}
Skill: {{skill}}
Ministry: {{ministry}}

Log in to the portal to review this suggestion and update its status.

God bless,
CBC Worship Portal
```

---

## Step 4 — Get Your Keys

In the EmailJS dashboard:
1. Click **Account → API Keys**
2. Copy your **Public Key**

For each template:
1. Go to **Email Templates** and open the template
2. Copy the **Template ID**

---

## Step 5 — Paste into the App

1. Log in as Super Admin
2. Go to **Settings → Integrations → EmailJS**
3. Fill in:
   - **Service ID**: `service_abc123` (from Step 2)
   - **Public Key**: (from Step 4)
   - **Template IDs**: paste each template ID into the matching field
4. Click **Save EmailJS Config**

---

## Testing

To test email delivery:
- In EmailJS dashboard, open any template and click **Test It**
- Enter your own email as `to_email` and fill in sample values
- Click **Send Test Email**
