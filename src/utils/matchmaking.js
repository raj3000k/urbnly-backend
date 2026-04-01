const PREFERENCE_WEIGHTS = {
  sleepSchedule: 18,
  cleanliness: 18,
  foodPreference: 12,
  socialStyle: 12,
  workMode: 10,
  budgetPreference: 15,
  sameCompany: 15,
};

const emptyPreferences = () => ({
  sleepSchedule: "",
  cleanliness: "",
  foodPreference: "",
  socialStyle: "",
  workMode: "",
  budgetPreference: "",
});

const normalizePreferences = (preferences) => {
  const safePreferences =
    preferences && typeof preferences === "object" ? preferences : {};

  return {
  sleepSchedule:
    typeof safePreferences.sleepSchedule === "string"
      ? safePreferences.sleepSchedule.trim()
      : "",
  cleanliness:
    typeof safePreferences.cleanliness === "string"
      ? safePreferences.cleanliness.trim()
      : "",
  foodPreference:
    typeof safePreferences.foodPreference === "string"
      ? safePreferences.foodPreference.trim()
      : "",
  socialStyle:
    typeof safePreferences.socialStyle === "string"
      ? safePreferences.socialStyle.trim()
      : "",
  workMode:
    typeof safePreferences.workMode === "string" ? safePreferences.workMode.trim() : "",
  budgetPreference:
    safePreferences.budgetPreference === "" || safePreferences.budgetPreference === null
      ? ""
      : String(safePreferences.budgetPreference || "").trim(),
  };
};

const budgetScore = (userBudget, candidateBudget) => {
  const userValue = Number(userBudget);
  const candidateValue = Number(candidateBudget);

  if (!Number.isFinite(userValue) || !Number.isFinite(candidateValue)) {
    return { points: 0, reason: "" };
  }

  const difference = Math.abs(userValue - candidateValue);

  if (difference <= 1000) {
    return { points: PREFERENCE_WEIGHTS.budgetPreference, reason: "similar budget comfort" };
  }

  if (difference <= 2500) {
    return {
      points: Math.round(PREFERENCE_WEIGHTS.budgetPreference * 0.65),
      reason: "compatible budget range",
    };
  }

  return { points: 0, reason: "" };
};

const exactMatch = (left, right, points, reason) => {
  if (!left || !right || left !== right) {
    return { points: 0, reason: "" };
  }

  return { points, reason };
};

const buildRoommateMatch = (currentUser, candidate) => {
  const currentPreferences = normalizePreferences(currentUser.preferences);
  const candidatePreferences = normalizePreferences(candidate.preferences);
  const reasons = [];
  let score = 0;

  const addMatch = (matchResult) => {
    if (matchResult.points > 0) {
      score += matchResult.points;
      if (matchResult.reason) {
        reasons.push(matchResult.reason);
      }
    }
  };

  addMatch(
    exactMatch(
      currentPreferences.sleepSchedule,
      candidatePreferences.sleepSchedule,
      PREFERENCE_WEIGHTS.sleepSchedule,
      "same sleep rhythm"
    )
  );
  addMatch(
    exactMatch(
      currentPreferences.cleanliness,
      candidatePreferences.cleanliness,
      PREFERENCE_WEIGHTS.cleanliness,
      "same cleanliness standards"
    )
  );
  addMatch(
    exactMatch(
      currentPreferences.foodPreference,
      candidatePreferences.foodPreference,
      PREFERENCE_WEIGHTS.foodPreference,
      "compatible food preference"
    )
  );
  addMatch(
    exactMatch(
      currentPreferences.socialStyle,
      candidatePreferences.socialStyle,
      PREFERENCE_WEIGHTS.socialStyle,
      "similar social energy"
    )
  );
  addMatch(
    exactMatch(
      currentPreferences.workMode,
      candidatePreferences.workMode,
      PREFERENCE_WEIGHTS.workMode,
      "aligned work routine"
    )
  );
  addMatch(
    budgetScore(
      currentPreferences.budgetPreference,
      candidatePreferences.budgetPreference
    )
  );

  if (
    currentUser.company &&
    candidate.company &&
    currentUser.company.trim().toLowerCase() === candidate.company.trim().toLowerCase()
  ) {
    addMatch({
      points: PREFERENCE_WEIGHTS.sameCompany,
      reason: "same company network",
    });
  }

  const scoreOutOf100 = Math.min(100, Math.round(score));

  let label = "Low fit";
  if (scoreOutOf100 >= 75) {
    label = "Great match";
  } else if (scoreOutOf100 >= 55) {
    label = "Strong match";
  } else if (scoreOutOf100 >= 35) {
    label = "Decent match";
  }

  return {
    userId: candidate.id,
    firstName: String(candidate.name || "").trim().split(/\s+/)[0] || "Member",
    company: candidate.company || "",
    currentPropertyId: candidate.currentPropertyId || "",
    lookingForRoommate: Boolean(candidate.lookingForRoommate),
    score: scoreOutOf100,
    label,
    reasons: reasons.slice(0, 3),
    preferences: candidatePreferences,
  };
};

module.exports = {
  emptyPreferences,
  normalizePreferences,
  buildRoommateMatch,
};
