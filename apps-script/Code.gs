// =============================================================
// CBC Thane Worship Portal — Google Apps Script Backend
// Deploy as Web App: Execute as Me, Anyone (even anonymous)
// =============================================================

var SHEET_ID = SpreadsheetApp.getActiveSpreadsheet().getId();
var SS = SpreadsheetApp.getActiveSpreadsheet();

function getNowIST() {
  var now = new Date();
  var ist = new Date(now.getTime() + (5.5 * 60 * 60 * 1000));
  var yyyy = ist.getUTCFullYear();
  var mm = ('0' + (ist.getUTCMonth() + 1)).slice(-2);
  var dd = ('0' + ist.getUTCDate()).slice(-2);
  var hh = ('0' + ist.getUTCHours()).slice(-2);
  var min = ('0' + ist.getUTCMinutes()).slice(-2);
  return yyyy + '-' + mm + '-' + dd + ' ' + hh + ':' + min + ' IST';
}

// ---------- CORS & Response Helpers ----------
function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };
}

function ok(data) {
  return ContentService.createTextOutput(JSON.stringify({ success: true, data: data }))
    .setMimeType(ContentService.MimeType.JSON);
}

function err(msg) {
  return ContentService.createTextOutput(JSON.stringify({ success: false, error: msg || 'Something went wrong. Please try again.' }))
    .setMimeType(ContentService.MimeType.JSON);
}

// ---------- Router ----------
function doGet(e) {
  try {
    var action = e.parameter.action;
    return route(action, e.parameter);
  } catch(ex) {
    return err(ex.message);
  }
}

function doPost(e) {
  try {
    var params = e.parameter;
    if (e.postData && e.postData.contents) {
      try { params = JSON.parse(e.postData.contents); } catch(ex) {}
    }
    var action = params.action;
    return route(action, params);
  } catch(ex) {
    return err(ex.message);
  }
}

function route(action, p) {
  switch(action) {
    // Auth
    case 'ping':               return ok('pong');
    case 'authenticateUser':   return authenticateUser(p);
    case 'validateSession':    return validateSession(p);
    case 'changePassword':     return changePassword(p);
    case 'requestPasswordReset': return requestPasswordReset(p);
    case 'confirmPasswordReset': return confirmPasswordReset(p);
    case 'initialSetup':       return initialSetup(p);

    // Members
    case 'getMembers':         return getMembers(p);
    case 'getMember':          return getMember(p);
    case 'createMember':       return createMember(p);
    case 'updateMember':       return updateMember(p);
    case 'deleteMember':       return deleteMember(p);

    // Assets
    case 'getAssets':          return getAssets(p);
    case 'getAsset':           return getAsset(p);
    case 'createAsset':        return createAsset(p);
    case 'updateAsset':        return updateAsset(p);
    case 'deleteAsset':        return deleteAsset(p);
    case 'checkoutAsset':      return checkoutAsset(p);
    case 'checkinAsset':       return checkinAsset(p);

    // Maintenance
    case 'getMaintenanceLogs': return getMaintenanceLogs(p);
    case 'addMaintenanceLog':  return addMaintenanceLog(p);
    case 'updateMaintenanceLog': return updateMaintenanceLog(p);
    case 'deleteMaintenanceLog': return deleteMaintenanceLog(p);

    // Announcements
    case 'getAnnouncements':   return getAnnouncements(p);
    case 'createAnnouncement': return createAnnouncement(p);
    case 'updateAnnouncement': return updateAnnouncement(p);
    case 'deleteAnnouncement': return deleteAnnouncement(p);
    case 'markAnnouncementsRead':    return markAnnouncementsRead(p);
    case 'acknowledgeAnnouncement':  return acknowledgeAnnouncement(p);
    case 'rsvpAnnouncement':         return rsvpAnnouncement(p);

    // Prayer
    case 'getPrayerRequests':  return getPrayerRequests(p);
    case 'createPrayerRequest':return createPrayerRequest(p);
    case 'updatePrayerRequest':return updatePrayerRequest(p);
    case 'markAnswered':       return markAnswered(p);
    case 'deletePrayerRequest':return deletePrayerRequest(p);
    case 'prayForRequest':     return prayForRequest(p);
    case 'getAnsweredPrayers': return getAnsweredPrayers(p);
    case 'getYearEndSummary':  return getYearEndSummary(p);

    // Birthday Wall
    case 'getBirthdayWalls':   return getBirthdayWalls(p);
    case 'getBirthdayWishes':  return getBirthdayWishes(p);
    case 'postBirthdayWish':   return postBirthdayWish(p);
    case 'sendBirthdayPDFs':   return sendBirthdayPDFs(p);

    // Attendance & Events
    case 'getEvents':             return getEvents(p);
    case 'createEvent':           return createEvent(p);
    case 'getAttendance':         return getAttendance(p);
    case 'markAttendance':        return markAttendance(p);
    case 'markAttendanceBulk':    return markAttendanceBulk(p);
    case 'getMemberAttendance':   return getMemberAttendance(p);
    case 'exportAttendanceCSV':   return exportAttendanceCSV(p);

    // Prayer Partners
    case 'getPrayerPartners':  return getPrayerPartners(p);
    case 'setPrayerPartners':  return setPrayerPartners(p);
    case 'autoPairMembers':    return autoPairMembers(p);

    // Facilitator Roster
    case 'getFacilitatorRoster':    return getFacilitatorRoster(p);
    case 'updateRosterSlot':        return updateRosterSlot(p);

    // Audition Suggestions
    case 'getAuditionSuggestions':  return getAuditionSuggestions(p);
    case 'createSuggestion':        return createSuggestion(p);
    case 'updateSuggestionStatus':  return updateSuggestionStatus(p);

    // Notifications
    case 'getNotifications':        return getNotifications(p);
    case 'markNotificationsRead':   return markNotificationsRead(p);

    // Badges
    case 'getBadges':               return getBadges(p);
    case 'awardBadge':              return awardBadge(p);

    // V&M & Quiz
    case 'getVMContent':            return getVMContent(p);
    case 'updateVMContent':         return updateVMContent(p);
    case 'getQuizQuestions':        return getQuizQuestions(p);
    case 'addQuizQuestion':         return addQuizQuestion(p);
    case 'updateQuizQuestion':      return updateQuizQuestion(p);
    case 'saveAllQuizQuestions':    return saveAllQuizQuestions(p);
    case 'deleteQuizQuestion':      return deleteQuizQuestion(p);
    case 'recordVMReview':          return recordVMReview(p);
    case 'getVMReviewStatus':       return getVMReviewStatus(p);

    // Onboarding
    case 'getOnboardingProgress':   return getOnboardingProgress(p);
    case 'updateOnboardingProgress':return updateOnboardingProgress(p);
    case 'getOnboardingChecklist':  return getOnboardingChecklist(p);
    case 'addOnboardingItem':       return addOnboardingItem(p);
    case 'updateOnboardingItem':    return updateOnboardingItem(p);
    case 'deleteOnboardingItem':    return deleteOnboardingItem(p);
    case 'reorderOnboardingItems':  return reorderOnboardingItems(p);
    case 'completeOnboarding':      return completeOnboarding(p);

    // Settings
    case 'getSettings':             return getSettings(p);
    case 'getAllSettings':          return getAllSettings(p);
    case 'updateSettings':          return updateSettings(p);

    // Dashboard
    case 'getDashboard':            return getDashboard(p);

    // Data management
    case 'exportData':              return exportData(p);
    case 'importData':              return importData(p);
    case 'clearAllData':            return clearAllData(p);

    default: return err('Unknown action: ' + action);
  }
}

// ================================================================
// AUTH HELPER
// ================================================================
function requireAuth(p, requiredRole) {
  var token = p.sessionToken;
  if (!token) return { error: 'No session token' };

  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Members');
  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  var tokenCol  = headers.indexOf('sessionToken');
  var expiryCol = headers.indexOf('sessionExpiry');
  var roleCol   = headers.indexOf('role');
  var activeCol = headers.indexOf('isActive');

  for (var i = 1; i < data.length; i++) {
    if (data[i][tokenCol] === token) {
      if (data[i][activeCol] === false || data[i][activeCol] === 'FALSE' ||
          data[i][activeCol] === 'false') {
        return { error: 'Account inactive' };
      }
      var expiry = new Date(data[i][expiryCol]);
      if (expiry < new Date()) return { error: 'Session expired' };
      var memberRole = data[i][roleCol];
      if (requiredRole) {
        var allowed = {
          'SUPER_ADMIN': ['MEMBER', 'ADMIN', 'SUPER_ADMIN'],
          'ADMIN':       ['MEMBER', 'ADMIN'],
          'MEMBER':      ['MEMBER']
        };
        if (!allowed[memberRole] || allowed[memberRole].indexOf(requiredRole) === -1) {
          return { error: 'Insufficient role' };
        }
      }
      return { ok: true, role: memberRole };
    }
  }
  return { error: 'Invalid session' };
}

function touchCache(sheetName) {
  var sheet = getSheet('Settings');
  var key = 'cacheTs_' + sheetName;
  var ts = new Date().toISOString();
  var rows = sheet.getDataRange().getValues();
  for (var i = 1; i < rows.length; i++) {
    if (rows[i][0] === key) {
      sheet.getRange(i + 1, 2).setValue(ts);
      return;
    }
  }
  sheet.appendRow([key, ts]);
}

// ================================================================
// SHEET HELPERS
// ================================================================
function getSheet(name) {
  var sheet = SS.getSheetByName(name);
  if (!sheet) throw new Error('Sheet not found: ' + name);
  return sheet;
}

function sheetToObjects(sheet) {
  var data = sheet.getDataRange().getValues();
  if (data.length < 2) return [];
  var headers = data[0];
  return data.slice(1).map(function(row) {
    var obj = {};
    headers.forEach(function(h, i) { obj[h] = row[i] === '' ? null : row[i]; });
    return obj;
  });
}

function genId() {
  return Utilities.getUuid();
}

function findRowById(sheet, id) {
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(id)) return i + 1;
  }
  return -1;
}

function getHeaders(sheet) {
  return sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
}

function appendRow(sheet, obj) {
  var headers = getHeaders(sheet);
  var row = headers.map(function(h) { return obj[h] !== undefined ? obj[h] : ''; });
  sheet.appendRow(row);
}

function updateRow(sheet, rowNum, obj) {
  var headers = getHeaders(sheet);
  var existing = sheet.getRange(rowNum, 1, 1, headers.length).getValues()[0];
  var updated = headers.map(function(h, i) {
    return obj[h] !== undefined ? obj[h] : existing[i];
  });
  sheet.getRange(rowNum, 1, 1, headers.length).setValues([updated]);
}

function deleteRow(sheet, rowNum) {
  sheet.deleteRow(rowNum);
}

// `department`, when given, narrows the result to admins assigned to that
// department (e.g. 'ASSETS'). If nobody is assigned to it yet, falls back to
// the full admin list so notifications never silently go to nobody during
// the transition period before departments are actually assigned.
function getAdminMembers(department) {
  var all = sheetToObjects(getSheet('Members')).filter(function(m) {
    return (m.role === 'ADMIN' || m.role === 'SUPER_ADMIN') && String(m.isActive).toLowerCase() !== 'false';
  });
  if (!department) return all;
  var scoped = all.filter(function(m) {
    return (m.adminDepartments || '').split(',').filter(Boolean).indexOf(department) !== -1;
  });
  return scoped.length > 0 ? scoped : all;
}

// ================================================================
// INITIAL SETUP
// ================================================================
function initialSetup(p) {
  ensureSheets();
  var settings = getSheet('Settings');
  var existing = sheetToObjects(settings).find(function(s) { return s.key === 'setupComplete'; });
  if (existing && existing.value === 'true') return err('Setup already completed');

  var adminId = genId();
  var now = new Date().toISOString();

  // Super Admin
  appendRow(getSheet('Members'), {
    id: adminId, name: p.adminName, email: p.adminEmail,
    passwordHash: p.passwordHash, phone: '', gender: 'Male',
    instrument: 'Vocals', birthday: '', bio: 'Team Administrator',
    photoBase64: '', role: 'SUPER_ADMIN', joinDate: now,
    isOnboarded: true, onboardingStep: 4, fcmToken: '',
    lastVMReview: '', vmReviewStreak: 0, sessionToken: '', sessionExpiry: '', isActive: true
  });

  // Sample members
  var sampleMembers = [
    { id: genId(), name: 'Sarah Thomas', email: 'sarah@worship.com', passwordHash: p.passwordHash, phone: '+91 98765 43210', gender: 'Female', instrument: 'Vocals', birthday: '15/06', bio: 'Worship vocalist', photoBase64: '', role: 'ADMIN', joinDate: now, isOnboarded: true, onboardingStep: 4, fcmToken: '', lastVMReview: '', vmReviewStreak: 0, sessionToken: '', sessionExpiry: '', isActive: true },
    { id: genId(), name: 'James Mathew', email: 'james@worship.com', passwordHash: p.passwordHash, phone: '+91 98765 12345', gender: 'Male', instrument: 'Guitar', birthday: '22/03', bio: 'Lead guitarist', photoBase64: '', role: 'MEMBER', joinDate: now, isOnboarded: false, onboardingStep: 0, fcmToken: '', lastVMReview: '', vmReviewStreak: 0, sessionToken: '', sessionExpiry: '', isActive: true },
    { id: genId(), name: 'Priya Daniel', email: 'priya@worship.com', passwordHash: p.passwordHash, phone: '+91 99887 65432', gender: 'Female', instrument: 'Keyboard', birthday: new Date().getDate() + '/' + (new Date().getMonth() + 1), bio: 'Keyboard player', photoBase64: '', role: 'MEMBER', joinDate: now, isOnboarded: false, onboardingStep: 0, fcmToken: '', lastVMReview: '', vmReviewStreak: 0, sessionToken: '', sessionExpiry: '', isActive: true },
  ];
  sampleMembers.forEach(function(m) { appendRow(getSheet('Members'), m); });

  // Settings
  var settingsRows = [
    ['setupComplete', 'true'],
    ['teamName', p.teamName],
    ['confirmKeyPhrase', 'I commit to serve with excellence'],
    ['vmReminderDay', '1'],
    ['prayerPartnerDay', 'Sunday'],
    ['rosterReminderDays', '3'],
    ['birthdayTime', '08:00'],
    ['whatsappLink', ''],
    ['lastBackupDate', now],
    ['driveFolderProfilePhotos', ''],
    ['driveFolderAssetPhotos', ''],
    ['driveFolderMaintenancePhotos', ''],
  ];
  settingsRows.forEach(function(r) { appendRow(settings, { key: r[0], value: r[1] }); });

  // V&M Content
  appendRow(settings, { key: 'vmVision', value: 'To be a worship team that ushers the presence of God into every gathering — creating an atmosphere where hearts are transformed, burdens are lifted, and lives are changed through authentic, Spirit-led worship.\n\nWe believe worship is not merely a performance, but an act of surrender — an offering of our whole selves before a holy God.' });
  appendRow(settings, { key: 'vmMission', value: 'To serve our church family through consistent, prepared, and passionate worship leadership — equipping every person in the congregation to encounter God personally.\n\nWe serve with humility, grow in skill, and pursue the presence of God together as a team.' });
  appendRow(settings, { key: 'vmValues', value: 'Character over competence — who you are matters more than what you can do.\n\nCommunity over individuality — we grow together, pray together, and serve together.\n\nExcellence in preparation — we honour God by being prepared and practised.\n\nAuthenticity in worship — we do not perform; we encounter.\n\nAccountability to one another — iron sharpens iron.' });

  // Sample assets
  var assets = [
    { id: genId(), name: 'Yamaha Acoustic Guitar', category: 'Guitars', subcategory: 'Acoustic', description: 'Primary acoustic guitar for worship', serialNumber: 'YAM-001', condition: 'Good', assignedTo: '', purchaseDate: '2023-01-15', estimatedValue: 15000, status: 'Active', photoBase64: '', notes: 'Keep in humidity-controlled area', checkedOutBy: '', checkedOutAt: '', checkedOutPurpose: '' },
    { id: genId(), name: 'Shure SM58 Wireless Microphone', category: 'Microphones', subcategory: 'Wireless', description: 'Lead vocal microphone', serialNumber: 'SHU-WL-001', condition: 'Excellent', assignedTo: '', purchaseDate: '2023-03-10', estimatedValue: 8000, status: 'Active', photoBase64: '', notes: 'Batteries checked weekly', checkedOutBy: '', checkedOutAt: '', checkedOutPurpose: '' },
    { id: genId(), name: 'Roland Keyboard Stand', category: 'Stands & Mounts', subcategory: '', description: 'X-frame stand for keyboard', serialNumber: 'ROL-STD-001', condition: 'Fair', assignedTo: '', purchaseDate: '2022-06-01', estimatedValue: 2000, status: 'Active', photoBase64: '', notes: 'Needs tightening on left joint', checkedOutBy: '', checkedOutAt: '', checkedOutPurpose: '' },
  ];
  assets.forEach(function(a) { appendRow(getSheet('Assets'), a); });

  // Sample announcement
  appendRow(getSheet('Announcements'), {
    id: genId(), title: 'Welcome to the Worship Portal!',
    body: 'This is your new team portal. Explore features like asset management, prayer board, attendance tracking, and more. Admins — please set up your Vision & Mission content in Settings.',
    urgency: 'Info', createdBy: adminId, createdAt: now, readBy: ''
  });

  // Sample prayer requests
  appendRow(getSheet('PrayerRequests'), {
    id: genId(), title: 'Breakthrough in worship this Sunday',
    detail: 'Praying for God\'s tangible presence to fall as we lead worship this Sunday morning.',
    isAnonymous: false, postedBy: adminId, postedAt: now, status: 'Believing', prayingMembers: '', testimony: '', answeredAt: ''
  });
  appendRow(getSheet('PrayerRequests'), {
    id: genId(), title: 'Healing for team member',
    detail: 'Please pray for full healing and recovery.',
    isAnonymous: true, postedBy: adminId, postedAt: now, status: 'Answered', prayingMembers: adminId, testimony: 'God healed completely — the doctor confirmed it! Praise Him!', answeredAt: now
  });

  return ok({ message: 'Setup complete', adminId: adminId });
}

