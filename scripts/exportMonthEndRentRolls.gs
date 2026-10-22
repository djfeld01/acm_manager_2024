/**
 * Copies the month-end SiteLink rent roll (the last _rentRoll email received
 * on the last day of each month) from Gmail into a Drive folder.
 *
 * Paste into a new Apps Script project (script.google.com) signed in as
 * david@advantageconsultingmanagement.com, then run exportMonthEndRentRolls.
 * Safe to re-run: files already in the folder are skipped.
 */
const FOLDER_NAME = "RentRoll month-end";
const QUERY = "from:noreply@smdservers.net subject:_rentRoll filename:RentRoll";
const TZ = "America/New_York";

function exportMonthEndRentRolls() {
  const folder = getOrCreateFolder_(FOLDER_NAME);
  const existing = new Set();
  const files = folder.getFiles();
  while (files.hasNext()) existing.add(files.next().getName());

  // Latest month-end message per day, keyed by yyyy-MM-dd.
  const latestByDay = {};
  for (let start = 0; ; start += 100) {
    const threads = GmailApp.search(QUERY, start, 100);
    if (threads.length === 0) break;
    threads.forEach((thread) => {
      thread.getMessages().forEach((msg) => {
        const d = msg.getDate();
        if (!isLastDayOfMonth_(d)) return;
        const day = Utilities.formatDate(d, TZ, "yyyy-MM-dd");
        if (!latestByDay[day] || latestByDay[day].getDate() < d) {
          latestByDay[day] = msg;
        }
      });
    });
  }

  let saved = 0;
  Object.keys(latestByDay).sort().forEach((day) => {
    latestByDay[day].getAttachments().forEach((att) => {
      if (!/^RentRoll_.*\.xlsx$/i.test(att.getName())) return;
      const name = "RentRoll_" + day + ".xlsx";
      if (existing.has(name)) return;
      folder.createFile(att.copyBlob().setName(name));
      saved++;
    });
  });

  Logger.log(
    "Month-ends found: " + Object.keys(latestByDay).sort().join(", ") +
    "\nNew files saved: " + saved
  );
}

function isLastDayOfMonth_(d) {
  const today = Utilities.formatDate(d, TZ, "MM");
  const tomorrow = Utilities.formatDate(
    new Date(d.getTime() + 24 * 60 * 60 * 1000), TZ, "MM"
  );
  return today !== tomorrow;
}

function getOrCreateFolder_(name) {
  const it = DriveApp.getFoldersByName(name);
  return it.hasNext() ? it.next() : DriveApp.createFolder(name);
}
