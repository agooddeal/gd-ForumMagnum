import { isAnyTest, isIntegrationTest } from '@/lib/executionEnvironment';

export const collectionNameToTypeName = {
  AdvisorRequests: 'AdvisorRequest',
  ArbitalCaches: 'ArbitalCaches',
  ArbitalTagContentRels: 'ArbitalTagContentRel',
  Bans: 'Ban',
  Books: 'Book',
  Chapters: 'Chapter',
  CkEditorUserSessions: 'CkEditorUserSession',
  ClientIds: 'ClientId',
  Collections: 'Collection',
  CommentModeratorActions: 'CommentModeratorAction',
  Comments: 'Comment',
  Conversations: 'Conversation',
  CronHistories: 'CronHistory',
  CurationEmails: 'CurationEmail',
  CurationNotices: 'CurationNotice',
  DatabaseMetadata: 'DatabaseMetadata',
  DebouncerEvents: 'DebouncerEvents',
  DialogueChecks: 'DialogueCheck',
  DialogueMatchPreferences: 'DialogueMatchPreference',
  DigestPosts: 'DigestPost',
  Digests: 'Digest',
  ElectionCandidates: 'ElectionCandidate',
  ElectionVotes: 'ElectionVote',
  ElicitQuestionPredictions: 'ElicitQuestionPrediction',
  ElicitQuestions: 'ElicitQuestion',
  EmailTokens: 'EmailTokens',
  FeaturedResources: 'FeaturedResource',
  FieldChanges: 'FieldChange',
  ForumEvents: 'ForumEvent',
  GardenCodes: 'GardenCode',
  GoogleServiceAccountSessions: 'GoogleServiceAccountSession',
  Images: 'Images',
  JargonTerms: 'JargonTerm',
  LWEvents: 'LWEvent',
  LegacyData: 'LegacyData',
  LlmConversations: 'LlmConversation',
  LlmMessages: 'LlmMessage',
  Localgroups: 'Localgroup',
  ManifoldProbabilitiesCaches: 'ManifoldProbabilitiesCache',
  Messages: 'Message',
  Migrations: 'Migration',
  ModerationTemplates: 'ModerationTemplate',
  ModeratorActions: 'ModeratorAction',
  MultiDocuments: 'MultiDocument',
  Notifications: 'Notification',
  PageCache: 'PageCacheEntry',
  PetrovDayActions: 'PetrovDayAction',
  PetrovDayLaunchs: 'PetrovDayLaunch',
  PodcastEpisodes: 'PodcastEpisode',
  Podcasts: 'Podcast',
  PostEmbeddings: 'PostEmbedding',
  PostRecommendations: 'PostRecommendation',
  PostRelations: 'PostRelation',
  PostViewTimes: 'PostViewTime',
  PostViews: 'PostViews',
  Posts: 'Post',
  RSSFeeds: 'RSSFeed',
  ReadStatuses: 'ReadStatus',
  RecommendationsCaches: 'RecommendationsCache',
  Reports: 'Report',
  ReviewVotes: 'ReviewVote',
  ReviewWinnerArts: 'ReviewWinnerArt',
  ReviewWinners: 'ReviewWinner',
  Revisions: 'Revision',
  Sequences: 'Sequence',
  Sessions: 'Session',
  SideCommentCaches: 'SideCommentCache',
  SplashArtCoordinates: 'SplashArtCoordinate',
  Spotlights: 'Spotlight',
  Subscriptions: 'Subscription',
  SurveyQuestions: 'SurveyQuestion',
  SurveyResponses: 'SurveyResponse',
  SurveySchedules: 'SurveySchedule',
  Surveys: 'Survey',
  TagFlags: 'TagFlag',
  TagRels: 'TagRel',
  Tags: 'Tag',
  Tweets: 'Tweet',
  TypingIndicators: 'TypingIndicator',
  UltraFeedEvents: 'UltraFeedEvent',
  UserActivities: 'UserActivity',
  UserEAGDetails: 'UserEAGDetail',
  UserJobAds: 'UserJobAd',
  UserMostValuablePosts: 'UserMostValuablePost',
  UserRateLimits: 'UserRateLimit',
  UserTagRels: 'UserTagRel',
  Users: 'User',
  Votes: 'Vote',
} as const;