function ensureSheets() {
  var required = ['Members','Assets','MaintenanceLog','Announcements','PrayerRequests','AnsweredPrayers','Attendance','Events','PrayerPartners','FacilitatorRoster','AuditionSuggestions','Notifications','Badges','OnboardingProgress','VMReviews','Settings','BirthdayWishes'];
  var headers = {
    Members: ['id','name','email','passwordHash','phone','gender','instrument','birthday','bio','photoBase64','photoUrl','role','joinDate','isOnboarded','onboardingStep','fcmToken','lastVMReview','vmReviewStreak','sessionToken','sessionExpiry','isActive'],
    Assets: ['id','assetId','name','category','subcategory','description','serialNumber','condition','assignedTo','purchaseDate','estimatedValue','status','photoBase64','photoUrl','notes','checkedOutBy','checkedOutAt','checkedOutPurpose','nextDueDate','lastMaintDate','updatedBy'],
    MaintenanceLog: ['id','assetId','serialNumber','date','maintenanceType','description','doneBy','cost','nextDueDate','isCompleted','completedAt','raisedAt','completedBy','submittedBy','photoBase64','photoUrl'],
    Announcements: ['id','title','body','urgency','createdBy','createdAt','readBy','acknowledged','rsvpYes','rsvpNo'],
    PrayerRequests: ['id','title','detail','isAnonymous','postedBy','postedAt','status','prayingMembers','testimony','answeredAt'],
    AnsweredPrayers: ['id','originalRequestId','title','detail','postedBy','answeredAt','testimony'],
    Attendance: ['id','eventId','memberId','isPresent','status','markedAt'],
    Events: ['id','type','date','notes','createdBy'],
    PrayerPartners: ['id','member1Id','member2Id','season','pairedAt','isActive'],
    FacilitatorRoster: ['id','memberId','weekDate','memberName','notes','reminderSent','assignedBy','notificationSent','reminderNotificationSent'],
    AuditionSuggestions: ['id','suggestedName','skill','ministry','description','contact','submittedBy','submittedByMemberId','submittedAt','status','adminResponse','respondedAt'],
    Notifications: ['id','memberId','type','title','body','isRead','createdAt','linkTo'],
    Badges: ['id','memberId','badgeKey','badgeName','badgeEmoji','awardedAt','isCustom'],
    OnboardingProgress: ['id','memberId','step','isCompleted','completedAt'],
    VMReviews: ['id','memberId','completedAt','score','month','year'],
    Settings: ['key','value'],
    BirthdayWishes: ['id','birthdayMemberId','year','wisherId','wisherName','wish','createdAt'],
  };
  required.forEach(function(name) {
    var sheet = SS.getSheetByName(name);
    if (!sheet) {
      sheet = SS.insertSheet(name);
      sheet.appendRow(headers[name]);
    }
  });
}

// ================================================================
// AUTHENTICATION
// ================================================================
function authenticateUser(p) {
  var members = sheetToObjects(getSheet('Members'));
  var member = members.find(function(m) {
    return String(m.email).toLowerCase() === String(p.email).toLowerCase() &&
           String(m.passwordHash) === String(p.passwordHash) &&
           m.isActive;
  });
  if (!member) return err('Invalid email or password');
  var token = genId();
  var expiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  var sheet = getSheet('Members');
  var row = findRowById(sheet, member.id);
  if (row > 0) updateRow(sheet, row, { sessionToken: token, sessionExpiry: expiry });
  member.sessionToken = token;
  member.passwordHash = undefined;
  return ok(member);
}

function validateSession(p) {
  var members = sheetToObjects(getSheet('Members'));
  var member = members.find(function(m) { return String(m.sessionToken) === String(p.token); });
  if (!member) return err('Invalid or expired session');
  if (new Date(member.sessionExpiry) < new Date()) return err('Session expired');
  member.passwordHash = undefined;
  return ok(member);
}

function changePassword(p) {
  var sheet = getSheet('Members');
  var members = sheetToObjects(sheet);
  var member = members.find(function(m) { return String(m.id) === String(p.memberId); });
  if (!member) return err('Member not found');
  if (String(member.passwordHash) !== String(p.currentHash)) return err('Current password is incorrect');
  var row = findRowById(sheet, p.memberId);
  updateRow(sheet, row, { passwordHash: p.newHash });
  return ok({ message: 'Password changed successfully' });
}

function requestPasswordReset(p) {
  var members = sheetToObjects(getSheet('Members'));
  var member = members.find(function(m) { return String(m.email).toLowerCase() === String(p.email).toLowerCase(); });
  if (!member) return ok({ message: 'If that email exists, a reset link has been sent.' });
  var resetToken = genId();
  var sheet = getSheet('Members');
  var row = findRowById(sheet, member.id);
  updateRow(sheet, row, { sessionToken: resetToken, sessionExpiry: new Date(Date.now() + 3600000).toISOString() });
  try { GmailApp.sendEmail(member.email, buildEmailSubject('passwordReset', { name: member.name, token: resetToken }), '', { htmlBody: buildEmailHtml('passwordReset', { name: member.name, token: resetToken }), name: 'CBC Thane Worship' }); } catch(ex) { Logger.log('Email error: ' + ex.message); }
  return ok({ message: 'Reset link sent' });
}

function confirmPasswordReset(p) {
  var sheet = getSheet('Members');
  var members = sheetToObjects(sheet);
  var member = members.find(function(m) { return String(m.sessionToken) === String(p.token); });
  if (!member) return err('Invalid or expired reset token');
  if (new Date() > new Date(member.sessionExpiry)) return err('Reset token has expired. Please request a new one.');
  var row = findRowById(sheet, member.id);
  updateRow(sheet, row, { passwordHash: p.newHash, sessionToken: '', sessionExpiry: '' });
  return ok({ message: 'Password reset successfully' });
}

// ================================================================
// MEMBERS
// ================================================================
function getMembers(p) {
  var auth = requireAuth(p, 'MEMBER');
  if (!auth.ok) return err(auth.error);
  var members = sheetToObjects(getSheet('Members')).filter(function(m) { return m.isActive; });
  members.forEach(function(m) { m.passwordHash = undefined; m.sessionToken = undefined; });
  return ok(members);
}

function getMember(p) {
  var auth = requireAuth(p, 'MEMBER');
  if (!auth.ok) return err(auth.error);
  var members = sheetToObjects(getSheet('Members'));
  var m = members.find(function(m) { return String(m.id) === String(p.id); });
  if (!m) return err('Member not found');
  m.passwordHash = undefined; m.sessionToken = undefined;
  return ok(m);
}

function createMember(p) {
  var auth = requireAuth(p, 'ADMIN');
  if (!auth.ok) return err(auth.error);
  var id = genId();
  p.id = id;
  appendRow(getSheet('Members'), p);
  addNotification(id, 'badge', 'Welcome to the team!', 'Your account has been created. Please complete onboarding.', '/');
  try { GmailApp.sendEmail(p.email, buildEmailSubject('welcome', { name: p.name }), '', { htmlBody: buildEmailHtml('welcome', { name: p.name }), name: 'CBC Thane Worship' }); } catch(ex) { Logger.log('Email error: ' + ex.message); }
  return ok({ id: id });
}

function updateMember(p) {
  var auth = requireAuth(p, 'MEMBER');
  if (!auth.ok) return err(auth.error);
  if (auth.role === 'MEMBER' && p.id !== p.requestingMemberId) {
    return err('Cannot update another member');
  }
  // role and adminDepartments are sensitive fields — only a Super Admin may
  // change them, regardless of whose row is being updated. Without this an
  // ADMIN (not just SUPER_ADMIN) could grant themselves or anyone else a
  // higher role or admin department via a direct API call, since the check
  // above only restricts a plain MEMBER to their own id.
  if (auth.role !== 'SUPER_ADMIN') {
    delete p.role;
    delete p.adminDepartments;
  }
  addMissingColumns();
  if (p.photoBase64) {
    try {
      p.photoUrl = uploadToR2(p.photoBase64, 'profile_' + p.id, 'image/jpeg');
    } catch (ex) {
      Logger.log('updateMember photo error: ' + ex.message);
      return err('Photo upload failed: ' + ex.message);
    }
    delete p.photoBase64;
  }
  var sheet = getSheet('Members');
  var row = findRowById(sheet, p.id);
  if (row < 0) return err('Member not found');
  updateRow(sheet, row, p);
  touchCache('Members');
  return ok({ message: 'Updated' });
}

function deleteMember(p) {
  var auth = requireAuth(p, 'ADMIN');
  if (!auth.ok) return err(auth.error);
  var sheet = getSheet('Members');
  var members = sheetToObjects(sheet);
  var m = members.find(function(m) { return String(m.id) === String(p.id); });
  if (!m) return err('Member not found');
  if (m.role === 'SUPER_ADMIN') return err('Cannot delete Super Admin');
  var row = findRowById(sheet, p.id);
  updateRow(sheet, row, { isActive: false });
  return ok({ message: 'Member removed' });
}

// ================================================================
// ASSETS
// ================================================================
function getAssets(p) {
  return ok(sheetToObjects(getSheet('Assets')));
}

function getAsset(p) {
  var a = sheetToObjects(getSheet('Assets')).find(function(a) { return String(a.id) === String(p.id); });
  if (!a) return err('Asset not found');
  return ok(a);
}

function createAsset(p) {
  var auth = requireAuth(p, 'ADMIN');
  if (!auth.ok) return err(auth.error);
  addMissingColumns();
  p.id = genId();
  // Generate friendly asset ID: first 3 letters of category + zero-padded count
  var category = String(p.category || 'OTH');
  var prefix = category.replace(/[^A-Za-z]/g, '').substring(0, 3).toUpperCase() || 'OTH';
  var existing = sheetToObjects(getSheet('Assets')).filter(function(a) {
    return String(a.category) === String(p.category);
  });
  var num = existing.length + 1;
  var assetId = prefix + '-' + (num < 10 ? '0' + num : String(num));
  p.assetId = assetId;
  if (p.photoBase64) {
    try {
      p.photoUrl = uploadToR2(p.photoBase64, 'asset_' + p.id, 'image/jpeg');
    } catch (ex) {
      Logger.log('createAsset photo error: ' + ex.message);
      return err(ex.message);
    }
    delete p.photoBase64;
  }
  appendRow(getSheet('Assets'), p);
  touchCache('Assets');
  return ok({ id: p.id, assetId: assetId });
}

function updateAsset(p) {
  var auth = requireAuth(p, 'ADMIN');
  if (!auth.ok) return err(auth.error);
  addMissingColumns();
  if (p.photoBase64) {
    try {
      p.photoUrl = uploadToR2(p.photoBase64, 'asset_' + p.id, 'image/jpeg');
    } catch (ex) {
      Logger.log('updateAsset photo error: ' + ex.message);
      return err(ex.message);
    }
    delete p.photoBase64;
  }
  var sheet = getSheet('Assets');
  var row = findRowById(sheet, p.id);
  if (row < 0) return err('Asset not found');
  updateRow(sheet, row, p);
  touchCache('Assets');
  return ok({ message: 'Updated' });
}

function deleteAsset(p) {
  var auth = requireAuth(p, 'ADMIN');
  if (!auth.ok) return err(auth.error);
  var sheet = getSheet('Assets');
  var row = findRowById(sheet, p.id);
  if (row < 0) return err('Asset not found');
  deleteRow(sheet, row);
  touchCache('Assets');
  return ok({ message: 'Deleted' });
}

function checkoutAsset(p) {
  var auth = requireAuth(p, 'MEMBER');
  if (!auth.ok) return err(auth.error);
  var sheet = getSheet('Assets');
  var assets = sheetToObjects(sheet);
  var asset = assets.find(function(a) { return String(a.serialNumber).trim() === String(p.serialNumber).trim(); });
  if (!asset) return err('Asset not found');
  if (asset.checkedOutBy) return err('Asset is already checked out');
  var row = findRowById(sheet, asset.id);
  updateRow(sheet, row, { checkedOutBy: p.memberId, checkedOutAt: getNowIST(), checkedOutPurpose: p.purpose });
  return ok({ message: 'Checked out' });
}

function checkinAsset(p) {
  var auth = requireAuth(p, 'MEMBER');
  if (!auth.ok) return err(auth.error);
  var sheet = getSheet('Assets');
  var assets = sheetToObjects(sheet);
  var asset = assets.find(function(a) { return String(a.serialNumber).trim() === String(p.serialNumber).trim(); });
  if (!asset) return err('Asset not found');
  var row = findRowById(sheet, asset.id);
  if (row < 0) return err('Asset not found');
  updateRow(sheet, row, { checkedOutBy: '', checkedOutAt: '', checkedOutPurpose: '' });
  return ok({ message: 'Returned' });
}

// ================================================================
// MAINTENANCE LOG
// ================================================================
function getMaintenanceLogs(p) {
  var auth = requireAuth(p, 'MEMBER');
  if (!auth.ok) return err(auth.error);
  if (!p.serialNumber) return ok([]);
  var logs = sheetToObjects(getSheet('MaintenanceLog'));
  logs = logs.filter(function(l) { return String(l.serialNumber) === String(p.serialNumber); });
  return ok(logs);
}

function addMissingColumns() {
  var mlSheet = getSheet('MaintenanceLog');
  var mlHeaders = mlSheet.getRange(1, 1, 1, mlSheet.getLastColumn()).getValues()[0];
  ['photoBase64','submittedBy','completedBy','photoUrl'].forEach(function(col) {
    if (mlHeaders.indexOf(col) === -1) {
      mlSheet.getRange(1, mlSheet.getLastColumn() + 1).setValue(col);
      Logger.log('addMissingColumns: added ' + col + ' column to MaintenanceLog');
    }
  });
  ['Members', 'Assets'].forEach(function(sheetName) {
    var s = getSheet(sheetName);
    var headers = s.getRange(1, 1, 1, s.getLastColumn()).getValues()[0];
    if (headers.indexOf('photoUrl') === -1) {
      s.getRange(1, s.getLastColumn() + 1).setValue('photoUrl');
      Logger.log('addMissingColumns: added photoUrl column to ' + sheetName);
    }
  });
  var membersSheet = getSheet('Members');
  var membersHeaders = membersSheet.getRange(1, 1, 1, membersSheet.getLastColumn()).getValues()[0];
  if (membersHeaders.indexOf('adminDepartments') === -1) {
    membersSheet.getRange(1, membersSheet.getLastColumn() + 1).setValue('adminDepartments');
    Logger.log('addMissingColumns: added adminDepartments column to Members');
  }
}

function columnExists(sheetName, columnName) {
  var sheet = getSheet(sheetName);
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  return headers.indexOf(columnName) !== -1;
}

function addMaintenanceLog(p) {
  var auth = requireAuth(p, 'MEMBER');
  if (!auth.ok) return err(auth.error);
  try {
  addMissingColumns();
  var maintMembers = sheetToObjects(getSheet('Members'));
  function resolveToName(id) {
    if (!id) return '';
    var m = maintMembers.filter(function(m) { return String(m.id) === String(id); })[0];
    return m ? m.name : String(id);
  }
  var submitterMemberId = p.submittedBy;
  if (p.submittedBy) p.submittedBy = resolveToName(p.submittedBy);
  if (p.completedBy) p.completedBy = resolveToName(p.completedBy);
  p.id = genId();
  p.isCompleted = false;
  p.completedAt = '';
  p.raisedAt = getNowIST();
  if (p.photoBase64) {
    try {
      p.photoUrl = uploadToR2(p.photoBase64, 'maintenance_' + p.id + '_' + Date.now(), 'image/jpeg');
    } catch (ex) {
      Logger.log('addMaintenanceLog photo error: ' + ex.message);
      return err('Photo upload failed: ' + ex.message);
    }
    delete p.photoBase64;
  }
  Logger.log('Writing maintenance log for serialNumber: ' + (p.serialNumber || '(none)'));
  var mlSheet = getSheet('MaintenanceLog');
  appendRow(mlSheet, p);
  // Verify serialNumber was written
  var written = sheetToObjects(mlSheet).find(function(l) { return String(l.id) === String(p.id); });
  if (!written || !written.serialNumber) Logger.log('WARNING: serialNumber not populated for log id ' + p.id);
  // Update asset next due date
  if (p.serialNumber && p.nextDueDate) {
    var aSheet = getSheet('Assets');
    var allAssetsForUpdate = sheetToObjects(aSheet);
    var assetToUpdate = allAssetsForUpdate.find(function(a) { return String(a.serialNumber).trim() === String(p.serialNumber).trim(); });
    if (assetToUpdate) {
      var aRow = findRowById(aSheet, assetToUpdate.id);
      if (aRow > 0) updateRow(aSheet, aRow, { nextDueDate: p.nextDueDate });
    }
  }
  // Resolve asset name by serialNumber
  var allAssets = sheetToObjects(getSheet('Assets'));
  var assetForLog = allAssets.find(function(a) { return String(a.serialNumber).trim() === String(p.serialNumber).trim(); });
  var assetName = assetForLog ? assetForLog.name : p.serialNumber;
  var serialNumber = p.serialNumber || '—';
  var doneByLabel = p.doneBy || 'Unknown';
  var nextDueDateLabel = p.nextDueDate || '—';

  // Resolve submitter by original UUID (p.submittedBy was already overwritten with a name above)
  var allMembers = sheetToObjects(getSheet('Members'));
  var submitterMember = allMembers.find(function(m) { return String(m.id) === String(submitterMemberId); });

  // In-app notification to submitter
  if (submitterMember) {
    addNotification(submitterMember.id, 'maintenance',
      'Maintenance Logged',
      'Your maintenance log for ' + assetName + ' has been recorded. Next due: ' + nextDueDateLabel,
      '/assets?open=' + p.serialNumber);
  }
  if (submitterMember && submitterMember.email) {
    sendMaintenanceRaisedEmail(submitterMember.email, submitterMember.name, {
      assetName: assetName,
      serialNumber: serialNumber,
      description: p.description || '—',
      raisedBy: doneByLabel,
      dateRaised: p.date || getNowIST(),
      maintenanceType: p.maintenanceType || '—',
      nextDueDate: nextDueDateLabel,
      photoUrl: p.photoUrl || ''
    });
  }

  // In-app notification + email to the Assets admin(s)
  var admins = getAdminMembers('ASSETS');
  admins.forEach(function(admin) {
    addNotification(admin.id, 'maintenance',
      'New Maintenance Log',
      doneByLabel + ' logged maintenance for ' + assetName + '. Status: OPEN',
      '/assets?open=' + p.serialNumber);
    if (admin.email) {
      sendMaintenanceRaisedEmail(admin.email, admin.name, {
        assetName: assetName,
        serialNumber: serialNumber,
        description: p.description || '—',
        raisedBy: doneByLabel,
        dateRaised: p.date || getNowIST(),
        maintenanceType: p.maintenanceType || '—',
        nextDueDate: nextDueDateLabel,
        photoUrl: p.photoUrl || ''
      });
    }
  });

  touchCache('MaintenanceLog');
  touchCache('Assets');
  return ok({ id: p.id });
  } catch(ex) {
    Logger.log('addMaintenanceLog error: ' + ex.message + '\n' + ex.stack);
    return err('addMaintenanceLog failed: ' + ex.message);
  }
}

