import { registerFragment } from "@/lib/vulcan-lib";

registerFragment(`
  fragment LlmConversationsFragment on LlmConversation {
    _id
    userId
    title
    createdAt
    lastUpdatedAt
    deleted
  }
`);

registerFragment(`
  fragment LlmConversationsViewingPageFragment on LlmConversation {
    ...LlmConversationsFragment
    approxWordCount
    user {
      ...UsersMinimumInfo
    }
  }
`)


registerFragment(`
  fragment LlmConversationsWithMessagesFragment on LlmConversation {
    ...LlmConversationsFragment
    messages {
      ...LlmMessagesFragment
    }
  }
`);
