// Subjects

const byCoreSubjects = (a, b) => {
  const aNum = a.isCore ? "a" : "b";
  const bNum = b.isCore ? "a" : "b";
  return aNum.localeCompare(bNum);
};

const sortSubjects = (subjects) => {
  const normalSubjects = subjects
    .map((s) => (!s.isChildOf ? s : null))
    .filter((v) => v !== null);
  // Get all parent subjects (may change in Strapi)
  const parentSubjectsAll = subjects
    .map((subject) => subject.isChildOf)
    .filter((v) => v !== null);
  const parentSubjects = [...new Set(parentSubjectsAll)];
  const subjectsWithParents = parentSubjects.map((parent) => {
    const childSubjects = subjects
      .map((s) => (s.isChildOf === parent ? s : null))
      .filter((v) => v !== null);
    // Now sort childSubjects ensuring any isCore comes first
    childSubjects.sort(byCoreSubjects);
    return {
      name: parent,
      isCore: childSubjects[0].isCore,
      subjects: childSubjects,
    };
  });

  const rainbowAwards = {
    name: "Rainbow Awards",
    isCore: false,
    subjects: normalSubjects.filter((subject) => subject.isRainbowAward),
  };
  const remainingSubjects = {
    name: "Remaining subjects",
    isCore: false,
    subjects: normalSubjects.filter((subject) => !subject.isRainbowAward),
  };

  subjectsWithParents.sort((a, b) => a.name.localeCompare(b.name));

  subjects = [...subjectsWithParents, remainingSubjects, rainbowAwards];

  subjects.sort(byCoreSubjects);

  const flattenedSubjects = subjects
    .map((subject) => {
      return subject.subjects.map((s) => s);
    })
    .flat();
  return {
    groupedSubjects: subjects,
    flattenedSubjects: flattenedSubjects,
  };
};

function getPercentComplete(competencies, capabilities) {
  if (!competencies || !capabilities) return 0;
  const completeCompetencies = competencies.filter(
    (comp, i) => comp.status === "complete"
  );
  return parseInt((completeCompetencies.length / capabilities.length) * 100);
}

function calculateCompetenciesForThisLevel(allComps, capabilitiesToMatch) {
  if (allComps && allComps.length > 0 && capabilitiesToMatch) {
    const capString = JSON.stringify(capabilitiesToMatch);
    const competencies = allComps.filter((comp, i) =>
      capString.includes(comp.capability_fk)
    );
    return competencies;
  }
  return null;
}

function getPercentFromStatus(status) {
  return status === "emerging"
    ? 25
    : status === "developing"
    ? 60
    : status === "secure"
    ? 75
    : 100;
}

function sortLevelBy(items, level) {
  return items.sort((a, b) => {
    const aLevel = a.module.level === level ? "a" : "b";
    const bLevel = b.module.level === level ? "a" : "b";
    return aLevel.localeCompare(bLevel);
  });
}

function sortLevels(levels) {
  let sortedLevels = levels;
  sortedLevels = sortedLevels.sort((a, b) => a.module.order - b.module.order);
  sortedLevels = sortLevelBy(sortedLevels, "phase");
  sortedLevels = sortLevelBy(sortedLevels, "band");
  sortedLevels = sortLevelBy(sortedLevels, "stage");
  sortedLevels = sortLevelBy(sortedLevels, "step");
  return sortedLevels;
}

function getCurrentLevel(jumbledLevels) {
  const levels = sortLevels(jumbledLevels);
  // Get highest level with activity
  const activeLevels = levels.filter((level) => level.status);
  const level = activeLevels[activeLevels.length - 1]; // get last item

  if (
    level &&
    level.wasQuickAssessed === true &&
    level.status &&
    level.module
  ) {
    level["percentComplete"] = getPercentFromStatus(level.status);
  }

  if (level && level.status && !level.wasQuickAssessed && level.module) {
    const competencies = calculateCompetenciesForThisLevel(
      level.competencies,
      level.module.capabilities
    );
    level["percentComplete"] = getPercentComplete(
      competencies,
      level.module.capabilities
    );
  }

  return level;
}

function getNormalisedModuleNumber(level) {
  // turn from 1-6,1-6 to 1-12
  return level.module.level === "stage"
    ? level.module.order + 6
    : level.module.order;
}

function getModuleLabel(level) {
  // Below returns e.g. 1.45, 7.45
  let normalisedModuleNumber = getNormalisedModuleNumber(level);
  let label = `${normalisedModuleNumber}.${level.percentComplete}`;
  if (parseInt(level.percentComplete) === 100) {
    label = normalisedModuleNumber + 1; // round up to next level if at 100% complete
  }
  return label;
}

module.exports = {
  getCurrentLevel,
  getModuleLabel,
  sortSubjects,
};