function updateMaintenanceLog(p) {
  var auth = requireAuth(p, 'MEMBER');
  if (!auth.ok) return err(auth.error);
  // Marking completion is admin-only; photo-only updates are open to any member
  if ((p.isCompleted !== undefined || p.completedBy !== undefined) &&
      auth.role !== 'ADMIN' && auth.role !== 'SUPER_ADMIN') {
    return err('Insufficient role');
  }
  addMissingColumns();
  if (p.photoBase64) {
    try {
      p.photoUrl = uploadToR2(p.photoBase64, 'maintenance_' + p.id + '_' + Date.now(), 'image/jpeg');
    } catch (ex) {
      Logger.log('updateMaintenanceLog photo error: ' + ex.message);
      return err(ex.message);
    }
    delete p.photoBase64;
  }
  var sheet = getSheet('MaintenanceLog');
  var logs = sheetToObjects(sheet);
  var log = logs.find(function(l) { return String(l.id) === String(p.id); });
  if (!log) return err('Log not found');
  var row = findRowById(sheet, p.id);
  if (row < 0) return err('Log not found');
  var wasCompleted = log.isCompleted === true || log.isCompleted === 'true' || log.isCompleted === 'TRUE';
  var nowCompleting = p.isCompleted === 'true' || p.isCompleted === true;
  if (nowCompleting) p.completedAt = getNowIST();
  Logger.log('updateMaintenanceLog writing: ' + JSON.stringify(p));
  if (p._debug) return ok({ debug: true, p: JSON.stringify(p), hasPhoto: !!p.photoBase64, hasPhotoUrl: !!p.photoUrl });
  updateRow(sheet, row, p);

  // If just marked complete, send completion notifications
  if (!wasCompleted && nowCompleting) {
    var compAsset = sheetToObjects(getSheet('Assets')).find(function(a) { return String(a.serialNumber).trim() === String(log.serialNumber).trim(); });
    var compAssetName = compAsset ? compAsset.name : (log.serialNumber || 'Unknown Asset');
    var compAllMembers = sheetToObjects(getSheet('Members'));

    // completedBy arrives as a member UUID; store it before resolving to name for the sheet
    var completedById = p.completedBy;
    var completedByMember = completedById ? compAllMembers.find(function(m) { return String(m.id) === String(completedById); }) : null;
    var completedByName = completedByMember ? completedByMember.name : 'Admin';
    if (completedByMember) p.completedBy = completedByName;

    // doneBy is stored as a name string (from fix applied previously)
    var raisedByName = log.doneBy || 'Unknown';
    var raisedByMember = compAllMembers.find(function(m) { return m.name === raisedByName && String(m.isActive).toLowerCase() !== 'false'; });

    var completionDate = getNowIST();
    var completionData = {
      assetName: compAssetName,
      description: log.description || log.maintenanceType || '—',
      raisedBy: raisedByName,
      dateRaised: log.date || '—',
      completedBy: completedByName,
      completedAt: completionDate,
      photoUrl: log.photoUrl || ''
    };

    // In-app + email to original submitter
    if (raisedByMember) {
      addNotification(raisedByMember.id, 'maintenance',
        'Maintenance Complete',
        'Your maintenance request for ' + compAssetName + ' has been completed by ' + completedByName,
        '/assets?open=' + log.serialNumber);
      if (raisedByMember.email) {
        sendMaintenanceCompleteEmail(raisedByMember.email, raisedByMember.name, completionData);
      }
    }

    // In-app + email to the Assets admin(s)
    var compAdmins = getAdminMembers('ASSETS');
    compAdmins.forEach(function(admin) {
      addNotification(admin.id, 'maintenance',
        'Maintenance Completed',
        compAssetName + ' — completed by ' + completedByName,
        '/assets?open=' + log.serialNumber);
      if (admin.email) {
        sendMaintenanceCompleteEmail(admin.email, admin.name, completionData);
      }
    });
  }
  touchCache('MaintenanceLog');
  return ok({ message: 'Updated' });
}

function deleteMaintenanceLog(p) {
  var auth = requireAuth(p, 'ADMIN');
  if (!auth.ok) return err(auth.error);
  var sheet = getSheet('MaintenanceLog');
  var row = findRowById(sheet, p.id);
  if (row < 0) return err('Log not found');
  deleteRow(sheet, row);
  touchCache('MaintenanceLog');
  return ok({ message: 'Deleted' });
}

// ================================================================
// MAINTENANCE REMINDERS
// TRIGGER: Time-driven, Hour timer, every 5 hours
// Setup: Apps Script > Triggers > sendMaintenanceReminders > Hour timer > Every 5 hours
// ================================================================
function sendMaintenanceReminders() {
  var logs = sheetToObjects(getSheet('MaintenanceLog')).filter(function(l) {
    return l.isCompleted === false || l.isCompleted === 'false' || l.isCompleted === 'FALSE' || !l.isCompleted;
  });
  if (logs.length === 0) return;
  var assets = sheetToObjects(getSheet('Assets'));
  var admins = getAdminMembers('ASSETS');

  // One consolidated digest per admin per run, not one notification/email per
  // (item, admin) pair — with N open items and M admins this used to fire
  // N*M separate pings every 5 hours for the same stale-item list.
  var items = logs.map(function(l) {
    var asset = assets.find(function(a) { return String(a.serialNumber).trim() === String(l.serialNumber).trim(); });
    return {
      assetName: asset ? asset.name : (l.serialNumber || 'Unknown Asset'),
      description: l.description || l.maintenanceType || '—',
      raisedBy: l.doneBy || '—',
      dateRaised: l.date || '—',
    };
  });

  var names = items.map(function(i) { return i.assetName; });
  var summary = names.length <= 5
    ? names.join(', ')
    : names.slice(0, 5).join(', ') + ', +' + (names.length - 5) + ' more';
  var notifBody = items.length + ' item' + (items.length === 1 ? '' : 's') + ' still open: ' + summary;

  var emailRows = items.map(function(i) {
    return { asset: i.assetName, description: i.description, raisedBy: i.raisedBy, dateRaised: i.dateRaised, status: 'Open' };
  });

  admins.forEach(function(admin) {
    addNotification(admin.id, 'maintenance', 'Open Maintenance Reminder', notifBody, '/assets');
    if (admin.email) {
      sendMaintenanceLogEmail(admin.email, admin.name, emailRows, false);
    }
  });
}

function sendMaintenanceLogEmail(toEmail, toName, rows, isCompletion) {
  var subject = isCompletion ? 'MAINTENANCE LOG — Completed — CBC Worship Portal' : 'MAINTENANCE LOG — Update — CBC Worship Portal';
  var tableHeader = isCompletion
    ? '<tr style="background:#0f1b2d"><th>Asset</th><th>Description</th><th>Raised By</th><th>Date Raised</th><th>TAT</th><th>Completed By</th><th>Completion Date & Time</th><th>Status</th></tr>'
    : '<tr style="background:#0f1b2d"><th>Asset</th><th>Description</th><th>Raised By</th><th>Date Raised</th><th>TAT</th><th>Status</th></tr>';
  var tdStyle = 'style="padding:8px 10px;color:#f5f0e8;font-size:12px;border-bottom:1px solid #2a4060"';
  var tableRows = rows.map(function(r, i) {
    var bg = i % 2 === 0 ? '#1a2d45' : '#1f3552';
    if (isCompletion) {
      return '<tr style="background:' + bg + '"><td ' + tdStyle + '>' + r.asset + '</td><td ' + tdStyle + '>' + (r.description||'—') + '</td><td ' + tdStyle + '>' + (r.raisedBy||'—') + '</td><td ' + tdStyle + '>' + (r.dateRaised||'—') + '</td><td ' + tdStyle + '>' + (r.tat||'—') + '</td><td ' + tdStyle + '>' + (r.completedBy||'—') + '</td><td ' + tdStyle + '>' + (r.completionDate||'—') + '</td><td ' + tdStyle + ' style="color:#4caf82;font-weight:bold">DONE</td></tr>';
    }
    return '<tr style="background:' + bg + '"><td ' + tdStyle + '>' + r.asset + '</td><td ' + tdStyle + '>' + (r.description||'—') + '</td><td ' + tdStyle + '>' + (r.raisedBy||'—') + '</td><td ' + tdStyle + '>' + (r.dateRaised||'—') + '</td><td ' + tdStyle + '>' + (r.tat||'—') + '</td><td ' + tdStyle + ' style="color:#e8a84c">' + (r.status||'Open') + '</td></tr>';
  }).join('');
  var thStyle = 'style="padding:8px 10px;color:#c9a84c;font-size:11px;text-align:left;font-weight:bold"';
  var tableHtml = '<table style="width:100%;border-collapse:collapse;margin:16px 0;font-family:sans-serif">' + tableHeader.replace(/<th>/g, '<th ' + thStyle + '>') + tableRows + '</table>';
  var bodyHtml = '<p style="color:#f5f0e8;font-size:14px;margin:0 0 12px">Hi <strong>' + toName + '</strong>,</p>'
    + '<p style="color:#b8ae9e;font-size:13px;margin:0 0 12px">' + (isCompletion ? 'A maintenance job has been marked complete.' : 'Here is the current maintenance status update.') + '</p>'
    + tableHtml;
  var header = '<div style="background:#0f1b2d;padding:24px;text-align:center"><p style="font-family:serif;font-size:20px;color:#c9a84c;margin:0;font-weight:bold">CBC Thane Worship Portal</p></div>';
  var footer = '<div style="background:#0f1b2d;padding:12px;text-align:center"><p style="font-family:sans-serif;font-size:11px;color:#b8ae9e;margin:0">CBC Thane Worship Team</p></div>';
  var html = '<div style="background:#1a2d45;max-width:600px;margin:0 auto;font-family:sans-serif">' + header + '<div style="padding:24px">' + bodyHtml + '</div>' + footer + '</div>';
  try { GmailApp.sendEmail(toEmail, subject, '', { htmlBody: html, name: 'CBC Worship Portal' }); } catch(ex) { Logger.log('Email error: ' + ex.message); }
}

function sendMaintenanceRaisedEmail(toEmail, toName, d) {
  var subject = 'MAINTENANCE LOG — Raised: ' + d.assetName;
  var thS = 'style="padding:8px 12px;color:#c9a84c;font-size:11px;text-align:left;font-weight:bold;background:#0f1b2d"';
  var tdS = 'style="padding:8px 12px;color:#f5f0e8;font-size:13px;border-bottom:1px solid #2a4060"';
  var lS  = 'style="padding:8px 12px;color:#b8ae9e;font-size:13px;border-bottom:1px solid #2a4060"';
  var rows = [
    ['Asset',            d.assetName],
    ['Serial Number',    d.serialNumber],
    ['Description',      d.description],
    ['Raised By',        d.raisedBy],
    ['Date Raised',      d.dateRaised],
    ['Maintenance Type', d.maintenanceType],
    ['Next Due Date',    d.nextDueDate],
    ['Status',           'OPEN'],
  ];
  var tableRows = rows.map(function(r, i) {
    var bg = i % 2 === 0 ? '#1a2d45' : '#1f3552';
    var valStyle = r[0] === 'Status'
      ? 'style="padding:8px 12px;color:#e8a84c;font-size:13px;font-weight:bold;border-bottom:1px solid #2a4060"'
      : tdS;
    return '<tr style="background:' + bg + '"><td ' + lS + '>' + r[0] + '</td><td ' + valStyle + '>' + (r[1] || '—') + '</td></tr>';
  }).join('');
  var table = '<table style="width:100%;border-collapse:collapse;margin:16px 0">' + tableRows + '</table>';
  var header = '<div style="background:#0f1b2d;padding:24px;text-align:center"><p style="font-family:serif;font-size:20px;color:#c9a84c;margin:0;font-weight:bold">CBC Thane Worship Portal</p></div>';
  var footer = '<div style="background:#0f1b2d;padding:12px;text-align:center"><p style="font-family:sans-serif;font-size:11px;color:#b8ae9e;margin:0">CBC Thane Worship Team</p></div>';
  var photoBlock = '';
  if (d.photoUrl) {
    photoBlock = '<br><p style="font-family:sans-serif;font-size:13px;color:#555;">Maintenance photo:</p><img src="' + d.photoUrl + '" style="max-width:600px;width:100%;border-radius:6px;" alt="Maintenance photo">';
  } else if (d.photoBase64 && d.photoBase64.length > 0) {
    photoBlock = '<br><p style="font-family:sans-serif;font-size:13px;color:#555;">Attached photo:</p><img src="data:image/jpeg;base64,' + d.photoBase64 + '" style="max-width:600px;width:100%;border-radius:6px;" alt="Maintenance photo">';
  }
  var body = '<p style="color:#f5f0e8;font-size:14px;margin:0 0 12px">Hi <strong>' + toName + '</strong>,</p>'
    + '<p style="color:#b8ae9e;font-size:13px;margin:0 0 12px">A new maintenance log has been raised.</p>'
    + table + photoBlock;
  var html = '<div style="background:#1a2d45;max-width:600px;margin:0 auto;font-family:sans-serif">' + header + '<div style="padding:24px">' + body + '</div>' + footer + '</div>';
  try { GmailApp.sendEmail(toEmail, subject, '', { htmlBody: html, name: 'CBC Worship Portal' }); } catch(ex) { Logger.log('Email error: ' + ex.message); }
}

function sendMaintenanceCompleteEmail(toEmail, toName, d) {
  var subject = 'MAINTENANCE LOG — Complete: ' + d.assetName;
  var tdS = 'style="padding:8px 12px;color:#f5f0e8;font-size:13px;border-bottom:1px solid #2a4060"';
  var lS  = 'style="padding:8px 12px;color:#b8ae9e;font-size:13px;border-bottom:1px solid #2a4060"';
  var rows = [
    ['Asset',                   d.assetName],
    ['Description',             d.description],
    ['Raised By',               d.raisedBy],
    ['Date Raised',             d.dateRaised],
    ['Completed By',            d.completedBy],
    ['Completion Date & Time',  d.completedAt],
    ['Status',                  '✅ DONE'],
  ];
  var tableRows = rows.map(function(r, i) {
    var bg = i % 2 === 0 ? '#1a2d45' : '#1f3552';
    var valStyle = r[0] === 'Status'
      ? 'style="padding:8px 12px;color:#4caf82;font-size:13px;font-weight:bold;border-bottom:1px solid #2a4060"'
      : tdS;
    return '<tr style="background:' + bg + '"><td ' + lS + '>' + r[0] + '</td><td ' + valStyle + '>' + (r[1] || '—') + '</td></tr>';
  }).join('');
  var table = '<table style="width:100%;border-collapse:collapse;margin:16px 0">' + tableRows + '</table>';
  var header = '<div style="background:#0f1b2d;padding:24px;text-align:center"><p style="font-family:serif;font-size:20px;color:#c9a84c;margin:0;font-weight:bold">CBC Thane Worship Portal</p></div>';
  var footer = '<div style="background:#0f1b2d;padding:12px;text-align:center"><p style="font-family:sans-serif;font-size:11px;color:#b8ae9e;margin:0">CBC Thane Worship Team</p></div>';
  var photoBlock = '';
  if (d.photoUrl) {
    photoBlock = '<br><p style="font-family:sans-serif;font-size:13px;color:#555;">Maintenance photo:</p><img src="' + d.photoUrl + '" style="max-width:600px;width:100%;border-radius:6px;" alt="Maintenance photo">';
  } else if (d.photoBase64 && d.photoBase64.length > 0) {
    photoBlock = '<br><p style="font-family:sans-serif;font-size:13px;color:#555;">Attached photo:</p><img src="data:image/jpeg;base64,' + d.photoBase64 + '" style="max-width:600px;width:100%;border-radius:6px;" alt="Maintenance photo">';
  }
  var body = '<p style="color:#f5f0e8;font-size:14px;margin:0 0 12px">Hi <strong>' + toName + '</strong>,</p>'
    + '<p style="color:#b8ae9e;font-size:13px;margin:0 0 12px">A maintenance job has been marked complete.</p>'
    + table + photoBlock;
  var html = '<div style="background:#1a2d45;max-width:600px;margin:0 auto;font-family:sans-serif">' + header + '<div style="padding:24px">' + body + '</div>' + footer + '</div>';
  try { GmailApp.sendEmail(toEmail, subject, '', { htmlBody: html, name: 'CBC Worship Portal' }); } catch(ex) { Logger.log('Email error: ' + ex.message); }
}

// ================================================================
// ANNOUNCEMENTS
// ================================================================
function addMissingAnnouncementColumns() {
  var sheet = getSheet('Announcements');
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  ['acknowledged','rsvpYes','rsvpNo','rsvpReason'].forEach(function(col) {
    if (headers.indexOf(col) === -1) {
      sheet.getRange(1, sheet.getLastColumn() + 1).setValue(col);
      Logger.log('addMissingAnnouncementColumns: added ' + col);
    }
  });
}

function getAnnouncements(p) {
  addMissingAnnouncementColumns();
  var memberId = p && p.memberId ? String(p.memberId) : '';

  var members = sheetToObjects(getSheet('Members'));
  var memberMap = {};
  members.forEach(function(m) { memberMap[String(m.id)] = m.name; });
  var memberName = memberId ? (memberMap[memberId] || '') : '';

  var rows = sheetToObjects(getSheet('Announcements')).sort(function(a,b) {
    return b.createdAt.localeCompare(a.createdAt);
  });

  rows = rows.map(function(a) {
    // names stored directly in sheet
    a.readByNames      = a.readBy      ? a.readBy.split(',').filter(Boolean)      : [];
    a.readCount        = a.readByNames.length;
    a.acknowledgedNames = a.acknowledged ? a.acknowledged.split(',').filter(Boolean) : [];
    a.rsvpYesNames     = a.rsvpYes     ? a.rsvpYes.split(',').filter(Boolean)     : [];
    a.rsvpNoNames      = a.rsvpNo      ? a.rsvpNo.split(',').filter(Boolean)      : [];

    a.myAcknowledged = memberName ? a.acknowledgedNames.indexOf(memberName) !== -1 : false;
    a.myRsvp = memberName
      ? (a.rsvpYesNames.indexOf(memberName) !== -1 ? 'yes' : (a.rsvpNoNames.indexOf(memberName) !== -1 ? 'no' : null))
      : null;

    // safe formatted date — "5 May 2026, 2:32 PM"
    a.createdAtFormatted = formatISTString(a.createdAt);

    return a;
  });

  return ok(rows);
}

function formatISTString(raw) {
  // raw format from getNowIST: "YYYY-MM-DD HH:MM IST"
  if (!raw) return '';
  var parts = raw.split(' ');           // ["YYYY-MM-DD", "HH:MM", "IST"]
  if (parts.length < 2) return raw;
  var dateParts = parts[0].split('-');  // ["YYYY", "MM", "DD"]
  var timeParts = parts[1].split(':');  // ["HH", "MM"]
  if (dateParts.length < 3 || timeParts.length < 2) return raw;
  var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  var day   = parseInt(dateParts[2], 10);
  var month = months[parseInt(dateParts[1], 10) - 1] || '';
  var year  = dateParts[0];
  var hh    = parseInt(timeParts[0], 10);
  var min   = timeParts[1];
  var ampm  = hh >= 12 ? 'PM' : 'AM';
  var hour  = hh % 12 || 12;
  return day + ' ' + month + ' ' + year + ', ' + hour + ':' + min + ' ' + ampm;
}