export const typeNameToCollectionName = {
  AdvisorRequest: 'AdvisorRequests',
  ArbitalCaches: 'ArbitalCaches',
  ArbitalTagContentRel: 'ArbitalTagContentRels',
  Ban: 'Bans',
  Book: 'Books',
  Chapter: 'Chapters',
  CkEditorUserSession: 'CkEditorUserSessions',
  ClientId: 'ClientIds',
  Collection: 'Collections',
  CommentModeratorAction: 'CommentModeratorActions',
  Comment: 'Comments',
  Conversation: 'Conversations',
  CronHistory: 'CronHistories',
  CurationEmail: 'CurationEmails',
  CurationNotice: 'CurationNotices',
  DatabaseMetadata: 'DatabaseMetadata',
  DebouncerEvents: 'DebouncerEvents',
  DialogueCheck: 'DialogueChecks',
  DialogueMatchPreference: 'DialogueMatchPreferences',
  DigestPost: 'DigestPosts',
  Digest: 'Digests',
  ElectionCandidate: 'ElectionCandidates',
  ElectionVote: 'ElectionVotes',
  ElicitQuestionPrediction: 'ElicitQuestionPredictions',
  ElicitQuestion: 'ElicitQuestions',
  EmailTokens: 'EmailTokens',
  FeaturedResource: 'FeaturedResources',
  FieldChange: 'FieldChanges',
  ForumEvent: 'ForumEvents',
  GardenCode: 'GardenCodes',
  GoogleServiceAccountSession: 'GoogleServiceAccountSessions',
  Images: 'Images',
  JargonTerm: 'JargonTerms',
  LWEvent: 'LWEvents',
  LegacyData: 'LegacyData',
  LlmConversation: 'LlmConversations',
  LlmMessage: 'LlmMessages',
  Localgroup: 'Localgroups',
  ManifoldProbabilitiesCache: 'ManifoldProbabilitiesCaches',
  Message: 'Messages',
  Migration: 'Migrations',
  ModerationTemplate: 'ModerationTemplates',
  ModeratorAction: 'ModeratorActions',
  MultiDocument: 'MultiDocuments',
  Notification: 'Notifications',
  PageCacheEntry: 'PageCache',
  PetrovDayAction: 'PetrovDayActions',
  PetrovDayLaunch: 'PetrovDayLaunchs',
  PodcastEpisode: 'PodcastEpisodes',
  Podcast: 'Podcasts',
  PostEmbedding: 'PostEmbeddings',
  PostRecommendation: 'PostRecommendations',
  PostRelation: 'PostRelations',
  PostViewTime: 'PostViewTimes',
  PostViews: 'PostViews',
  Post: 'Posts',
  RSSFeed: 'RSSFeeds',
  ReadStatus: 'ReadStatuses',
  RecommendationsCache: 'RecommendationsCaches',
  Report: 'Reports',
  ReviewVote: 'ReviewVotes',
  ReviewWinnerArt: 'ReviewWinnerArts',
  ReviewWinner: 'ReviewWinners',
  Revision: 'Revisions',
  Sequence: 'Sequences',
  Session: 'Sessions',
  SideCommentCache: 'SideCommentCaches',
  SplashArtCoordinate: 'SplashArtCoordinates',
  Spotlight: 'Spotlights',
  Subscription: 'Subscriptions',
  SurveyQuestion: 'SurveyQuestions',
  SurveyResponse: 'SurveyResponses',
  SurveySchedule: 'SurveySchedules',
  Survey: 'Surveys',
  TagFlag: 'TagFlags',
  TagRel: 'TagRels',
  Tag: 'Tags',
  Tweet: 'Tweets',
  TypingIndicator: 'TypingIndicators',
  UltraFeedEvent: 'UltraFeedEvents',
  UserActivity: 'UserActivities',
  UserEAGDetail: 'UserEAGDetails',
  UserJobAd: 'UserJobAds',
  UserMostValuablePost: 'UserMostValuablePosts',
  UserRateLimit: 'UserRateLimits',
  UserTagRel: 'UserTagRels',
  User: 'Users',
  Vote: 'Votes',
} as const;

