// Shared, profile-shape-agnostic helpers used by both the CV PDF (lib/pdf/cv.js)
// and the digital application page (lib/pages/appPage.js). Both used to
// hardcode Raffael's specific apprenticeship ("R. Nussbaum AG", experience id
// "nussbaum") directly in the template — which crashed for any other user
// whose profile has no such entry. This picks a sensible "headline education"
// entry generically, or returns null so callers can omit the section cleanly.
function getPrimaryEducation(profile) {
  const experience = (profile && profile.experience) || [];
  const apprenticeship = experience.find((e) => e.type === "lehre");
  if (apprenticeship) {
    return {
      title: apprenticeship.role || apprenticeship.org,
      org: apprenticeship.org,
      period: apprenticeship.period,
      note: apprenticeship.abschlussnote || null
    };
  }
  const education = (profile && profile.education) || [];
  const first = education[0];
  if (first) {
    return {
      title: first.org,
      org: null,
      period: first.period || null,
      note: first.note || null
    };
  }
  return null;
}

module.exports = { getPrimaryEducation };