function createAnnouncement(p) {
  var auth = requireAuth(p, 'ADMIN');
  if (!auth.ok) return err(auth.error);
  addMissingAnnouncementColumns();
  var creatorMember = sheetToObjects(getSheet('Members')).filter(function(m) { return String(m.id) === String(p.createdBy); })[0];
  p.createdBy = creatorMember ? creatorMember.name : (p.createdBy || 'Unknown');
  p.id = genId();
  p.createdAt = getNowIST();
  p.readBy = '';
  p.acknowledged = '';
  p.rsvpYes = '';
  p.rsvpNo = '';
  appendRow(getSheet('Announcements'), p);
  notifyAllMembers('announcement', '📢 ' + p.title, p.body.substring(0, 100), '/notices?id=' + p.id);
  try { queueAnnouncementEmailBlast(p.id, p.title, p.body); } catch(ex) { Logger.log('Email blast queue error: ' + ex.message); }
  touchCache('Announcements');
  return ok({ id: p.id });
}

// Defers the (slow, synchronous GmailApp) email blast off the request path so
// createAnnouncement returns immediately instead of leaving the client waiting
// on 48+ sequential sends. Payload goes through Script Properties since a
// time-based trigger's callback takes no arguments.
function queueAnnouncementEmailBlast(id, title, body) {
  PropertiesService.getScriptProperties().setProperty(
    'pendingAnnouncementEmail_' + id,
    JSON.stringify({ title: title, body: body })
  );
  ScriptApp.newTrigger('runPendingAnnouncementEmails').timeBased().after(1000).create();
}

function runPendingAnnouncementEmails() {
  var props = PropertiesService.getScriptProperties();
  var all = props.getProperties();
  Object.keys(all).forEach(function(key) {
    if (key.indexOf('pendingAnnouncementEmail_') !== 0) return;
    try {
      var job = JSON.parse(all[key]);
      sendAnnouncementEmailBlast(job.title, job.body);
    } catch (ex) {
      Logger.log('Deferred email blast error for ' + key + ': ' + ex.message);
    } finally {
      props.deleteProperty(key);
    }
  });
  // Self-cleanup: remove the one-time trigger(s) that fired this run.
  ScriptApp.getProjectTriggers().forEach(function(t) {
    if (t.getHandlerFunction() === 'runPendingAnnouncementEmails') ScriptApp.deleteTrigger(t);
  });
}

function sendAnnouncementEmailBlast(title, body) {
  var members = sheetToObjects(getSheet('Members')).filter(function(m) { return m.isActive && m.email; });
  var subject = 'NOTICES — ' + title;
  var header = '<div style="background:#0f1b2d;padding:24px;text-align:center"><p style="font-family:serif;font-size:20px;color:#c9a84c;margin:0;font-weight:bold">CBC Thane Worship Portal</p></div>';
  var footer = '<div style="background:#0f1b2d;padding:12px;text-align:center"><p style="font-family:sans-serif;font-size:11px;color:#b8ae9e;margin:0">CBC Thane Worship Team</p></div>';
  var card = '<div style="background:#1e3a5f;border-radius:8px;padding:20px;margin:0 0 20px">'
    + '<p style="font-family:serif;font-size:18px;color:#c9a84c;margin:0 0 12px;font-weight:bold">' + title + '</p>'
    + '<p style="font-family:sans-serif;font-size:14px;color:#f5f0e8;margin:0 0 20px;line-height:1.6">' + body + '</p>'
    + '<a href="https://cbc-worship-portal.pages.dev/notices" style="display:inline-block;background:#c9a84c;color:#0f1b2d;font-family:sans-serif;font-size:13px;font-weight:bold;padding:10px 20px;border-radius:6px;text-decoration:none">View in App</a>'
    + '</div>';
  var html = '<div style="background:#1a2d45;max-width:600px;margin:0 auto;font-family:sans-serif">' + header + '<div style="padding:24px">' + card + '</div>' + footer + '</div>';
  members.forEach(function(m) {
    try {
      GmailApp.sendEmail(m.email, subject, '', { htmlBody: html, name: 'CBC Thane Worship' });
    } catch(ex) {
      Logger.log('Announcement email failed for ' + m.email + ': ' + ex.message);
    }
  });
}

function updateAnnouncement(p) {
  var auth = requireAuth(p, 'ADMIN');
  if (!auth.ok) return err(auth.error);
  var sheet = getSheet('Announcements');
  var row = findRowById(sheet, p.id);
  if (row < 0) return err('Not found');
  updateRow(sheet, row, p);
  touchCache('Announcements');
  return ok({ message: 'Updated' });
}

function deleteAnnouncement(p) {
  var auth = requireAuth(p, 'ADMIN');
  if (!auth.ok) return err(auth.error);
  var sheet = getSheet('Announcements');
  var row = findRowById(sheet, p.id);
  if (row < 0) return err('Not found');
  deleteRow(sheet, row);
  touchCache('Announcements');
  return ok({ message: 'Deleted' });
}

function markAnnouncementsRead(p) {
  var auth = requireAuth(p, 'MEMBER');
  if (!auth.ok) return err(auth.error);
  var sheet = getSheet('Announcements');
  var memberRecord = sheetToObjects(getSheet('Members')).filter(function(m) { return String(m.id) === String(p.memberId); })[0];
  var memberName = memberRecord ? memberRecord.name : String(p.memberId);
  var announcements = sheetToObjects(sheet);
  announcements.forEach(function(a, i) {
    var readBy = a.readBy ? a.readBy.split(',').filter(Boolean) : [];
    if (readBy.indexOf(memberName) === -1) {
      readBy.push(memberName);
      var row = i + 2;
      updateRow(sheet, row, { readBy: readBy.join(',') });
    }
  });
  return ok({ message: 'Marked read' });
}

function acknowledgeAnnouncement(p) {
  var auth = requireAuth(p, 'MEMBER');
  if (!auth.ok) return err(auth.error);
  var sheet = getSheet('Announcements');
  var row = findRowById(sheet, p.id);
  if (row < 0) return err('Not found');
  var memberRecord = sheetToObjects(getSheet('Members')).filter(function(m) { return String(m.id) === String(p.memberId); })[0];
  var memberName = memberRecord ? memberRecord.name : String(p.memberId);
  var existing = sheetToObjects(sheet).filter(function(a) { return String(a.id) === String(p.id); })[0];
  var names = existing && existing.acknowledged ? existing.acknowledged.split(',').filter(Boolean) : [];
  if (names.indexOf(memberName) === -1) {
    names.push(memberName);
    updateRow(sheet, row, { acknowledged: names.join(',') });
  }
  return ok({ message: 'Acknowledged' });
}

function rsvpAnnouncement(p) {
  var auth = requireAuth(p, 'MEMBER');
  if (!auth.ok) return err(auth.error);
  if (p.response === 'no' && (!p.reason || p.reason.trim() === '')) {
    return err('Reason is required when responding No');
  }
  var sheet = getSheet('Announcements');
  var row = findRowById(sheet, p.id);
  if (row < 0) return err('Not found');
  var memberRecord = sheetToObjects(getSheet('Members')).filter(function(m) { return String(m.id) === String(p.memberId); })[0];
  var memberName = memberRecord ? memberRecord.name : String(p.memberId);
  var existing = sheetToObjects(sheet).filter(function(a) { return String(a.id) === String(p.id); })[0];
  if (!existing) return err('Not found');
  var yesNames = existing.rsvpYes ? existing.rsvpYes.split(',').filter(Boolean) : [];
  var noNames  = existing.rsvpNo  ? existing.rsvpNo.split(',').filter(Boolean)  : [];
  // remove from both first, then add to chosen column
  yesNames = yesNames.filter(function(n) { return n !== memberName; });
  noNames  = noNames.filter(function(n)  { return n !== memberName; });
  if (p.response === 'yes') { yesNames.push(memberName); }
  else if (p.response === 'no') { noNames.push(memberName); }
  // Maintain reason map: { memberName: reason }
  var reasonMap = {};
  try { reasonMap = existing.rsvpReason ? JSON.parse(existing.rsvpReason) : {}; } catch(e) { reasonMap = {}; }
  if (p.response === 'no' && p.reason) {
    reasonMap[memberName] = p.reason.trim();
  } else if (p.response === 'yes') {
    delete reasonMap[memberName];
  }
  updateRow(sheet, row, {
    rsvpYes: yesNames.join(','),
    rsvpNo: noNames.join(','),
    rsvpReason: JSON.stringify(reasonMap)
  });
  return ok({ message: 'RSVP saved' });
}

// ================================================================
// PRAYER REQUESTS
// ================================================================
function getPrayerRequests(p) {
  var requests = sheetToObjects(getSheet('PrayerRequests')).sort(function(a,b) { return new Date(b.postedAt) - new Date(a.postedAt); });
  var members = sheetToObjects(getSheet('Members'));
  requests.forEach(function(r) {
    if (!r.isAnonymous) {
      var poster = members.find(function(m) { return String(m.id) === String(r.postedBy); });
      r.posterName = poster ? poster.name : 'A member';
    }
  });
  return ok(requests);
}

function createPrayerRequest(p) {
  var auth = requireAuth(p, 'MEMBER');
  if (!auth.ok) return err(auth.error);
  p.id = genId();
  p.postedAt = getNowIST();
  p.status = 'Believing';
  p.prayingMembers = '';
  p.testimony = '';
  p.answeredAt = '';
  appendRow(getSheet('PrayerRequests'), p);
  touchCache('PrayerRequests');
  return ok({ id: p.id });
}

function updatePrayerRequest(p) {
  var auth = requireAuth(p, 'MEMBER');
  if (!auth.ok) return err(auth.error);
  var sheet = getSheet('PrayerRequests');
  var row = findRowById(sheet, p.id);
  if (row < 0) return err('Not found');
  updateRow(sheet, row, p);
  touchCache('PrayerRequests');
  return ok({ message: 'Updated' });
}

function prayForRequest(p) {
  var auth = requireAuth(p, 'MEMBER');
  if (!auth.ok) return err(auth.error);
  var sheet = getSheet('PrayerRequests');
  var requests = sheetToObjects(sheet);
  var req = requests.find(function(r) { return String(r.id) === String(p.id); });
  if (!req) return err('Not found');
  var praying = req.prayingMembers ? req.prayingMembers.split(',') : [];
  if (!praying.includes(String(p.memberId))) {
    praying.push(String(p.memberId));
    var row = findRowById(sheet, p.id);
    updateRow(sheet, row, { prayingMembers: praying.join(',') });
    if (req.postedBy && req.postedBy !== p.memberId) {
      addNotification(req.postedBy, 'prayer', '🙏 Someone is praying for you', 'A team member is praying for your request: ' + req.title, '/prayer');
    }
  }
  touchCache('PrayerRequests');
  return ok({ message: 'Praying' });
}

function markAnswered(p) {
  var auth = requireAuth(p, 'MEMBER');
  if (!auth.ok) return err(auth.error);
  if (!p.testimony || p.testimony.length < 20) return err('Testimony must be at least 20 characters');
  var sheet = getSheet('PrayerRequests');
  var requests = sheetToObjects(sheet);
  var req = requests.find(function(r) { return String(r.id) === String(p.id); });
  if (!req) return err('Not found');
  var now = getNowIST();
  var row = findRowById(sheet, p.id);
  updateRow(sheet, row, { status: 'Answered', testimony: p.testimony, answeredAt: now });
  appendRow(getSheet('AnsweredPrayers'), {
    id: genId(), originalRequestId: p.id, title: req.title, detail: req.detail,
    postedBy: req.postedBy, answeredAt: now, testimony: p.testimony
  });
  notifyAllMembers('prayer', '🕊️ Prayer Answered!', req.title + ' — praise God!', '/prayer');
  touchCache('PrayerRequests');
  touchCache('AnsweredPrayers');
  return ok({ message: 'Marked as answered' });
}

function deletePrayerRequest(p) {
  var auth = requireAuth(p, 'MEMBER');
  if (!auth.ok) return err(auth.error);
  var sheet = getSheet('PrayerRequests');
  var row = findRowById(sheet, p.id);
  if (row < 0) return err('Not found');
  deleteRow(sheet, row);
  touchCache('PrayerRequests');
  return ok({ message: 'Deleted' });
}

function getAnsweredPrayers(p) {
  var answered = sheetToObjects(getSheet('AnsweredPrayers')).sort(function(a,b) { return new Date(b.answeredAt) - new Date(a.answeredAt); });
  var members = sheetToObjects(getSheet('Members'));
  answered.forEach(function(a) {
    var poster = members.find(function(m) { return String(m.id) === String(a.postedBy); });
    a.posterName = poster ? poster.name : 'A member';
  });
  return ok(answered);
}

function getYearEndSummary(p) {
  var year = parseInt(p.year) || new Date().getFullYear();
  var answered = sheetToObjects(getSheet('AnsweredPrayers')).filter(function(a) {
    return a.answeredAt && new Date(a.answeredAt).getFullYear() === year;
  });
  var members = sheetToObjects(getSheet('Members'));
  answered.forEach(function(a) {
    var poster = members.find(function(m) { return String(m.id) === String(a.postedBy); });
    a.posterName = poster ? poster.name : 'A member';
  });
  return ok(answered);
}

// ================================================================
// BIRTHDAY WALL
// ================================================================
function getBirthdayWalls(p) {
  var auth = requireAuth(p, 'MEMBER');
  if (!auth.ok) return err(auth.error);

  var now = new Date();
  var istNow = new Date(now.getTime() + 5.5 * 60 * 60 * 1000);
  var dd = String(istNow.getUTCDate()).padStart(2,'0');
  var mm = String(istNow.getUTCMonth()+1).padStart(2,'0');
  var todayDDMM = dd + '/' + mm;
  var year = istNow.getUTCFullYear();

  var members = sheetToObjects(getSheet('Members'))
    .filter(function(m) {
      return String(m.isActive).toLowerCase() !== 'false' &&
             m.birthday === todayDDMM;
    });

  if (members.length === 0) return ok([]);

  var wishes = sheetToObjects(
    getSheet('BirthdayWishes')
  ).filter(function(w) {
    return parseInt(w.year) === year;
  });

  var walls = members.map(function(m) {
    var memberWishes = wishes.filter(function(w) {
      return String(w.birthdayMemberId) === String(m.id);
    });
    return {
      memberId: m.id,
      name: m.name,
      instrument: m.instrument || '',
      photo: m.photoUrl || m.photoBase64 || '',
      wishCount: memberWishes.length
    };
  });

  return ok(walls);
}

function getBirthdayWishes(p) {
  var auth = requireAuth(p, 'MEMBER');
  if (!auth.ok) return err(auth.error);

  var year = new Date().getFullYear();
  var wishes = sheetToObjects(
    getSheet('BirthdayWishes')
  ).filter(function(w) {
    return String(w.birthdayMemberId) === String(p.birthdayMemberId) &&
           parseInt(w.year) === year;
  }).sort(function(a, b) {
    return new Date(b.createdAt) - new Date(a.createdAt);
  });

  return ok(wishes);
}

function postBirthdayWish(p) {
  var auth = requireAuth(p, 'MEMBER');
  if (!auth.ok) return err(auth.error);

  if (!p.wish || p.wish.trim().length < 2) {
    return err('Wish cannot be empty');
  }

  var year = new Date().getFullYear();

  var existing = sheetToObjects(
    getSheet('BirthdayWishes')
  ).find(function(w) {
    return String(w.birthdayMemberId) === String(p.birthdayMemberId) &&
           String(w.wisherId) === String(p.wisherId) &&
           parseInt(w.year) === year;
  });

  if (existing) {
    return err('You have already left a blessing');
  }

  var nowIst = getNowIST();
  appendRow(getSheet('BirthdayWishes'), {
    id: genId(),
    birthdayMemberId: p.birthdayMemberId,
    year: year,
    wisherId: p.wisherId,
    wisherName: p.wisherName,
    wish: p.wish.trim(),
    createdAt: nowIst
  });

  return ok({ message: 'Blessing posted' });
}

function sendBirthdayPDFs(p) {
  // Allow both authenticated calls and internal trigger calls (no token)
  if (p && p.sessionToken) {
    var auth = requireAuth(p, 'SUPER_ADMIN');
    if (!auth.ok) return err(auth.error);
  }

  var now = new Date();
  var istNow = new Date(now.getTime() + 5.5 * 60 * 60 * 1000);
  var dd = String(istNow.getUTCDate()).padStart(2,'0');
  var mm = String(istNow.getUTCMonth()+1).padStart(2,'0');
  var todayDDMM = dd + '/' + mm;
  var year = istNow.getUTCFullYear();

  var members = sheetToObjects(getSheet('Members'))
    .filter(function(m) {
      return String(m.isActive).toLowerCase() !== 'false' &&
             m.birthday === todayDDMM &&
             m.email;
    });

  if (members.length === 0) return ok({ sent: 0, message: 'No birthdays today' });

  var wishes = sheetToObjects(
    getSheet('BirthdayWishes')
  ).filter(function(w) {
    return parseInt(w.year) === year;
  });

  var settings = sheetToObjects(getSheet('Settings'));
  var teamNameSetting = settings.find(function(s) { return s.key === 'teamName'; });
  var teamName = teamNameSetting ? teamNameSetting.value : 'CBC Worship Team';

  var sent = 0;

  members.forEach(function(member) {
    var memberWishes = wishes.filter(function(w) {
      return String(w.birthdayMemberId) === String(member.id);
    });

    try {
      var doc = DocumentApp.create(
        'Birthday Blessings for ' + member.name + ' — ' + dd + '/' + mm + '/' + year
      );
      var body = doc.getBody();

      // Header
      body.appendParagraph(teamName)
        .setHeading(DocumentApp.ParagraphHeading.TITLE)
        .setAlignment(DocumentApp.HorizontalAlignment.CENTER);

      body.appendParagraph(
        'Birthday Blessings for ' + member.name
      ).setHeading(DocumentApp.ParagraphHeading.HEADING1)
        .setAlignment(DocumentApp.HorizontalAlignment.CENTER);

      body.appendParagraph(
        dd + ' ' + getMonthName(mm) + ' ' + year
      ).setAlignment(DocumentApp.HorizontalAlignment.CENTER);

      body.appendParagraph('');
      body.appendHorizontalRule();
      body.appendParagraph('');

      if (memberWishes.length === 0) {
        body.appendParagraph('No wishes were posted today.')
          .setItalic(true)
          .setAlignment(DocumentApp.HorizontalAlignment.CENTER);
      } else {
        memberWishes.forEach(function(w) {
          var namePara = body.appendParagraph(w.wisherName);
          namePara.setBold(true);
          namePara.setFontSize(11);

          body.appendParagraph(w.wish)
            .setItalic(true)
            .setFontSize(11);

          body.appendParagraph('');
        });
      }

      body.appendHorizontalRule();
      body.appendParagraph('');
      body.appendParagraph(
        'With love from ' + teamName
      ).setItalic(true)
        .setAlignment(DocumentApp.HorizontalAlignment.CENTER);

      doc.saveAndClose();

      var pdfBlob = DriveApp.getFileById(doc.getId())
        .getAs('application/pdf');
      pdfBlob.setName('Birthday Blessings — ' + member.name + '.pdf');

      GmailApp.sendEmail(
        member.email,
        'Happy Birthday from ' + teamName,
        'Dear ' + member.name + ',\n\n' +
        'Attached are the birthday blessings your worship team wrote for you today.\n\n' +
        'With love,\n' + teamName,
        { attachments: [pdfBlob] }
      );

      // Clean up the temp doc
      DriveApp.getFileById(doc.getId()).setTrashed(true);

      sent++;
    } catch (e) {
      Logger.log('sendBirthdayPDFs error: ' + e);
      try {
        GmailApp.sendEmail(
          Session.getActiveUser().getEmail(),
          'Birthday PDF Error - CBC Worship Portal',
          'sendBirthdayPDFs failed with the following error:\n\n'
          + e.toString() + '\n\nPlease check the Apps Script logs.'
        );
      } catch (mailErr) {
        Logger.log('Failed to send error alert email: ' + mailErr);
      }
    }
  });

  return ok({ sent: sent, message: sent + ' PDF(s) sent' });
}

