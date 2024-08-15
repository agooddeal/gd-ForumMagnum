// Convention: Migration scripts (starting from when this migration
// infrastructure was put in place) live in this directory (server/migrations),
// and are named "YYYY-MM-DD-migrationDescription.js", with the date when the
// script was written.

// to run a migration, first start a server, 
// then execute the following in a terminal for each migration you wish to run:
// scripts/serverShellCommand.sh "Globals.migrations.nameOfMigration()"

import './2019-01-04-voteSchema';
import './2019-01-21-denormalizeVoteCount';
import './2019-01-24-karmaChangeSettings';
import './2019-01-30-migrateEditableFields'
import './2019-02-04-testCommentMigration'
import './2019-02-04-addSchemaVersionEverywhere'
import './2019-02-04-replaceObjectIdsInEditableFields'
import './2019-02-06-fixBigPosts'
import './2019-02-14-computeWordCounts'
import './2019-03-07-schemaMismatchFixes1'
import './2019-03-21-fixDeletedBios'
import './2019-04-10-confirmLegacyEmails'
import './2019-04-10-dropObsoleteColumns'
import './2019-04-10-legacyDataCollection'
import './2019-04-24-migrateLinkPosts'
import './2019-05-01-migrateSubscriptions'
import './2019-05-09-denormalizeReadStatus'
import './2019-05-14-fixCapitalizedSlugs'
import './2019-06-03-updateMessageCounts'
import './2019-06-13-renameAllPostsSorting'
import './2019-07-24-fixMaxBaseScore'
import './2019-07-25-setDefaultShortformValue'
import './2019-09-05-setDefaultGroupActiveStatus'
import './2019-10-10-generatePingbacks'
import './2019-10-23-setAFShortformValues'
import './2019-10-23-setDefaultNotificationValues'
import './2019-11-04-postsModifiedAtField'
import './2019-11-24-editableLatestRevision1';
import './2019-11-25-fixLegacyJoinDates'
import './2019-11-27-setDefaultSubscriptionTypes'
import './2019-11-30-setDefaultEventSubscriptionType'
import './2019-12-02-trivialMigration'
import './2019-12-05-generatePingbacksAgain'
import './2020-01-02-fillMissingRevisionFieldNames'
import './2020-02-23-maxCount'
import './2020-03-11-denormalizeTagRelevance'
import './2020-03-11-updateFrontpageFilterSettings'
import './2020-03-30-fixLostUnapprovedComments'
import './2020-04-20-adminOnlyTags'
import './2020-04-28-tagDefaultOrder'
import './2020-05-04-updateToCorrectTagDefault'
import './2020-05-05-addRevisionCollectionName'
import './2020-05-13-noIndexLowKarma'
import './2020-05-19-fillDefaultNoIndex'
import './2020-05-21-includedBackToDefault'
import './2020-05-22-deletedNotifications'
import './2020-06-08-clearOldPartiallyReadSequences'
import './2020-06-14-populateTagUser'
import './2020-06-22-directChildrenCount'
import './2020-07-23-defaultWikiGrade'
import './2020-08-09-metaToCommunity'
import './2020-09-08-onlineEvent'
import './2020-09-03-createWikiImportUsers'
import './2020-09-03-defaultWikiOnly'
import './2020-09-19-afVoteMigration'
import './2020-09-19-legacyKarmaMigration'
import './2020-09-19-updateCollectionScores'
import './2020-09-15-tagLastCommentedAt'
import './2020-09-15-revisionChangeMetrics'
import './2020-10-26-postDefaultDraft'
import './2020-11-12-guaranteedPostReviewer'
import './2020-12-04-nominationCount2019'
import './2021-04-28-populateCommentDescendentCounts';
import './2021-05-09-selfVoteOnTagRevisions';
import './2021-06-05-fillWikiEditCount'
import './2021-07-22-fixDuplicateEmails'
import './2021-08-13-postDefaultStickyPriority'
import './2021-08-22-importACXMeetups'
import './2021-08-23-defaultRSVPNotificationFill'
import './2021-08-23-fillEmailsFieldForOrganizers'
import './2021-10-05-fillRevisionDraftsField'
import './2021-11-27-fillReviewVoteCountField'
import './2021-11-29-fillPositiveReviewVoteCountField'
import './2021-12-02-fillHideFromAuthorPage'
import './2021-12-02-fillReviewCountField'
import './2021-12-13-updateQuadraticVotes'
import './2022-01-30-updateFinal2020ReviewVotes'
import './2022-02-21-populateLinkSharingKeys'
import './2022-03-10-oauthCleanup'
import './2022-03-31-defaultGroupAdminNotificationFill'
import './2022-05-20-ckEditorBioField'
import './2022-05-26-karmaInflationInit'
import './2022-06-02-updateCoauthorsSchema'
import './2022-06-30-migrateCommunityFilterSettings'
import './2022-07-07-allowMultipleVoteAuthors'
import './2022-07-07-removeVoteAuthorId'
import './2022-08-11-snoozeUntilContentCount'
import './2022-08-19-createPodcastsForPosts'
import './2022-08-22-defaultCommentIsPinnedOnProfileFill'
import './2022-08-31-recomputeWordCounts'
import './2022-09-08-defaultTagCommentType'
import './2022-09-08-giveAllCollectionsCreatedAt'
import './2022-09-21-petrov-button-reset'
import './2022-10-12-fillHasCoauthorPermission'
import './2022-10-18-fillSubforumNotificationsSettings'
import './2022-10-19-hydrateModeratorActions'
import './2022-10-25-fillUserTheme'
import './2022-11-08-rehostPostImages'
import './2022-11-28-populateApprovalVoteCount'
import './2022-12-02-updateSubforumNotificationDefaults'
import './2022-12-13-updateReviewVotes'
import './2022-12-15-addDadTagSettings'
import './2023-01-04-updateDefaultFrontpageTagFilterSettings'
import './2023-01-10-revertSubforumNotifSettings'
import './2023-01-13-createViewUpdater'
import './2023-01-18-user-mentions'
import './2023-03-16-createUserActivities'
import './2023-04-10-importACXmeetups'
import './2023-06-13-renameShortformToQuicktakes'
import './2023-07-28-viewUpdaterErrorHandling'
import './2023-08-25-importACXMeetups-23-fall'
import './2023-09-08-filterDebateResponses'
import './2023-10-25-widgetizeDialogueMessages'
import './2023-10-30-fixDialogueMessageContentWrappers'
import './2023-11-06-fillOptedInValues'
import './2023-11-07-importElicitPredictions'
import './2023-12-17-updateReviewVotes2023'
import './2023-12-22-send_yourTurn_notifications'
import './2024-01-22-backfillReviewWinners'
import './2024-02-09-setReviewWinnerCategories'
import './2024-02-29-markPrivateMessagesAsViewed'
import './2024-03-01-updateReviewWinnerSocialPreviewImages'
import './2024-03-06-backfillDefaultVotingSystem'
import './2024-03-19-importACXmeetups'
import './2024-05-09-fixUnsubmittedFrontpagePosts'
import './2024-05-13-assignRecommendationABTestsGroups'
import './2024-05-26-setNotNullClientIds'
import './2024-06-04-backfillUserFeedSubscriptions'
import './2024-06-05-rewriteOldReviewBotComments'
import './2024-06-10-messageResumeReadingUsers'
import './2024-06-17-assignSecondRecommendationTestGroup'
import './2024-07-11-updateShortformPostTitles'
import './2024-08-14-undraftPublicRevisions'
