"use strict";
const {
  getCurrentLevel,
  getModuleLabel,
  sortSubjects,
} = require("./utils/reports");

const getLevelsWithModules = async () => {
  const levels = await strapi.entityService.findMany("api::level.level", {
    populate: "*",
    paginate: {
      limit: -1,
    },
  });

  const levelsWithModules = await Promise.all(
    levels.map(async (level) => {
      if (!level.module) return level;
      const moduleWithCapabilities = await strapi.entityService.findOne(
        "api::module.module",
        level.module.id,
        {
          populate: ["capabilities"],
        }
      );

      return {
        ...level,
        module: moduleWithCapabilities,
      };
    })
  );
  return levelsWithModules;
};

const getPupilReport = async (
  pupilId,
  groupedSubjects,
  flattenedSubjects,
  levelsWithModules
) => {
  const pupil = await strapi.services["api::pupil.pupil"].findOne(pupilId, {
    populate: "*",
  });
  if (!pupil) {
    throw new Error("Pupil not found");
  }

  console.log("Generating pupil report for", pupil.name);

  const pupilSubjectReports = flattenedSubjects.map((subject) => {
    const filteredLevelsBySubject = levelsWithModules.filter((level) => {
      if (!level.subject) {
        return false;
      }
      return level.subject.id === subject.id;
    });

    const filteredLevelsByPupil = filteredLevelsBySubject.filter((level) => {
      if (!level.pupil) {
        return false;
      }
      return level.pupil.id === pupil.id;
    });
    const withModuleOrders = filteredLevelsByPupil.filter((level) => {
      return level.module && level.module.order && level.module.level;
    });

    const withLevelStatus = withModuleOrders.filter((level) => {
      return level.status;
    });

    const currentLevel = getCurrentLevel(withLevelStatus);
    if (currentLevel) {
      const score = getModuleLabel(currentLevel);
      return {
        id: subject.id,
        subject: subject,
        score,
      };
    }
    return {
      id: subject.id,
      subject: subject,
      score: 0,
    };
  });

  console.log("Generated pupil report for", pupil.name);
  return {
    id: pupilId,
    name: pupil?.name ?? "Alan",
    groupedSubjects,
    subjectReports: pupilSubjectReports,
  };
};

module.exports = {
  /**
   * An asynchronous register function that runs before
   * your application is initialized.
   *
   * This gives you an opportunity to extend code.
   */
  register({ strapi }) {
    const extensionService = strapi.service("plugin::graphql.extension");
    // Custom query resolver to get all authors and their details.
    extensionService.use(({ strapi }) => ({
      typeDefs: `
            type Query {
              pupilReport(pupilId: ID!): PupilReport
              groupReport(groupId: ID!, orgId: ID!): GroupReport
            }
    
            type PupilSubjectReport {
              id: ID
              subject: Subject
              score: Float
            }

            type ParentSubject {
              name: String
              isCore: Boolean
              subjects: [Subject]
            }
    
            type PupilReport {
              id: ID
              name: String              
              subjectReports: [PupilSubjectReport]
            }

            type GroupReport {
              id: ID
              name: String 
              groupedSubjects: [ParentSubject]
              pupils: [PupilReport]
            }
    
          `,

      resolvers: {
        Query: {
          pupilReport: {
            resolve: async (parent, { pupilId }, context) => {
              const subjects = await strapi.services[
                "api::subject.subject"
              ].find();
              if (!subjects) {
                throw new Error("Subjects not found");
              }
              const { groupedSubjects, flattenedSubjects } = sortSubjects(
                subjects.results
              );
              const levelsWithModules = getLevelsWithModules();
              return await getPupilReport(
                pupilId,
                groupedSubjects,
                flattenedSubjects,
                levelsWithModules
              );
            },
          },
          groupReport: {
            resolve: async (parent, { groupId, orgId }, context) => {
              const subjects = await strapi.services[
                "api::subject.subject"
              ].find();
              if (!subjects) {
                throw new Error("Subjects not found");
              }
              const { groupedSubjects, flattenedSubjects } = sortSubjects(
                subjects.results
              );

              const group = await strapi.services["api::group.group"].findOne(
                groupId,
                {
                  populate: ["pupils"],
                }
              );
              if (!group) {
                throw new Error("Group not found");
              }
              console.log(`Generating group report for ${group.name}`);

              if (group.orgId && group.orgId !== orgId) {
                throw new Error("Incorrect organisation for this group");
              }

              console.log("Getting levels");

              const levelsWithModules = await getLevelsWithModules();

              const pupilReports = group.pupils.map(async (pupil, i) => {
                console.log(
                  `Processing pupil ${pupil.id}, ${i + 1} of ${
                    group.pupils.length
                  }`
                );
                return await getPupilReport(
                  pupil.id,
                  groupedSubjects,
                  flattenedSubjects,
                  levelsWithModules
                );
              });

              return {
                id: groupId,
                name: group.name,
                groupedSubjects: groupedSubjects,
                pupils: pupilReports,
              };
            },
          },
        },
      },
    }));
  },

  /**
   * An asynchronous bootstrap function that runs before
   * your application gets started.
   *
   * This gives you an opportunity to set up your data model,
   * run jobs, or perform some special logic.
   */
  bootstrap(/*{ strapi }*/) {},
};