function getMonthName(mm) {
  var months = ['January','February','March','April','May','June',
    'July','August','September','October','November','December'];
  return months[parseInt(mm) - 1] || '';
}

// ================================================================
// ATTENDANCE & EVENTS
// ================================================================
function getEvents(p) {
  return ok(sheetToObjects(getSheet('Events')).sort(function(a,b) { return new Date(b.date) - new Date(a.date); }));
}

function createEvent(p) {
  var auth = requireAuth(p, 'ADMIN');
  if (!auth.ok) return err(auth.error);
  p.id = genId();
  appendRow(getSheet('Events'), p);
  touchCache('Events');
  return ok({ id: p.id });
}

function getAttendance(p) {
  var auth = requireAuth(p, 'MEMBER');
  if (!auth.ok) return err(auth.error);
  var att = sheetToObjects(getSheet('Attendance'));
  if (p.eventId) att = att.filter(function(a) { return String(a.eventId) === String(p.eventId); });
  return ok(att);
}

function markAttendance(p) {
  var auth = requireAuth(p, 'MEMBER');
  if (!auth.ok) return err(auth.error);
  var sheet = getSheet('Attendance');
  var records = sheetToObjects(sheet);
  var existing = records.find(function(a) {
    return String(a.eventId) === String(p.eventId) && String(a.memberId) === String(p.memberId);
  });
  if (existing) {
    var row = findRowById(sheet, existing.id);
    updateRow(sheet, row, { isPresent: p.isPresent === 'true' || p.isPresent === true, markedAt: getNowIST() });
  } else {
    appendRow(sheet, { id: genId(), eventId: p.eventId, memberId: p.memberId, isPresent: p.isPresent === 'true' || p.isPresent === true, markedAt: getNowIST() });
  }
  touchCache('Attendance');
  return ok({ message: 'Marked' });
}

