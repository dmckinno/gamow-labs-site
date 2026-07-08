// Deploy this as a standalone Google Apps Script Web App. Each submission is added
// as a member of the Google Group newsletter@gamowlabs.com, via the Admin SDK
// Directory API. To send an update, just email newsletter@gamowlabs.com directly —
// no manual Bcc step needed.
//
// IMPORTANT: managing group membership requires Admin SDK access, which only works
// if the account that deploys this has Group management admin rights in the
// gamowlabs.com Workspace (Super Admin, or a custom role with the "Groups" ->
// "Read and manage" privilege). A regular Workspace member without admin rights
// will get a 403 when running authorize() below, regardless of the group's own
// settings.
//
// Setup:
//   1. script.google.com -> New project.
//   2. Delete the boilerplate, paste this file's contents in.
//   3. In the left sidebar, click "Services" (the + next to it), find
//      "Admin SDK API" in the list, and click "Add". This enables the
//      `AdminDirectory` object used below.
//   4. In the function dropdown next to "Run" (top toolbar), select "authorize",
//      then click Run. This is what actually triggers the permission prompt —
//      the Deploy dialog alone does not reliably ask for it.
//      Click through "Advanced -> Go to project -> Allow" (it's your own script).
//      If this fails with a 403/notAuthorized error, the deploying account does
//      not have Group admin rights in the Workspace — deploy from an account
//      that does instead.
//   5. Deploy -> New deployment -> type "Web app".
//      Execute as: Me. Who has access: Anyone.
//   6. Copy the resulting /exec URL into NEWSLETTER_ENDPOINT in blog.html.
//
// Note: depending on the group's settings, Google may send new members a welcome
// email automatically. Check newsletter@gamowlabs.com's settings in the Admin
// console / groups.google.com if you want to change that.

var GROUP_EMAIL = 'newsletter@gamowlabs.com';
var EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Run this once manually from the editor to trigger the OAuth consent screen
// before deploying. Safe to leave in place afterward.
function authorize() {
  AdminDirectory.Members.list(GROUP_EMAIL, { maxResults: 1 });
}

function doPost(e) {
  var email = ((e.parameter && e.parameter.email) || '').trim().toLowerCase();

  if (!EMAIL_PATTERN.test(email)) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: 'invalid email' }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  try {
    AdminDirectory.Members.insert({ email: email, role: 'MEMBER' }, GROUP_EMAIL);
  } catch (err) {
    // Already a member -> not an error from the submitter's point of view.
    if (String(err).indexOf('Member already exists') === -1) {
      return ContentService
        .createTextOutput(JSON.stringify({ ok: false, error: String(err) }))
        .setMimeType(ContentService.MimeType.JSON);
    }
  }

  return ContentService
    .createTextOutput(JSON.stringify({ ok: true }))
    .setMimeType(ContentService.MimeType.JSON);
}