export const tableNameToCollectionName = {
  advisorrequests: 'AdvisorRequests',
  arbitalcaches: 'ArbitalCaches',
  arbitaltagcontentrels: 'ArbitalTagContentRels',
  bans: 'Bans',
  books: 'Books',
  chapters: 'Chapters',
  ckeditorusersessions: 'CkEditorUserSessions',
  clientids: 'ClientIds',
  collections: 'Collections',
  commentmoderatoractions: 'CommentModeratorActions',
  comments: 'Comments',
  conversations: 'Conversations',
  cronhistories: 'CronHistories',
  curationemails: 'CurationEmails',
  curationnotices: 'CurationNotices',
  databasemetadata: 'DatabaseMetadata',
  debouncerevents: 'DebouncerEvents',
  dialoguechecks: 'DialogueChecks',
  dialoguematchpreferences: 'DialogueMatchPreferences',
  digestposts: 'DigestPosts',
  digests: 'Digests',
  electioncandidates: 'ElectionCandidates',
  electionvotes: 'ElectionVotes',
  elicitquestionpredictions: 'ElicitQuestionPredictions',
  elicitquestions: 'ElicitQuestions',
  emailtokens: 'EmailTokens',
  featuredresources: 'FeaturedResources',
  fieldchanges: 'FieldChanges',
  forumevents: 'ForumEvents',
  gardencodes: 'GardenCodes',
  googleserviceaccountsessions: 'GoogleServiceAccountSessions',
  images: 'Images',
  jargonterms: 'JargonTerms',
  lwevents: 'LWEvents',
  legacydata: 'LegacyData',
  llmconversations: 'LlmConversations',
  llmmessages: 'LlmMessages',
  localgroups: 'Localgroups',
  manifoldprobabilitiescaches: 'ManifoldProbabilitiesCaches',
  messages: 'Messages',
  migrations: 'Migrations',
  moderationtemplates: 'ModerationTemplates',
  moderatoractions: 'ModeratorActions',
  multidocuments: 'MultiDocuments',
  notifications: 'Notifications',
  pagecache: 'PageCache',
  petrovdayactions: 'PetrovDayActions',
  petrovdaylaunchs: 'PetrovDayLaunchs',
  podcastepisodes: 'PodcastEpisodes',
  podcasts: 'Podcasts',
  postembeddings: 'PostEmbeddings',
  postrecommendations: 'PostRecommendations',
  postrelations: 'PostRelations',
  postviewtimes: 'PostViewTimes',
  postviews: 'PostViews',
  posts: 'Posts',
  rssfeeds: 'RSSFeeds',
  readstatuses: 'ReadStatuses',
  recommendationscaches: 'RecommendationsCaches',
  reports: 'Reports',
  reviewvotes: 'ReviewVotes',
  reviewwinnerarts: 'ReviewWinnerArts',
  reviewwinners: 'ReviewWinners',
  revisions: 'Revisions',
  sequences: 'Sequences',
  sessions: 'Sessions',
  sidecommentcaches: 'SideCommentCaches',
  splashartcoordinates: 'SplashArtCoordinates',
  spotlights: 'Spotlights',
  subscriptions: 'Subscriptions',
  surveyquestions: 'SurveyQuestions',
  surveyresponses: 'SurveyResponses',
  surveyschedules: 'SurveySchedules',
  surveys: 'Surveys',
  tagflags: 'TagFlags',
  tagrels: 'TagRels',
  tags: 'Tags',
  tweets: 'Tweets',
  typingindicators: 'TypingIndicators',
  ultrafeedevents: 'UltraFeedEvents',
  useractivities: 'UserActivities',
  usereagdetails: 'UserEAGDetails',
  userjobads: 'UserJobAds',
  usermostvaluableposts: 'UserMostValuablePosts',
  userratelimits: 'UserRateLimits',
  usertagrels: 'UserTagRels',
  users: 'Users',
  votes: 'Votes',
  ...((isAnyTest && !isIntegrationTest) ? {
    testcollection: 'TestCollection',
    testcollection2: 'TestCollection2',
    testcollection3: 'TestCollection3',
    testcollection4: 'TestCollection4',
    testcollection5: 'TestCollection5',
  } : {}),
} as const;