function markAttendanceBulk(p) {
  var auth = requireAuth(p, 'ADMIN');
  if (!auth.ok) return err(auth.error);
  var eventId = p.eventId;
  var eventName = p.eventName || 'an event';
  var presentIds = [];
  var informedPriorIds = [];
  try { presentIds = JSON.parse(p.present || '[]'); } catch {}
  try { informedPriorIds = JSON.parse(p.informedPrior || '[]'); } catch {}

  var sheet = getSheet('Attendance');
  var existing = sheetToObjects(sheet);
  var allMembers = sheetToObjects(getSheet('Members')).filter(function(m) { return m.isActive; });
  var now = getNowIST();
  var marked = 0;

  allMembers.forEach(function(member) {
    var memberId = String(member.id);
    var status;
    if (presentIds.map(String).indexOf(memberId) >= 0) {
      status = 'Present';
    } else if (informedPriorIds.map(String).indexOf(memberId) >= 0) {
      status = 'InformedPrior';
    } else {
      status = 'Absent';
    }
    var isPresent = status === 'Present';
    var existingRec = existing.find(function(a) {
      return String(a.eventId) === String(eventId) && String(a.memberId) === memberId;
    });
    if (existingRec) {
      var row = findRowById(sheet, existingRec.id);
      updateRow(sheet, row, { isPresent: isPresent, status: status, markedAt: now });
    } else {
      appendRow(sheet, { id: genId(), eventId: eventId, memberId: memberId, isPresent: isPresent, status: status, markedAt: now });
    }
    marked++;
  });

  // Look up event date and team name for absence emails
  var absenceEventDate = '';
  try {
    var allEventsForAbsence = sheetToObjects(getSheet('Events'));
    var absenceEvent = allEventsForAbsence.find(function(e) { return String(e.id) === String(eventId); });
    if (absenceEvent && absenceEvent.date) {
      absenceEventDate = new Date(absenceEvent.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
    }
  } catch(e) {}
  var absenceTeamName = 'the team';
  try {
    var absenceSettings = sheetToObjects(getSheet('Settings'));
    var absenceTeamSetting = absenceSettings.find(function(s) { return s.key === 'teamName'; });
    if (absenceTeamSetting && absenceTeamSetting.value) absenceTeamName = absenceTeamSetting.value;
  } catch(e) {}
  var cleanEventName = (eventName || 'the event')
    .split('—')[0]
    .split('--')[0]
    .trim();

  // Send absence emails via GmailApp to absent members only
  allMembers.forEach(function(member) {
    var memberId = String(member.id);
    var isPresent = presentIds.map(String).indexOf(memberId) >= 0;
    var isInformed = informedPriorIds.map(String).indexOf(memberId) >= 0;
    if (!isPresent && !isInformed) {
      if (!member.email) return;
      var absentMemberName = member.name || '';
      var absenceSubject = 'We missed you '
        + (absentMemberName ? absentMemberName + ' ' : '')
        + 'at ' + cleanEventName
        + (absenceEventDate ? ' on ' + absenceEventDate : '');
      var absenceEmailHtml = buildAbsenceEmailHtml(absentMemberName, cleanEventName, absenceEventDate, absenceTeamName);
      try {
        GmailApp.sendEmail(member.email, absenceSubject, '', { htmlBody: absenceEmailHtml, name: 'CBC Worship Portal' });
      } catch(ex) { Logger.log('Absence email error for ' + member.email + ': ' + ex.message); }
    }
  });

  touchCache('Attendance');
  return ok({ success: true, marked: marked });
}

function buildAbsenceEmailHtml(memberName, cleanEventName, eventDate, teamName) {
  var salutation = memberName || 'there';
  var team = teamName || 'the team';
  var atWhen = cleanEventName || 'the event';
  if (eventDate) atWhen += ' on ' + eventDate;
  var p = function(text) {
    return '<p style="color:#f5f0e8;font-size:14px;line-height:1.8;margin:0 0 14px">' + text + '</p>';
  };
  var header = '<div style="background:#0f1b2d;padding:24px;text-align:center"><p style="font-family:serif;font-size:20px;color:#c9a84c;margin:0;font-weight:bold">CBC Thane Worship Portal</p></div>';
  var footer = '<div style="background:#0f1b2d;padding:12px;text-align:center"><p style="font-family:sans-serif;font-size:11px;color:#b8ae9e;margin:0">CBC Thane Worship Team · With love</p></div>';
  var body = p('Hey <strong>' + salutation + '</strong>,')
    + p('Just wanted to reach out. We noticed you were not with us at ' + atWhen + ', and honestly, you were missed.')
    + p('Hope everything is okay with you. If there is anything going on, we are here.')
    + p('Being part of this team means the world to all of us, and that includes you. We would love to see you next time. It is always better when you are around.')
    + p('With love,<br><strong>' + team + '</strong>');
  return '<div style="background:#1a2d45;max-width:560px;margin:0 auto;font-family:sans-serif">'
    + header
    + '<div style="padding:28px">' + body + '</div>'
    + footer + '</div>';
}

function getMemberAttendance(p) {
  var records = sheetToObjects(getSheet('Attendance')).filter(function(a) { return String(a.memberId) === String(p.memberId); });
  var threeMonthsAgo = new Date();
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
  var events = sheetToObjects(getSheet('Events')).filter(function(e) { return new Date(e.date) >= threeMonthsAgo; });
  var attended = records.filter(function(r) {
    var ev = events.find(function(e) { return String(e.id) === String(r.eventId); });
    return ev && (r.isPresent === true || r.isPresent === 'true' || r.isPresent === 'TRUE');
  }).length;
  var pct = events.length > 0 ? Math.round((attended / events.length) * 100) : 0;
  return ok({ records: records, pct: pct, total: events.length, attended: attended });
}

function exportAttendanceCSV(p) {
  var auth = requireAuth(p, 'ADMIN');
  if (!auth.ok) return err(auth.error);
  var events = sheetToObjects(getSheet('Events'));
  var membersAll = sheetToObjects(getSheet('Members'));
  var attendance = sheetToObjects(getSheet('Attendance'));

  function fmtDate(iso) {
    if (!iso) return '';
    try {
      var d = new Date(iso);
      var dd = ('0' + d.getDate()).slice(-2);
      var mm = ('0' + (d.getMonth() + 1)).slice(-2);
      var yyyy = d.getFullYear();
      return dd + '/' + mm + '/' + yyyy;
    } catch { return String(iso); }
  }

  function fmtDateTime(iso) {
    if (!iso) return '';
    try {
      var d = new Date(iso);
      var dd = ('0' + d.getDate()).slice(-2);
      var mm = ('0' + (d.getMonth() + 1)).slice(-2);
      var yyyy = d.getFullYear();
      var hh = ('0' + d.getHours()).slice(-2);
      var min = ('0' + d.getMinutes()).slice(-2);
      return dd + '/' + mm + '/' + yyyy + ' ' + hh + ':' + min;
    } catch { return String(iso); }
  }

  function statusLabel(rec) {
    if (!rec) return 'Absent';
    if (rec.status === 'Present' || rec.isPresent === true || rec.isPresent === 'true' || rec.isPresent === 'TRUE') return 'Present';
    if (rec.status === 'InformedPrior') return 'Absent With Prior Intimation';
    return 'Absent';
  }

  function csvEscape(val) {
    var s = String(val || '');
    if (s.indexOf(',') >= 0 || s.indexOf('"') >= 0 || s.indexOf('\n') >= 0) {
      return '"' + s.replace(/"/g, '""') + '"';
    }
    return s;
  }

  var headers = ['Event Name', 'Event Date', 'Member Name', 'Status', 'Date & Time Marked'];
  var rows = [];

  attendance.forEach(function(rec) {
    var event = events.find(function(e) { return String(e.id) === String(rec.eventId); });
    var member = membersAll.find(function(m) { return String(m.id) === String(rec.memberId); });
    rows.push([
      csvEscape(event ? event.type : ''),
      csvEscape(event ? fmtDate(event.date) : ''),
      csvEscape(member ? member.name : ''),
      csvEscape(statusLabel(rec)),
      csvEscape(rec.markedAt ? fmtDateTime(rec.markedAt) : ''),
    ]);
  });

  var csv = [headers.map(csvEscape).join(',')].concat(rows.map(function(r) { return r.join(','); })).join('\n');
  return ok({ csv: csv });
}

// ================================================================
// PRAYER PARTNERS
// ================================================================
function getPrayerPartners(p) {
  var auth = requireAuth(p, 'MEMBER');
  if (!auth.ok) return err(auth.error);
  var pairs = sheetToObjects(getSheet('PrayerPartners')).filter(function(p) { return p.isActive; });
  var members = sheetToObjects(getSheet('Members'));
  pairs.forEach(function(pair) {
    var m1 = members.find(function(m) { return String(m.id) === String(pair.member1Id); });
    var m2 = members.find(function(m) { return String(m.id) === String(pair.member2Id); });
    pair.member1Name = m1 ? m1.name : '';
    pair.member2Name = m2 ? m2.name : '';
    pair.member1Photo = m1 ? (m1.photoUrl || m1.photoBase64 || '') : '';
    pair.member2Photo = m2 ? (m2.photoUrl || m2.photoBase64 || '') : '';
    pair.member1Instrument = m1 ? m1.instrument : '';
    pair.member2Instrument = m2 ? m2.instrument : '';
    pair.member1Phone = m1 ? m1.phone : '';
    pair.member2Phone = m2 ? m2.phone : '';
  });
  return ok(pairs);
}

function setPrayerPartners(p) {
  var auth = requireAuth(p, 'ADMIN');
  if (!auth.ok) return err(auth.error);
  var sheet = getSheet('PrayerPartners');
  var pairs = JSON.parse(p.pairs);
  var season = p.season || 'Season';
  // Deactivate existing
  var existing = sheetToObjects(sheet);
  existing.forEach(function(pair, i) {
    if (pair.isActive) {
      var row = i + 2;
      updateRow(sheet, row, { isActive: false });
    }
  });
  // Add new
  pairs.forEach(function(pair) {
    appendRow(sheet, {
      id: genId(), member1Id: pair.member1Id, member2Id: pair.member2Id,
      season: season, pairedAt: getNowIST(), isActive: true
    });
    addNotification(pair.member1Id, 'partner', '💌 New Prayer Partner', 'You have a new prayer partner for ' + season, '/');
    addNotification(pair.member2Id, 'partner', '💌 New Prayer Partner', 'You have a new prayer partner for ' + season, '/');
  });
  touchCache('PrayerPartners');
  return ok({ message: 'Partners set' });
}

function autoPairMembers(p) {
  var auth = requireAuth(p, 'ADMIN');
  if (!auth.ok) return err(auth.error);
  var members = sheetToObjects(getSheet('Members')).filter(function(m) { return m.isActive; });
  var males = members.filter(function(m) { return m.gender === 'Male'; });
  var females = members.filter(function(m) { return m.gender === 'Female'; });
  function shuffle(arr) {
    for (var i = arr.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var temp = arr[i]; arr[i] = arr[j]; arr[j] = temp;
    }
    return arr;
  }
  shuffle(males); shuffle(females);
  var pairs = [];
  for (var i = 0; i + 1 < males.length; i += 2) {
    pairs.push({ member1Id: males[i].id, member2Id: males[i+1].id });
  }
  for (var j = 0; j + 1 < females.length; j += 2) {
    pairs.push({ member1Id: females[j].id, member2Id: females[j+1].id });
  }
  return ok(pairs);
}

// ================================================================
// FACILITATOR ROSTER
// ================================================================
function addMissingRosterColumns() {
  var sheet = getSheet('FacilitatorRoster');
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var required = ['memberName','assignedBy','notificationSent','reminderNotificationSent'];
  required.forEach(function(col) {
    if (headers.indexOf(col) === -1) {
      sheet.getRange(1, sheet.getLastColumn() + 1).setValue(col);
      Logger.log('addMissingRosterColumns: added ' + col + ' to FacilitatorRoster');
    }
  });
}

function getFacilitatorRoster(p) {
  var auth = requireAuth(p, 'MEMBER');
  if (!auth.ok) return err(auth.error);
  addMissingRosterColumns();
  var roster = sheetToObjects(getSheet('FacilitatorRoster'));
  roster = roster.map(function(slot) {
    if (slot.weekDate) {
      var d = new Date(slot.weekDate);
      var ist = new Date(d.getTime() + (5.5 * 60 * 60 * 1000));
      slot.weekDate = ist.toISOString().split('T')[0];
    }
    return slot;
  });
  return ok(roster);
}

function updateRosterSlot(p) {
  var auth = requireAuth(p, 'ADMIN');
  if (!auth.ok) return err(auth.error);
  addMissingRosterColumns();
  var sheet = getSheet('FacilitatorRoster');
  var roster = sheetToObjects(sheet);

  var memberNameToSave = '';
  var allMembersEarly = sheetToObjects(getSheet('Members'));
  var foundMember = allMembersEarly.find(function(m) { return String(m.id) === String(p.memberId); });
  if (foundMember) memberNameToSave = foundMember.name;

  var existing = roster.find(function(r) { return String(r.weekDate) === String(p.weekDate); });
  if (existing) {
    var row = findRowById(sheet, existing.id);
    updateRow(sheet, row, {
      memberId: p.memberId || '',
      memberName: memberNameToSave,
      weekDate: p.weekDate,
      notes: p.notes || '',
      assignedBy: p.assignedBy ? (allMembersEarly.find(function(m) { return String(m.id) === String(p.assignedBy); }) || {}).name || '' : '',
      notificationSent: false,
      reminderNotificationSent: false,
      reminderSent: false
    });
  } else {
    appendRow(sheet, {
      id: genId(),
      memberId: p.memberId,
      memberName: memberNameToSave,
      weekDate: p.weekDate,
      notes: p.notes || '',
      assignedBy: p.assignedBy ? (allMembersEarly.find(function(m) { return String(m.id) === String(p.assignedBy); }) || {}).name || '' : '',
      notificationSent: false,
      reminderNotificationSent: false,
      reminderSent: false
    });
  }

  // Get Zoom details from settings
  var settings = sheetToObjects(getSheet('Settings'));
  var zoomLink = (settings.find(function(s) { return s.key === 'zoomLink'; }) || {}).value || '';
  var zoomMeetingId = (settings.find(function(s) { return s.key === 'zoomMeetingId'; }) || {}).value || '';
  var zoomPasscode = (settings.find(function(s) { return s.key === 'zoomPasscode'; }) || {}).value || '';

  if (p.memberId) {
    var allMembers = sheetToObjects(getSheet('Members'));
    var assignedMember = allMembers.find(function(m) { return String(m.id) === String(p.memberId); });
    var assignedName = assignedMember ? assignedMember.name : 'A member';

    // Format date nicely
    var dateLabel = p.weekDate;
    try {
      var d = new Date(p.weekDate);
      dateLabel = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
    } catch(e) {}

    var zoomDetails = zoomLink
      ? 'Join: ' + zoomLink + '\nMeeting ID: ' + zoomMeetingId + '\nPasscode: ' + zoomPasscode
      : 'Zoom link not set yet.';

    // In-app + email to assigned member
    if (assignedMember) {
      addNotification(assignedMember.id, 'roster',
        '📅 Prayer Facilitator Assigned',
        'You have been assigned to facilitate prayer on ' + dateLabel + ' at 9:30pm IST.',
        '/roster');
      updateRow(sheet, row || findRowById(sheet, sheetToObjects(sheet)[sheetToObjects(sheet).length-1].id), { notificationSent: true });
      if (assignedMember.email) {
        sendRosterAssignmentEmail(assignedMember.email, assignedMember.name, {
          date: dateLabel,
          zoomLink: zoomLink,
          zoomMeetingId: zoomMeetingId,
          zoomPasscode: zoomPasscode,
          isAssignee: true
        });
      }
    }

    // In-app + email to the Prayer admin(s)
    var admins = getAdminMembers('PRAYER');
    admins.forEach(function(admin) {
      addNotification(admin.id, 'roster',
        '📅 Roster Updated',
        assignedName + ' has been assigned to facilitate prayer on ' + dateLabel,
        '/roster');
      if (admin.email) {
        sendRosterAssignmentEmail(admin.email, admin.name, {
          assigneeName: assignedName,
          date: dateLabel,
          zoomLink: zoomLink,
          zoomMeetingId: zoomMeetingId,
          zoomPasscode: zoomPasscode,
          isAssignee: false
        });
      }
    });
  }

  touchCache('FacilitatorRoster');
  return ok(sheetToObjects(sheet));
}

function sendRosterAssignmentEmail(toEmail, toName, d) {
  var subject = d.isAssignee
    ? 'You are facilitating Prayer on ' + d.date
    : d.assigneeName + ' assigned to facilitate Prayer on ' + d.date;
  var tdS = 'style="padding:8px 12px;color:#f5f0e8;font-size:13px;border-bottom:1px solid #2a4060"';
  var lS  = 'style="padding:8px 12px;color:#b8ae9e;font-size:13px;border-bottom:1px solid #2a4060"';
  var zoomCell = d.zoomLink
    ? '<a href="' + d.zoomLink + '" style="color:#4c8ce8;text-decoration:underline">Click here to join prayer</a>'
    : 'Not set';

  var rows = [
    ['Date', d.date],
    ['Time', '9:30pm IST'],
    ['Zoom', zoomCell],
  ];
  if (!d.isAssignee) rows.unshift(['Facilitator', d.assigneeName]);
  var tableRows = rows.map(function(r, i) {
    var bg = i % 2 === 0 ? '#1a2d45' : '#1f3552';
    return '<tr style="background:' + bg + '"><td ' + lS + '>' + r[0] + '</td><td ' + tdS + '>' + (r[1] || '—') + '</td></tr>';
  }).join('');
  var table = '<table style="width:100%;border-collapse:collapse;margin:16px 0">' + tableRows + '</table>';
  var note = '<p style="color:#b8ae9e;font-size:13px;margin:16px 0 0">In case of any clarification or information, reach out to Ruth or Joe immediately.</p>';
  var header = '<div style="background:#0f1b2d;padding:24px;text-align:center"><p style="font-family:serif;font-size:20px;color:#c9a84c;margin:0;font-weight:bold">CBC Thane Worship Portal</p></div>';
  var footer = '<div style="background:#0f1b2d;padding:12px;text-align:center"><p style="font-family:sans-serif;font-size:11px;color:#b8ae9e;margin:0">CBC Thane Worship Team</p></div>';
  var intro = d.isAssignee
    ? 'You have been assigned to facilitate the CBC Thane Worship Prayer Meeting.'
    : d.assigneeName + ' has been assigned to facilitate the prayer meeting.';
  var body = '<p style="color:#f5f0e8;font-size:14px;margin:0 0 12px">Hi <strong>' + toName + '</strong>,</p>'
    + '<p style="color:#b8ae9e;font-size:13px;margin:0 0 12px">' + intro + '</p>'
    + table + note;
  var html = '<div style="background:#1a2d45;max-width:600px;margin:0 auto;font-family:sans-serif">' + header + '<div style="padding:24px">' + body + '</div>' + footer + '</div>';
  try { GmailApp.sendEmail(toEmail, subject, '', { htmlBody: html, name: 'CBC Worship Portal' }); } catch(ex) { Logger.log('Roster email error: ' + ex.message); }
}

function sendMondayPrayerReminder() {
  var now = new Date();

  var settings = sheetToObjects(getSheet('Settings'));
  var zoomLink = (settings.find(function(s) { return s.key === 'zoomLink'; }) || {}).value || '';
  var zoomMeetingId = (settings.find(function(s) { return s.key === 'zoomMeetingId'; }) || {}).value || '';
  var zoomPasscode = (settings.find(function(s) { return s.key === 'zoomPasscode'; }) || {}).value || '';

  // Find today's roster slot
  var todayStr = now.toISOString().split('T')[0];
  var roster = sheetToObjects(getSheet('FacilitatorRoster'));
  var todaySlot = roster.find(function(r) { return String(r.weekDate) === todayStr; });
  var allMembers = sheetToObjects(getSheet('Members')).filter(function(m) { return m.isActive; });
  var facilitator = todaySlot && todaySlot.memberId
    ? allMembers.find(function(m) { return String(m.id) === String(todaySlot.memberId); })
    : null;
  var facilitatorName = facilitator ? facilitator.name : 'TBA';

  var title = '🙏 Prayer Meeting Tonight — 9:30pm IST';
  var body = 'Join us tonight at 9:30pm IST. Facilitator: ' + facilitatorName
    + (zoomLink ? ' | Zoom: ' + zoomLink : '');
  var emailSubject = 'Prayer Meeting Tonight — 9:30pm IST';
  var emailBody = 'Join us tonight for the CBC Thane Worship Prayer Meeting.\n\n'
    + 'Time: 9:30pm IST\n'
    + 'Facilitator: ' + facilitatorName + '\n'
    + (zoomLink ? 'Zoom Link: ' + zoomLink + '\nMeeting ID: ' + zoomMeetingId + '\nPasscode: ' + zoomPasscode : '');

  allMembers.forEach(function(m) {
    addNotification(m.id, 'roster', title, body, '/roster');
    if (m.email) {
      var html = buildSimpleEmail(m.name, emailBody);
      try { GmailApp.sendEmail(m.email, emailSubject, '', { htmlBody: html, name: 'CBC Worship Portal' }); } catch(ex) {}
    }
  });
}

function sendFridayFacilitatorReminder() {
  var now = new Date();
  // Find next Monday's date
  var nextMonday = new Date(now);
  var daysUntilMonday = (8 - now.getDay()) % 7 || 7;
  nextMonday.setDate(now.getDate() + daysUntilMonday);
  var nextMondayStr = nextMonday.toISOString().split('T')[0];

  var roster = sheetToObjects(getSheet('FacilitatorRoster'));
  var slot = roster.find(function(r) { return String(r.weekDate) === nextMondayStr; });
  if (!slot || !slot.memberId) return;

  var allMembers = sheetToObjects(getSheet('Members'));
  var facilitator = allMembers.find(function(m) { return String(m.id) === String(slot.memberId); });
  if (!facilitator || !facilitator.email) return;

  var settings = sheetToObjects(getSheet('Settings'));
  var zoomLink = (settings.find(function(s) { return s.key === 'zoomLink'; }) || {}).value || '';
  var zoomMeetingId = (settings.find(function(s) { return s.key === 'zoomMeetingId'; }) || {}).value || '';
  var zoomPasscode = (settings.find(function(s) { return s.key === 'zoomPasscode'; }) || {}).value || '';

  var dateLabel = nextMondayStr;
  try {
    var d = new Date(nextMonday);
    dateLabel = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
  } catch(e) {}

  var title = '📖 Prepare for Monday Prayer — ' + dateLabel;
  var bodyText = 'You are facilitating the Worship Prayer Meeting on ' + dateLabel + ' at 9:30pm IST. Please prayerfully prepare your prayer points in advance. Reach out to Ruth or Joe for any clarification.';

  addNotification(facilitator.id, 'roster', title, bodyText, '/roster');

  var emailText = bodyText + (zoomLink ? '\n\nZoom Link: ' + zoomLink + '\nMeeting ID: ' + zoomMeetingId + '\nPasscode: ' + zoomPasscode : '');
  var html = buildSimpleEmail(facilitator.name, emailText);
  try { GmailApp.sendEmail(facilitator.email, 'Prepare for Monday Prayer — ' + dateLabel, '', { htmlBody: html, name: 'CBC Worship Portal' }); } catch(ex) {}
}

// ================================================================
// BIRTHDAY NOTIFICATIONS TRIGGER
// TRIGGER: Time-driven, Day timer, between 8am–9am IST
// Setup: Apps Script > Triggers > sendMorningBirthdayNotifications
// ================================================================
function sendMorningBirthdayNotifications() {
  var now = new Date();
  var istNow = new Date(now.getTime() + 5.5 * 60 * 60 * 1000);
  var dd = String(istNow.getUTCDate()).padStart(2,'0');
  var mm = String(istNow.getUTCMonth()+1).padStart(2,'0');
  var todayDDMM = dd + '/' + mm;

  var members = sheetToObjects(getSheet('Members'))
    .filter(function(m) {
      return String(m.isActive).toLowerCase() !== 'false';
    });

  var birthdayMembers = members.filter(
    function(m) { return m.birthday === todayDDMM; }
  );

  if (birthdayMembers.length === 0) return;

  var names = birthdayMembers.map(
    function(m) { return m.name.split(' ')[0]; }
  );
  var nameStr = names.length === 1
    ? names[0]
    : names.length === 2
      ? names[0] + ' and ' + names[1]
      : names.slice(0,-1).join(', ') + ' and ' + names[names.length-1];

  var title = '🎂 ' + nameStr +
    (names.length === 1 ? "'s birthday" : "'s birthdays") + ' today!';
  var body = 'Open the app to leave a blessing on the Birthday Wall';

  members.forEach(function(m) {
    addNotification(m.id, 'birthday', title, body, '/birthdays');
  });
}

function buildSimpleEmail(toName, bodyText) {
  var header = '<div style="background:#0f1b2d;padding:24px;text-align:center"><p style="font-family:serif;font-size:20px;color:#c9a84c;margin:0;font-weight:bold">CBC Thane Worship Portal</p></div>';
  var footer = '<div style="background:#0f1b2d;padding:12px;text-align:center"><p style="font-family:sans-serif;font-size:11px;color:#b8ae9e;margin:0">CBC Thane Worship Team</p></div>';
  var lines = bodyText.split('\n').map(function(line) {
    return line.trim() ? '<p style="color:#f5f0e8;font-size:14px;line-height:1.7;margin:0 0 8px">' + line + '</p>' : '<br/>';
  }).join('');
  var body = '<p style="color:#f5f0e8;font-size:14px;margin:0 0 16px">Hi <strong>' + toName + '</strong>,</p>' + lines;
  return '<div style="background:#1a2d45;max-width:600px;margin:0 auto;font-family:sans-serif">' + header + '<div style="padding:24px">' + body + '</div>' + footer + '</div>';
}

// ================================================================
// AUDITION SUGGESTIONS
// ================================================================
function getAuditionSuggestions(p) {
  var auth = requireAuth(p, 'MEMBER');
  if (!auth.ok) return err(auth.error);
  return ok(sheetToObjects(getSheet('AuditionSuggestions')).sort(function(a,b) { return new Date(b.submittedAt) - new Date(a.submittedAt); }));
}

function createSuggestion(p) {
  var auth = requireAuth(p, 'MEMBER');
  if (!auth.ok) return err(auth.error);
  var submitterMemberId = p.submittedBy;
  var submitterMember = sheetToObjects(getSheet('Members')).filter(function(m) { return String(m.id) === String(p.submittedBy); })[0];
  p.submittedBy = submitterMember ? submitterMember.name : (p.submittedBy || 'Unknown');
  p.submittedByMemberId = submitterMemberId;
  p.id = genId();
  p.submittedAt = getNowIST();
  p.status = 'Following Up';
  p.adminResponse = '';
  p.respondedAt = '';
  appendRow(getSheet('AuditionSuggestions'), p);
  var admins = getAdminMembers('AUDITIONS');
  admins.forEach(function(admin) {
    addNotification(admin.id, 'audition', '🎵 New Talent Suggestion', p.suggestedName + ' — ' + p.skill + ' for ' + p.ministry, '/auditions');
    try { GmailApp.sendEmail(admin.email, buildEmailSubject('audition', { name: admin.name, suggestedName: p.suggestedName, skill: p.skill, ministry: p.ministry }), '', { htmlBody: buildEmailHtml('audition', { name: admin.name, suggestedName: p.suggestedName, skill: p.skill, ministry: p.ministry }), name: 'CBC Thane Worship' }); } catch(ex) { Logger.log('Email error: ' + ex.message); }
  });
  touchCache('AuditionSuggestions');
  return ok({ id: p.id });
}

function updateSuggestionStatus(p) {
  var auth = requireAuth(p, 'ADMIN');
  if (!auth.ok) return err(auth.error);
  var sheet = getSheet('AuditionSuggestions');
  var row = findRowById(sheet, p.id);
  if (row < 0) return err('Not found');
  updateRow(sheet, row, { status: p.status, adminResponse: p.adminResponse || '', respondedAt: getNowIST() });
  var suggestion = sheetToObjects(sheet).find(function(s) { return String(s.id) === String(p.id); });
  if (suggestion && suggestion.submittedByMemberId) {
    addNotification(suggestion.submittedByMemberId, 'audition', 'Update on your suggestion', 'Status changed to: ' + p.status, '/auditions');
  }
  touchCache('AuditionSuggestions');
  return ok({ message: 'Updated' });
}

// ================================================================
// NOTIFICATIONS
// ================================================================
function getNotifications(p) {
  var auth = requireAuth(p, 'MEMBER');
  if (!auth.ok) return err(auth.error);
  var thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  var notifs = sheetToObjects(getSheet('Notifications')).filter(function(n) {
    return String(n.memberId) === String(p.memberId) && n.createdAt > thirtyDaysAgo;
  }).sort(function(a,b) { return new Date(b.createdAt) - new Date(a.createdAt); });
  var settings = sheetToObjects(getSheet('Settings'));
  var timestamps = {};
  settings.forEach(function(s) {
    if (String(s.key).indexOf('cacheTs_') === 0) {
      timestamps[s.key] = s.value;
    }
  });
  return ok({ notifications: notifs, timestamps: timestamps });
}

function markNotificationsRead(p) {
  var auth = requireAuth(p, 'MEMBER');
  if (!auth.ok) return err(auth.error);
  var sheet = getSheet('Notifications');
  var notifs = sheetToObjects(sheet);
  if (p.all) {
    notifs.forEach(function(n, i) {
      if (String(n.memberId) === String(p.memberId) && !n.isRead) {
        updateRow(sheet, i + 2, { isRead: true });
      }
    });
  } else if (p.id) {
    var row = findRowById(sheet, p.id);
    if (row > 0) updateRow(sheet, row, { isRead: true });
  }
  return ok({ message: 'Marked read' });
}

function addNotification(memberId, type, title, body, linkTo) {
  appendRow(getSheet('Notifications'), {
    id: genId(), memberId: memberId, type: type, title: title,
    body: body, isRead: false, createdAt: getNowIST(), linkTo: linkTo || '/'
  });
  try {
    var member = sheetToObjects(getSheet('Members')).find(function(m) {
      return String(m.id) === String(memberId);
    });
    if (member && member.fcmToken) {
      sendPushNotification([member.fcmToken], title, body);
    }
  } catch(ex) { Logger.log('Push error: ' + ex.message); }
}

function notifyAllMembers(type, title, body, linkTo) {
  var members = sheetToObjects(getSheet('Members')).filter(function(m) { return m.isActive; });
  members.forEach(function(m) { addNotification(m.id, type, title, body, linkTo); });
}

// ================================================================
// BADGES
// ================================================================
function getBadges(p) {
  var auth = requireAuth(p, 'MEMBER');
  if (!auth.ok) return err(auth.error);
  var badges = sheetToObjects(getSheet('Badges'));
  if (p.memberId) badges = badges.filter(function(b) { return String(b.memberId) === String(p.memberId); });
  return ok(badges);
}

function awardBadge(p) {
  // NOTE: also called internally from completeOnboarding without a session token.
  // Guard is skipped when p.sessionToken is absent (internal call path).
  if (p.sessionToken) {
    var auth = requireAuth(p, 'ADMIN');
    if (!auth.ok) return err(auth.error);
  }
  var existing = sheetToObjects(getSheet('Badges')).find(function(b) {
    return String(b.memberId) === String(p.memberId) && String(b.badgeKey) === String(p.badgeKey);
  });
  if (existing) return ok({ message: 'Already awarded' });
  appendRow(getSheet('Badges'), {
    id: genId(), memberId: p.memberId, badgeKey: p.badgeKey,
    badgeName: p.badgeName, badgeEmoji: p.badgeEmoji,
    awardedAt: getNowIST(), isCustom: p.isCustom || false
  });
  addNotification(p.memberId, 'badge', p.badgeEmoji + ' Badge Earned: ' + p.badgeName, 'Congratulations! You\'ve earned the ' + p.badgeName + ' badge.', '/profile');
  return ok({ message: 'Badge awarded' });
}

// ================================================================
// V&M & QUIZ
// ================================================================
function getVMContent(p) {
  var settings = sheetToObjects(getSheet('Settings'));
  var result = {};
  settings.forEach(function(s) {
    if (s.key === 'vmVision') result.vision = s.value;
    if (s.key === 'vmMission') result.mission = s.value;
    if (s.key === 'vmValues') result.values = s.value;
  });
  return ok(result);
}

function updateVMContent(p) {
  var auth = requireAuth(p, 'SUPER_ADMIN');
  if (!auth.ok) return err(auth.error);
  var sheet = getSheet('Settings');
  var settings = sheetToObjects(sheet);
  ['vision','mission','values'].forEach(function(key) {
    if (p[key] === undefined) return;
    var settingsKey = 'vm' + key.charAt(0).toUpperCase() + key.slice(1);
    var existing = settings.find(function(s) { return s.key === settingsKey; });
    if (existing) {
      var row = findRowById(sheet, settingsKey);
      if (row > 0) updateRow(sheet, row, { value: p[key] });
      else { var r = settings.findIndex(function(s) { return s.key === settingsKey; }); if (r >= 0) sheet.getRange(r + 2, 2).setValue(p[key]); }
    } else {
      appendRow(sheet, { key: settingsKey, value: p[key] });
    }
  });
  return ok({ message: 'V&M updated' });
}

function getQuizQuestions(p) {
  var settings = sheetToObjects(getSheet('Settings'));
  var qs = settings.find(function(s) { return s.key === 'quizQuestions'; });
  if (!qs || !qs.value) return ok([]);
  try { return ok(JSON.parse(qs.value)); } catch { return ok([]); }
}

function addQuizQuestion(p) {
  var auth = requireAuth(p, 'SUPER_ADMIN');
  if (!auth.ok) return err(auth.error);
  var sheet = getSheet('Settings');
  var settings = sheetToObjects(sheet);
  var existing = settings.find(function(s) { return s.key === 'quizQuestions'; });
  var questions = [];
  if (existing && existing.value) { try { questions = JSON.parse(existing.value); } catch {} }
  questions.push({ id: genId(), question: p.question, options: JSON.parse(p.options || '[]'), correctIndex: parseInt(p.correctIndex) });
  var row = existing ? findRowByKey(sheet, 'quizQuestions') : -1;
  if (row > 0) { sheet.getRange(row, 2).setValue(JSON.stringify(questions)); }
  else { appendRow(sheet, { key: 'quizQuestions', value: JSON.stringify(questions) }); }
  return ok({ message: 'Question added' });
}

function deleteQuizQuestion(p) {
  var auth = requireAuth(p, 'SUPER_ADMIN');
  if (!auth.ok) return err(auth.error);
  var sheet = getSheet('Settings');
  var settings = sheetToObjects(sheet);
  var existing = settings.find(function(s) { return s.key === 'quizQuestions'; });
  if (!existing) return ok({ message: 'No questions' });
  var questions = [];
  try { questions = JSON.parse(existing.value); } catch {}
  questions = questions.filter(function(q) { return String(q.id) !== String(p.id); });
  var row = findRowByKey(sheet, 'quizQuestions');
  if (row > 0) sheet.getRange(row, 2).setValue(JSON.stringify(questions));
  return ok({ message: 'Deleted' });
}

function updateQuizQuestion(p) {
  var auth = requireAuth(p, 'SUPER_ADMIN');
  if (!auth.ok) return err(auth.error);
  var sheet = getSheet('Settings');
  var settings = sheetToObjects(sheet);
  var existing = settings.find(function(s) { return s.key === 'quizQuestions'; });
  if (!existing) return err('No questions found');
  var questions = [];
  try { questions = JSON.parse(existing.value); } catch {}
  questions = questions.map(function(q) {
    if (String(q.id) !== String(p.id)) return q;
    return {
      id: q.id,
      question: p.question !== undefined ? p.question : q.question,
      options: p.options !== undefined ? JSON.parse(p.options) : q.options,
      correctIndex: p.correctIndex !== undefined ? parseInt(p.correctIndex) : q.correctIndex,
    };
  });
  var row = findRowByKey(sheet, 'quizQuestions');
  if (row > 0) sheet.getRange(row, 2).setValue(JSON.stringify(questions));
  return ok({ message: 'Updated' });
}

function saveAllQuizQuestions(p) {
  var auth = requireAuth(p, 'SUPER_ADMIN');
  if (!auth.ok) return err(auth.error);
  var questions = [];
  try { questions = JSON.parse(p.questions || '[]'); } catch { return err('Invalid questions JSON'); }
  var sheet = getSheet('Settings');
  var row = findRowByKey(sheet, 'quizQuestions');
  if (row > 0) sheet.getRange(row, 2).setValue(JSON.stringify(questions));
  else appendRow(sheet, { key: 'quizQuestions', value: JSON.stringify(questions) });
  return ok({ message: 'All questions saved' });
}

function findRowByKey(sheet, key) {
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(key)) return i + 1;
  }
  return -1;
}

function recordVMReview(p) {
  var auth = requireAuth(p, 'MEMBER');
  if (!auth.ok) return err(auth.error);

  // Check if already signed — one-time only
  var existing = sheetToObjects(getSheet('VMReviews'))
    .filter(function(r) {
      return String(r.memberId) === String(p.memberId);
    });
  if (existing.length > 0) {
    return ok({
      message: 'Already signed',
      alreadySigned: true,
      signedAt: existing[0].completedAt
    });
  }

  var nowIst = getNowIST();
  appendRow(getSheet('VMReviews'), {
    id: genId(),
    memberId: p.memberId,
    completedAt: nowIst,
    score: 1,
    notes: 'Accepted'
  });
  return ok({ message: 'VM accepted', signedAt: nowIst });
}

function getVMReviewStatus(p) {
  var auth = requireAuth(p, 'MEMBER');
  if (!auth.ok) return err(auth.error);

  var reviews = sheetToObjects(getSheet('VMReviews'));

  if (p.memberId) {
    var myReview = reviews.find(function(r) {
      return String(r.memberId) === String(p.memberId);
    });
    return ok({
      hasSigned: !!myReview,
      signedAt: myReview ? myReview.completedAt : null
    });
  }

  // Admin call — return all signatories
  return ok({
    total: reviews.length,
    members: reviews.map(function(r) {
      return { memberId: r.memberId, signedAt: r.completedAt };
    })
  });
}

// ================================================================
// ONBOARDING
// ================================================================
function getOnboardingProgress(p) {
  var auth = requireAuth(p, 'MEMBER');
  if (!auth.ok) return err(auth.error);
  var prog = sheetToObjects(getSheet('OnboardingProgress')).filter(function(op) { return String(op.memberId) === String(p.memberId); });
  return ok(prog);
}

function updateOnboardingProgress(p) {
  var auth = requireAuth(p, 'MEMBER');
  if (!auth.ok) return err(auth.error);
  var sheet = getSheet('OnboardingProgress');
  var records = sheetToObjects(sheet);
  var existing = records.find(function(r) { return String(r.memberId) === String(p.memberId) && String(r.step) === String(p.step); });
  if (existing) {
    var row = findRowById(sheet, existing.id);
    updateRow(sheet, row, { isCompleted: p.isCompleted === 'true' || p.isCompleted === true, completedAt: getNowIST() });
  } else {
    appendRow(sheet, { id: genId(), memberId: p.memberId, step: p.step, isCompleted: p.isCompleted === 'true' || p.isCompleted === true, completedAt: getNowIST() });
  }
  return ok({ message: 'Updated' });
}

function getOnboardingChecklist(p) {
  var settings = sheetToObjects(getSheet('Settings'));
  var existing = settings.find(function(s) { return s.key === 'onboardingChecklist'; });
  if (!existing || !existing.value) {
    return ok([
      { id: 'attend_rehearsal', title: 'Attend your first rehearsal', description: 'Join the team for a Sunday rehearsal.', required: true },
      { id: 'meet_leader', title: 'Meet with worship leader', description: 'Schedule a brief 1-on-1 with the worship leader.', required: true },
      { id: 'join_group', title: 'Join team WhatsApp group', description: 'Get added to the team group for updates and coordination.', required: true },
      { id: 'read_handbook', title: 'Read the team handbook', description: 'Available from your worship leader.', required: false },
    ]);
  }
  try { return ok(JSON.parse(existing.value)); } catch { return ok([]); }
}

function addOnboardingItem(p) {
  var auth = requireAuth(p, 'SUPER_ADMIN');
  if (!auth.ok) return err(auth.error);
  var sheet = getSheet('Settings');
  var settings = sheetToObjects(sheet);
  var existing = settings.find(function(s) { return s.key === 'onboardingChecklist'; });
  var items = [];
  if (existing && existing.value) { try { items = JSON.parse(existing.value); } catch {} }
  items.push({ id: genId(), title: p.title, description: p.description || '', required: p.required === 'true' || p.required === true });
  var row = existing ? findRowByKey(sheet, 'onboardingChecklist') : -1;
  if (row > 0) sheet.getRange(row, 2).setValue(JSON.stringify(items));
  else appendRow(sheet, { key: 'onboardingChecklist', value: JSON.stringify(items) });
  return ok({ message: 'Item added' });
}

function updateOnboardingItem(p) {
  var auth = requireAuth(p, 'SUPER_ADMIN');
  if (!auth.ok) return err(auth.error);
  var sheet = getSheet('Settings');
  var settings = sheetToObjects(sheet);
  var existing = settings.find(function(s) { return s.key === 'onboardingChecklist'; });
  if (!existing) return err('No checklist found');
  var items = [];
  try { items = JSON.parse(existing.value); } catch {}
  items = items.map(function(item) {
    if (String(item.id) !== String(p.id)) return item;
    return { id: item.id, title: p.title !== undefined ? p.title : item.title, description: p.description !== undefined ? p.description : item.description, required: p.required !== undefined ? (p.required === 'true' || p.required === true) : item.required };
  });
  var row = findRowByKey(sheet, 'onboardingChecklist');
  if (row > 0) sheet.getRange(row, 2).setValue(JSON.stringify(items));
  return ok({ message: 'Item updated' });
}

function deleteOnboardingItem(p) {
  var auth = requireAuth(p, 'SUPER_ADMIN');
  if (!auth.ok) return err(auth.error);
  var sheet = getSheet('Settings');
  var settings = sheetToObjects(sheet);
  var existing = settings.find(function(s) { return s.key === 'onboardingChecklist'; });
  if (!existing) return ok({ message: 'Nothing to delete' });
  var items = [];
  try { items = JSON.parse(existing.value); } catch {}
  items = items.filter(function(item) { return String(item.id) !== String(p.id); });
  var row = findRowByKey(sheet, 'onboardingChecklist');
  if (row > 0) sheet.getRange(row, 2).setValue(JSON.stringify(items));
  return ok({ message: 'Item deleted' });
}

function reorderOnboardingItems(p) {
  var auth = requireAuth(p, 'SUPER_ADMIN');
  if (!auth.ok) return err(auth.error);
  var items = [];
  try { items = JSON.parse(p.items || '[]'); } catch { return err('Invalid items JSON'); }
  var sheet = getSheet('Settings');
  var row = findRowByKey(sheet, 'onboardingChecklist');
  if (row > 0) sheet.getRange(row, 2).setValue(JSON.stringify(items));
  else appendRow(sheet, { key: 'onboardingChecklist', value: JSON.stringify(items) });
  return ok({ message: 'Reordered' });
}

function completeOnboarding(p) {
  var auth = requireAuth(p, 'MEMBER');
  if (!auth.ok) return err(auth.error);
  var sheet = getSheet('Members');
  var row = findRowById(sheet, p.memberId);
  if (row < 0) return err('Member not found');
  var now = new Date();
  var nowIst = getNowIST();
  // Record initial VM review so dashboard shows green this month
  appendRow(getSheet('VMReviews'), {
    id: genId(), memberId: p.memberId, completedAt: nowIst,
    score: 100, month: now.getMonth() + 1, year: now.getFullYear()
  });
  updateRow(sheet, row, { isOnboarded: true, onboardingStep: 4, lastVMReview: nowIst });
  awardBadge({ memberId: p.memberId, badgeKey: 'onboarded', badgeName: 'Onboarded', badgeEmoji: '✅', isCustom: false });
  var admins = sheetToObjects(getSheet('Members')).filter(function(m) { return m.role === 'ADMIN' || m.role === 'SUPER_ADMIN'; });
  var member = sheetToObjects(sheet).find(function(m) { return String(m.id) === String(p.memberId); });
  admins.forEach(function(admin) {
    addNotification(admin.id, 'onboarding', '✅ Member Onboarded', (member ? member.name : 'A member') + ' has completed onboarding!', '/settings');
    try { GmailApp.sendEmail(admin.email, buildEmailSubject('onboarding', { name: admin.name, memberName: member ? member.name : 'A member' }), '', { htmlBody: buildEmailHtml('onboarding', { name: admin.name, memberName: member ? member.name : 'A member' }), name: 'CBC Thane Worship' }); } catch(ex) { Logger.log('Email error: ' + ex.message); }
  });
  return ok({ message: 'Onboarding complete' });
}

// ================================================================
// SETTINGS
// ================================================================
function getSettings(p) {
  var settings = sheetToObjects(getSheet('Settings'));
  if (p.key) {
    var s = settings.find(function(s) { return s.key === p.key; });
    return ok(s || null);
  }
  return ok(settings);
}

function getAllSettings(p) {
  var auth = requireAuth(p, 'SUPER_ADMIN');
  if (!auth.ok) return err(auth.error);
  var rows = sheetToObjects(getSheet('Settings'));
  rows = rows.map(function(row) {
    if (row.key === 'firebaseConfig') {
      return { key: row.key, value: '[protected — edit via Settings UI]' };
    }
    return row;
  });
  return ok(rows);
}

function updateSettings(p) {
  var auth = requireAuth(p, 'SUPER_ADMIN');
  if (!auth.ok) return err(auth.error);
  var sheet = getSheet('Settings');
  var row = findRowByKey(sheet, p.key);
  if (row > 0) sheet.getRange(row, 2).setValue(p.value);
  else appendRow(sheet, { key: p.key, value: p.value });
  return ok({ message: 'Saved' });
}

// ================================================================
// GOOGLE DRIVE STORAGE
// ================================================================
function initDriveFolders() {
  getDriveFolders();
}
function getOrCreateDriveFolder(name, parentId) {
  var parent = parentId ? DriveApp.getFolderById(parentId) : DriveApp.getRootFolder();
  var iter = parent.getFoldersByName(name);
  if (iter.hasNext()) return iter.next();
  return parent.createFolder(name);
}

function getDriveFolders() {
  var settings = getSheet('Settings');
  var rows = sheetToObjects(settings);
  function getSetting(key) {
    var r = rows.find(function(s) { return s.key === key; });
    return r ? String(r.value || '') : '';
  }
  function saveSetting(key, value) {
    var row = findRowByKey(settings, key);
    if (row > 0) settings.getRange(row, 2).setValue(value);
    else appendRow(settings, { key: key, value: value });
  }
  var profileId = getSetting('driveFolderProfilePhotos');
  var assetId   = getSetting('driveFolderAssetPhotos');
  var maintId   = getSetting('driveFolderMaintenancePhotos');
  if (profileId && assetId && maintId) {
    return { driveFolderProfilePhotos: profileId, driveFolderAssetPhotos: assetId, driveFolderMaintenancePhotos: maintId };
  }
  var root = getOrCreateDriveFolder('CBC Worship Portal');
  var rootId = root.getId();
  if (!profileId) {
    profileId = getOrCreateDriveFolder('Profile Photos', rootId).getId();
    saveSetting('driveFolderProfilePhotos', profileId);
  }
  if (!assetId) {
    assetId = getOrCreateDriveFolder('Asset Photos', rootId).getId();
    saveSetting('driveFolderAssetPhotos', assetId);
  }
  if (!maintId) {
    maintId = getOrCreateDriveFolder('Maintenance Photos', rootId).getId();
    saveSetting('driveFolderMaintenancePhotos', maintId);
  }
  return { driveFolderProfilePhotos: profileId, driveFolderAssetPhotos: assetId, driveFolderMaintenancePhotos: maintId };
}

// DEPRECATED — superseded by uploadToR2. Kept for rollback only.
function saveImageToDrive(base64, folderKey, fileName) {
  var cleanBase64 = base64.indexOf(',') !== -1 ? base64.split(',')[1] : base64;
  var folders = getDriveFolders();
  var folderId = folders[folderKey];
  if (!folderId) throw new Error('Drive folder not found for key: ' + folderKey);
  var bytes = Utilities.base64Decode(cleanBase64);
  var blob = Utilities.newBlob(bytes, 'image/jpeg', fileName);
  var folder = DriveApp.getFolderById(folderId);
  var existing = folder.getFilesByName(fileName);
  while (existing.hasNext()) { existing.next().setTrashed(true); }
  var file = folder.createFile(blob);
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  return 'https://drive.google.com/uc?export=view&id=' + file.getId();
}

// ================================================================
// CLOUDFLARE R2 UPLOAD — AWS Signature Version 4
// Credentials read from Script Properties:
//   R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY,
//   R2_BUCKET_NAME, R2_PUBLIC_URL
// Pure Apps Script — no external libraries.
// ================================================================
function uploadToR2(base64, fileName, contentType) {
  var props = PropertiesService.getScriptProperties().getProperties();
  var accountId  = props['R2_ACCOUNT_ID'];
  var accessKey  = props['R2_ACCESS_KEY_ID'];
  var secretKey  = props['R2_SECRET_ACCESS_KEY'];
  var bucketName = props['R2_BUCKET_NAME'];
  var publicUrl  = props['R2_PUBLIC_URL'];

  if (!accountId || !accessKey || !secretKey || !bucketName || !publicUrl) {
    throw new Error('R2 credentials not fully configured in Script Properties');
  }

  // Strip "data:image/jpeg;base64," prefix if present
  var cleanBase64 = base64.indexOf(',') !== -1 ? base64.split(',')[1] : base64;
  var imageBytes  = Utilities.base64Decode(cleanBase64);

  var host    = accountId + '.r2.cloudflarestorage.com';
  var path    = '/' + bucketName + '/' + fileName;
  var region  = 'auto';
  var service = 's3';

  var now       = new Date();
  var amzDate   = _r2FmtDate(now);          // "20240101T120000Z"
  var dateStamp = amzDate.substring(0, 8);  // "20240101"

  // SHA-256 hex of the binary payload
  var payloadHash = _r2Hex(
    Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, imageBytes)
  );

  // Canonical headers — must be lowercase and sorted alphabetically
  var canonicalHeaders =
    'content-type:' + contentType + '\n' +
    'host:' + host + '\n' +
    'x-amz-content-sha256:' + payloadHash + '\n' +
    'x-amz-date:' + amzDate + '\n';
  var signedHeaders = 'content-type;host;x-amz-content-sha256;x-amz-date';

  var canonicalRequest = [
    'PUT',
    path,
    '',   // no query string
    canonicalHeaders,
    signedHeaders,
    payloadHash
  ].join('\n');

  var credentialScope = dateStamp + '/' + region + '/' + service + '/aws4_request';
  var stringToSign = [
    'AWS4-HMAC-SHA256',
    amzDate,
    credentialScope,
    _r2Hex(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, canonicalRequest))
  ].join('\n');

  var signingKey = _r2SigningKey(secretKey, dateStamp, region, service);
  var signature  = _r2Hex(
    Utilities.computeHmacSha256Signature(
      Utilities.newBlob(stringToSign).getBytes(),
      signingKey
    )
  );

  var authorization =
    'AWS4-HMAC-SHA256 Credential=' + accessKey + '/' + credentialScope +
    ', SignedHeaders=' + signedHeaders +
    ', Signature=' + signature;

  var response = UrlFetchApp.fetch('https://' + host + path, {
    method: 'PUT',
    contentType: contentType,
    payload: imageBytes,
    headers: {
      'Authorization':          authorization,
      'x-amz-date':            amzDate,
      'x-amz-content-sha256':  payloadHash
    },
    muteHttpExceptions: true
  });

  var code = response.getResponseCode();
  if (code < 200 || code >= 300) {
    throw new Error('R2 upload failed (HTTP ' + code + '): ' + response.getContentText());
  }

  return publicUrl.replace(/\/$/, '') + '/' + fileName;
}

function _r2FmtDate(d) {
  return d.getUTCFullYear() +
    ('0' + (d.getUTCMonth() + 1)).slice(-2) +
    ('0' + d.getUTCDate()).slice(-2) + 'T' +
    ('0' + d.getUTCHours()).slice(-2) +
    ('0' + d.getUTCMinutes()).slice(-2) +
    ('0' + d.getUTCSeconds()).slice(-2) + 'Z';
}

function _r2Hex(bytes) {
  return bytes.map(function(b) {
    var h = (b & 0xFF).toString(16);
    return h.length === 1 ? '0' + h : h;
  }).join('');
}

function _r2SigningKey(secret, dateStamp, region, service) {
  var kSecret  = Utilities.newBlob('AWS4' + secret).getBytes();
  var kDate    = Utilities.computeHmacSha256Signature(Utilities.newBlob(dateStamp).getBytes(),    kSecret);
  var kRegion  = Utilities.computeHmacSha256Signature(Utilities.newBlob(region).getBytes(),       kDate);
  var kService = Utilities.computeHmacSha256Signature(Utilities.newBlob(service).getBytes(),      kRegion);
  var kSigning = Utilities.computeHmacSha256Signature(Utilities.newBlob('aws4_request').getBytes(), kService);
  return kSigning;
}

function testMaintenancePhotoUpload() {
  var tinyImage = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=';
  try {
    var url = uploadToR2(tinyImage, 'maintenance_test_' + Date.now(), 'image/jpeg');
    Logger.log('SUCCESS: ' + url);
  } catch (e) {
    Logger.log('FAILED: ' + e.message);
  }
}

// ================================================================
// DASHBOARD
// ================================================================
function getDashboard(p) {
  var auth = requireAuth(p, 'MEMBER');
  if (!auth.ok) return err(auth.error);
  var memberId = p.memberId;
  var now = new Date();
  var thisMonth = now.getMonth() + 1;
  var thisYear = now.getFullYear();

  var members = sheetToObjects(getSheet('Members')).filter(function(m) { return m.isActive; });
  var member = members.find(function(m) { return String(m.id) === String(memberId); });
  var role = member ? member.role : 'MEMBER';

  // VM Status
  var vmReviews = sheetToObjects(getSheet('VMReviews'));
  var myReview = vmReviews.find(function(r) {
    return String(r.memberId) === String(memberId);
  });
  var vmStatus = myReview ? 'done' : 'due';

  // Prayer partner
  var pairs = sheetToObjects(getSheet('PrayerPartners')).filter(function(p) { return p.isActive; });
  var myPair = pairs.find(function(p) { return String(p.member1Id) === String(memberId) || String(p.member2Id) === String(memberId); });
  var partnerId = null;
  if (myPair) partnerId = String(myPair.member1Id) === String(memberId) ? myPair.member2Id : myPair.member1Id;
  var partner = partnerId ? members.find(function(m) { return String(m.id) === String(partnerId); }) : null;
  if (partner) { partner.passwordHash = undefined; partner.sessionToken = undefined; }

  // Birthdays
  function daysUntil(ddmm) {
    if (!ddmm) return 999;
    var parts = ddmm.toString().split('/');
    var d = parseInt(parts[0]); var mo = parseInt(parts[1]);
    var year = now.getFullYear();
    var bday = new Date(year, mo - 1, d);
    if (bday < now) bday = new Date(year + 1, mo - 1, d);
    return Math.ceil((bday - now) / 86400000);
  }
  var birthdays = members.map(function(m) { return { id: m.id, name: m.name, instrument: m.instrument, birthday: m.birthday, daysUntil: daysUntil(m.birthday) }; })
    .filter(function(m) { return m.daysUntil <= 14; })
    .sort(function(a,b) { return a.daysUntil - b.daysUntil; });

  // Latest announcement
  var announcements = sheetToObjects(getSheet('Announcements')).sort(function(a,b) { return b.createdAt.localeCompare(a.createdAt); });
  var latestAnnouncement = announcements[0] || null;

  // Badges
  var badges = sheetToObjects(getSheet('Badges')).filter(function(b) { return String(b.memberId) === String(memberId); });

  // Attendance
  var attResult = getMemberAttendance({ memberId: memberId });
  var attData = JSON.parse(attResult.getContent()).data;
  var attendancePct = attData ? attData.pct : 0;

  var result = { vmStatus: vmStatus, prayerPartner: partner, partnerSeason: myPair ? myPair.season : '', upcomingBirthdays: birthdays, latestAnnouncement: latestAnnouncement, badges: badges, attendancePct: attendancePct };

  if (role === 'ADMIN' || role === 'SUPER_ADMIN') {
    var assets = sheetToObjects(getSheet('Assets'));
    var onboardedCount = members.filter(function(m) { return m.isOnboarded; }).length;
    var vmSigned = vmReviews.map(function(r) { return String(r.memberId); });
    var vmCompliancePct = members.length > 0 ? Math.round((vmSigned.length / members.length) * 100) : 0;
    var vmOverdue = members.filter(function(m) { return !vmSigned.includes(String(m.id)); }).map(function(m) { return { id: m.id, name: m.name }; });

    // Maintenance alerts
    var nowDate = now.getTime();
    var maintenanceAlerts = assets.filter(function(a) {
      if (!a.nextDueDate) return false;
      var due = new Date(a.nextDueDate).getTime();
      var diff = (due - nowDate) / 86400000;
      return diff <= 30;
    }).map(function(a) {
      var diff = (new Date(a.nextDueDate).getTime() - nowDate) / 86400000;
      return { assetId: a.id, assetName: a.name, nextDueDate: a.nextDueDate, overdue: diff < 0 };
    });

    // Roster
    var roster = sheetToObjects(getSheet('FacilitatorRoster'));
    var upcoming = roster.filter(function(r) { return new Date(r.weekDate) >= now; })
      .sort(function(a,b) { return new Date(a.weekDate) - new Date(b.weekDate); })
      .slice(0, 2);
    upcoming.forEach(function(slot) {
      var m = members.find(function(m) { return String(m.id) === String(slot.memberId); });
      slot.memberName = m ? m.name : 'Unassigned';
    });

    var pendingAuditions = sheetToObjects(getSheet('AuditionSuggestions')).filter(function(s) { return s.status === 'Following Up'; }).length;
    var assetsNeedingAttention = assets.filter(function(a) { return a.condition === 'Needs Repair'; }).length;

    Object.assign(result, {
      totalAssets: assets.length, assetsNeedingAttention: assetsNeedingAttention,
      totalMembers: members.length, onboardedPct: Math.round((onboardedCount / members.length) * 100),
      vmCompliancePct: vmCompliancePct, vmOverdue: vmOverdue,
      maintenanceAlerts: maintenanceAlerts, upcomingRoster: upcoming,
      pendingAuditions: pendingAuditions
    });
  }

  if (role === 'SUPER_ADMIN') {
    var lastBackup = sheetToObjects(getSheet('Settings')).find(function(s) { return s.key === 'lastBackupDate'; });
    result.lastBackupDate = lastBackup ? lastBackup.value : null;
  }

  return ok(result);
}

// ================================================================
// DATA MANAGEMENT
// ================================================================
function exportData(p) {
  var auth = requireAuth(p, 'SUPER_ADMIN');
  if (!auth.ok) return err(auth.error);
  var sheetNames = ['Members','Assets','MaintenanceLog','Announcements','PrayerRequests','AnsweredPrayers','Attendance','Events','PrayerPartners','FacilitatorRoster','AuditionSuggestions','Notifications','Badges','OnboardingProgress','VMReviews','Settings'];
  var data = {};
  sheetNames.forEach(function(name) {
    try { data[name] = sheetToObjects(getSheet(name)); } catch {}
  });
  updateSettings({ key: 'lastBackupDate', value: getNowIST() });
  return ok(data);
}

function importData(p) {
  var auth = requireAuth(p, 'SUPER_ADMIN');
  if (!auth.ok) return err(auth.error);
  var data = JSON.parse(p.data);
  Object.keys(data).forEach(function(sheetName) {
    try {
      var sheet = getSheet(sheetName);
      var lastRow = sheet.getLastRow();
      if (lastRow > 1) sheet.deleteRows(2, lastRow - 1);
      var rows = data[sheetName];
      var headers = getHeaders(sheet);
      rows.forEach(function(row) {
        var rowData = headers.map(function(h) { return row[h] !== undefined ? row[h] : ''; });
        sheet.appendRow(rowData);
      });
    } catch(ex) { Logger.log('Import error for ' + sheetName + ': ' + ex.message); }
  });
  return ok({ message: 'Import complete' });
}

function clearAllData(p) {
  var auth = requireAuth(p, 'SUPER_ADMIN');
  if (!auth.ok) return err(auth.error);
  var sheetNames = ['Members','Assets','MaintenanceLog','Announcements','PrayerRequests','AnsweredPrayers','Attendance','Events','PrayerPartners','FacilitatorRoster','AuditionSuggestions','Notifications','Badges','OnboardingProgress','VMReviews'];
  sheetNames.forEach(function(name) {
    try {
      var sheet = getSheet(name);
      var lastRow = sheet.getLastRow();
      if (lastRow > 1) sheet.deleteRows(2, lastRow - 1);
    } catch {}
  });
  var settingsSheet = getSheet('Settings');
  var lastRow = settingsSheet.getLastRow();
  if (lastRow > 1) settingsSheet.deleteRows(2, lastRow - 1);
  appendRow(settingsSheet, { key: 'setupComplete', value: 'false' });
  return ok({ message: 'All data cleared' });
}

// ================================================================
// EMAIL & PUSH (WRAPPER)
// ================================================================
function buildEmailSubject(templateType, params) {
  var subjects = {
    'welcome':       'WELCOME — CBC Thane Worship Portal',
    'passwordReset': 'PASSWORD RESET — Reset your CBC Worship Portal password',
    'maintenance':   'MAINTENANCE — Overdue: ' + (params.assetName || 'Asset'),
    'onboarding':    'ONBOARDING — ' + (params.memberName || 'A member') + ' has completed onboarding',
    'vm':            'VISION & MISSION — Monthly review due',
    'audition':      'TALENT SUGGESTION — ' + (params.suggestedName || ''),
  };
  return subjects[templateType] || null;
}

function buildEmailHtml(templateType, params) {
  var header = '<div style="background:#0f1b2d;padding:32px 24px 20px;text-align:center">'
    + '<p style="font-family:serif;font-size:22px;color:#c9a84c;margin:0;font-weight:bold">CBC Thane Worship Portal</p>'
    + '<div style="height:2px;background:linear-gradient(90deg,transparent,#c9a84c,transparent);margin:12px auto 0;width:80%"></div>'
    + '</div>';
  var footer = '<div style="background:#0f1b2d;padding:16px 24px;text-align:center">'
    + '<p style="font-family:sans-serif;font-size:11px;color:#b8ae9e;margin:0">CBC Thane Worship Team · Private Member Portal</p>'
    + '</div>';

  function wrap(bodyHtml) {
    return '<div style="background:#1a2d45;max-width:560px;margin:0 auto;border-radius:12px;overflow:hidden;font-family:sans-serif">'
      + header
      + '<div style="padding:28px 28px 24px;background:#1a2d45">' + bodyHtml + '</div>'
      + footer
      + '</div>';
  }

  function ctaButton(label, href) {
    return '<div style="text-align:center;margin:24px 0">'
      + '<a href="' + href + '" style="background:#c9a84c;color:#0f1b2d;font-weight:bold;padding:12px 28px;border-radius:8px;text-decoration:none;font-family:sans-serif;font-size:14px">'
      + label + '</a></div>';
  }

  function p(text) {
    return '<p style="color:#f5f0e8;font-size:14px;line-height:1.7;margin:0 0 12px">' + text + '</p>';
  }

  function muted(text) {
    return '<p style="color:#b8ae9e;font-size:13px;line-height:1.6;margin:0 0 10px">' + text + '</p>';
  }

  if (templateType === 'welcome') {
    return wrap(
      p('Hi <strong>' + (params.name || 'there') + '</strong>,')
      + p('Your account has been created for the CBC Thane Worship Team. Log in and complete your onboarding to get started.')
      + ctaButton('Open Portal', 'https://cbc-worship-portal.pages.dev')
      + muted('If you did not expect this email, please contact your worship team administrator.')
    );
  }

  if (templateType === 'passwordReset') {
    return wrap(
      p('Hi <strong>' + (params.name || 'there') + '</strong>,')
      + p('You requested a password reset for your CBC Worship Portal account.')
      + '<div style="background:#0f1b2d;border:1px solid #2a4060;border-radius:8px;padding:16px;margin:16px 0;text-align:center">'
      + '<p style="font-family:monospace;font-size:15px;color:#c9a84c;margin:0;letter-spacing:2px">' + (params.token || '') + '</p>'
      + '</div>'
      + ctaButton('Reset My Password', 'https://cbc-worship-portal.pages.dev/login?token=' + (params.token || ''))
      + muted('This link expires in 1 hour. If you did not request this, ignore this email.')
    );
  }

  if (templateType === 'maintenance') {
    return wrap(
      p('Hi <strong>' + (params.name || 'Admin') + '</strong>,')
      + p('A worship team asset has overdue maintenance:')
      + '<table style="width:100%;border-collapse:collapse;margin:16px 0">'
      + '<tr><td style="padding:8px 12px;color:#b8ae9e;font-size:13px;width:40%">Asset</td><td style="padding:8px 12px;color:#f5f0e8;font-size:13px">' + (params.assetName || '—') + '</td></tr>'
      + '<tr style="background:#0f1b2d"><td style="padding:8px 12px;color:#b8ae9e;font-size:13px">Due Date</td><td style="padding:8px 12px;color:#e85c5c;font-size:13px">' + (params.dueDate || '—') + '</td></tr>'
      + '<tr><td style="padding:8px 12px;color:#b8ae9e;font-size:13px">Type</td><td style="padding:8px 12px;color:#f5f0e8;font-size:13px">' + (params.maintenanceType || '—') + '</td></tr>'
      + '</table>'
      + ctaButton('View in Portal', 'https://cbc-worship-portal.pages.dev/assets')
    );
  }

  if (templateType === 'onboarding') {
    return wrap(
      p('Hi <strong>' + (params.name || 'Admin') + '</strong>,')
      + p('<strong style="color:#4caf82">' + (params.memberName || 'A member') + '</strong> has completed their onboarding for the CBC Thane Worship Team.')
      + '<div style="background:#0f1b2d;border-left:3px solid #4caf82;padding:12px 16px;border-radius:4px;margin:16px 0">'
      + '<p style="color:#4caf82;font-size:13px;margin:0">✓ Read V&M &nbsp;·&nbsp; ✓ Passed quiz &nbsp;·&nbsp; ✓ Confirmed commitment &nbsp;·&nbsp; ✓ Checklist done</p>'
      + '</div>'
      + ctaButton('View Member Profile', 'https://cbc-worship-portal.pages.dev/settings')
    );
  }

  if (templateType === 'vm') {
    return wrap(
      p('Hi <strong>' + (params.name || 'there') + '</strong>,')
      + p('Your monthly Vision & Mission review is due. It only takes a few minutes and keeps the whole team aligned in purpose.')
      + ctaButton('Complete V&M Review', 'https://cbc-worship-portal.pages.dev/vm')
      + muted('You can disable these reminders in your profile notification settings.')
    );
  }

  if (templateType === 'audition') {
    return wrap(
      p('Hi <strong>' + (params.name || 'Admin') + '</strong>,')
      + p('A team member has suggested a new talent for the worship team:')
      + '<table style="width:100%;border-collapse:collapse;margin:16px 0">'
      + '<tr><td style="padding:8px 12px;color:#b8ae9e;font-size:13px;width:40%">Name</td><td style="padding:8px 12px;color:#f5f0e8;font-size:13px">' + (params.suggestedName || '—') + '</td></tr>'
      + '<tr style="background:#0f1b2d"><td style="padding:8px 12px;color:#b8ae9e;font-size:13px">Skill</td><td style="padding:8px 12px;color:#f5f0e8;font-size:13px">' + (params.skill || '—') + '</td></tr>'
      + '<tr><td style="padding:8px 12px;color:#b8ae9e;font-size:13px">Ministry</td><td style="padding:8px 12px;color:#f5f0e8;font-size:13px">' + (params.ministry || '—') + '</td></tr>'
      + '</table>'
      + ctaButton('Review Suggestion', 'https://cbc-worship-portal.pages.dev/auditions')
    );
  }

  return null;
}

function getFirebaseAccessToken(serviceAccount) {
  var now = Math.floor(Date.now() / 1000);
  var header = Utilities.base64EncodeWebSafe(
    JSON.stringify({ alg: 'RS256', typ: 'JWT' })
  );
  var claim = Utilities.base64EncodeWebSafe(
    JSON.stringify({
      iss: serviceAccount.client_email,
      scope: 'https://www.googleapis.com/auth/firebase.messaging',
      aud: 'https://oauth2.googleapis.com/token',
      exp: now + 3600,
      iat: now
    })
  );
  var toSign = header + '.' + claim;
  var signature = Utilities.base64EncodeWebSafe(
    Utilities.computeRsaSha256Signature(
      toSign, serviceAccount.private_key
    )
  );
  var jwt = toSign + '.' + signature;
  var response = UrlFetchApp.fetch(
    'https://oauth2.googleapis.com/token', {
      method: 'POST',
      contentType: 'application/x-www-form-urlencoded',
      payload: 'grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=' + jwt
    }
  );
  return JSON.parse(response.getContentText()).access_token;
}

function sendPushNotification(tokens, title, body) {
  try {
    var settings = sheetToObjects(getSheet('Settings'));
    var fbSetting = settings.find(function(s) { return s.key === 'firebaseConfig'; });
    if (!fbSetting || !fbSetting.value) return;
    var serviceAccount = JSON.parse(fbSetting.value);
    if (!serviceAccount.project_id || !serviceAccount.private_key || !serviceAccount.client_email) return;
    var validTokens = (tokens || []).filter(Boolean);
    if (validTokens.length === 0) return;
    var accessToken = getFirebaseAccessToken(serviceAccount);
    var url = 'https://fcm.googleapis.com/v1/projects/' + serviceAccount.project_id + '/messages:send';
    validTokens.forEach(function(deviceToken) {
      try {
        var payload = {
          message: {
            token: deviceToken,
            notification: { title: title, body: body },
            webpush: {
              notification: {
                icon: '/icons/icon-192.png',
                badge: '/icons/icon-192.png',
                vibrate: [100, 50, 100]
              },
              fcm_options: { link: '/' }
            }
          }
        };
        var fcmResponse = UrlFetchApp.fetch(url, {
          method: 'POST',
          headers: { 'Authorization': 'Bearer ' + accessToken, 'Content-Type': 'application/json' },
          payload: JSON.stringify(payload),
          muteHttpExceptions: true
        });
        Logger.log('FCM status: ' + fcmResponse.getResponseCode());
        Logger.log('FCM response: ' + fcmResponse.getContentText());
      } catch(tokenEx) { Logger.log('FCM error for token ' + deviceToken + ': ' + tokenEx.message); }
    });
  } catch(ex) { Logger.log('FCM error: ' + ex.message); }
}
