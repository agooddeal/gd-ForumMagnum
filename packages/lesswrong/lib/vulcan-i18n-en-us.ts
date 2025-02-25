import { preferredHeadingCase } from '../themes/forumTheme';

/**
 * Remnants of Vulcan's internationalization. Most of these are unused, but
 * it's tricky to figure out exactly which ones are used vs unused. If used,
 * these are used via formatMessage.
 */

export const i18nStrings: Partial<Record<string,string>> = {
  'forms.submit': 'Submit',
  'forms.cancel': 'Cancel',
  'forms.select_option': '-- select option --',
  'forms.delete': 'Delete',
  'forms.delete_confirm': 'Delete document?',
  'forms.revert': 'Revert',
  'forms.confirm_discard': 'Discard changes?',

  'users.profile': 'Profile',
  'users.complete_profile': preferredHeadingCase('Complete Your Profile'),
  'users.profile_completed': 'Profile completed.',
  'users.edit_account': preferredHeadingCase('Account Settings'),
  'users.edit_success': 'User “{name}” edited',
  'users.log_in': preferredHeadingCase('Log In'),
  'users.sign_up': preferredHeadingCase('Sign Up'),
  'users.sign_up_log_in': preferredHeadingCase('Sign Up/Log In'),
  'users.log_out': preferredHeadingCase('Log Out'),
  'users.bio': 'Bio',
  'users.displayName': preferredHeadingCase('Display Name'),
  'users.email': 'Email',
  'users.twitterUsername': preferredHeadingCase('Twitter Username'),
  'users.website': 'Website',
  'users.groups': 'Groups',
  'users.avatar': 'Avatar',
  'users.notifications': 'Notifications',
  'users.notifications_users': preferredHeadingCase('New Users Notifications'),
  'users.notifications_posts': preferredHeadingCase('New Posts Notifications'),
  'users.newsletter_subscribeToNewsletter': 'Subscribe to newsletter',
  'users.users_admin': 'Admin',
  'users.admin': 'Admin',
  'users.isAdmin': 'Admin',
  'users.posts': 'Posts',
  'users.upvoted_posts': preferredHeadingCase('Upvoted Posts'),
  'users.please_log_in': 'Please log in',
  'users.please_sign_up_log_in': 'Please sign up or log in',
  'users.cannot_post': 'Sorry, you do not have permission to post at this time',
  'users.cannot_comment': 'Sorry, you do not have permission to comment at this time',
  'users.subscribe': 'Subscribe to this user\'s posts',
  "users.unsubscribe": "Unsubscribe from this user's posts",
  'users.subscribed': `You have subscribed to this user's posts.`,
  'users.unsubscribed': `You have unsubscribed from this user's posts.`,
  'users.subscribers': 'Subscribers',
  'users.delete': 'Delete user',
  'users.delete_confirm': 'Delete this user?',
  'users.email_already_taken': 'This email is already taken: {value}',

  'settings': 'Settings',
  'settings.json_message': 'Note: settings already provided in your <code>settings.json</code> file will be disabled.',
  'settings.edit': preferredHeadingCase('Account Settings'),
  'settings.edited': 'Settings edited (please reload).',
  'settings.title': 'Title',
  'settings.siteUrl': 'Site URL',
  'settings.description': 'Description',
  'settings.siteImage': preferredHeadingCase('Site Image'),
  'settings.defaultEmail': preferredHeadingCase('Default Email'),
  'settings.scoreUpdate': preferredHeadingCase('Score Update'),
  'settings.postsPerPage': preferredHeadingCase('Posts Per Page'),
  'settings.twitterAccount': preferredHeadingCase('Twitter Account'),
  'settings.facebookPage': preferredHeadingCase('Facebook Page'),
  'settings.locale': 'Locale',
  'settings.requireViewInvite': preferredHeadingCase('Require View Invite'),
  'settings.requirePostInvite': preferredHeadingCase('Require Post Invite'),
  'settings.scoreUpdateInterval': preferredHeadingCase('Score Update Interval'),

  'app.loading': 'Loading…',
  'app.404': 'Sorry, we couldn\'t find what you were looking for.',
  'app.missing_document':  'Sorry, we couldn\'t find the document you were looking for.',
  'app.powered_by': 'Built with Vulcan.js',
  'app.or': 'Or',
  'app.noPermission': 'Sorry, you do not have the permission to do this at this time.',
  'app.operation_not_allowed': 'Sorry, you don\'t have the rights to perform the operation "{value}"',
  'app.document_not_found': 'Document not found (id: {value})',
  'app.disallowed_property_detected': 'Disallowed property detected: {value}',
  'app.something_bad_happened': 'Something bad happened...',
  'app.embedly_not_authorized': 'Invalid Embedly API key provided in the settings file. To find your key, log into https://app.embed.ly -> API',

  'cards.edit': 'Edit',
  'datatable.new': 'New',
  'datatable.edit': 'Edit',

  'admin': 'Admin',
  'notifications': 'Notifications',

  'errors.expectedType': 'Expected a field “{label}” of type {dataType}, got “{value}” instead.',
  'errors.required': 'Field “{label}” is required.',
  'errors.maxString': 'Field “{label}” is limited to {max} characters.',
  'errors.regEx': 'Field "{label}" is invalid.',

  'posts.new_post': preferredHeadingCase('New Post'),
  'posts.edit': 'Edit',
  'posts.edit_success': 'Post “{title}” edited.',
  'posts.delete': 'Delete',
  'posts.delete_confirm': 'Delete post “{title}”?',
  'posts.delete_success': 'Post “{title}” deleted.',
  'posts.title': 'Title',
  'posts.url': 'URL',
  'posts.categories': 'Categories',
  'posts.status': 'Status',
  'posts.sticky': 'Sticky',
  'posts.load_more': preferredHeadingCase('Load More'),
  'posts.load_more_days': preferredHeadingCase('Load More Days'),
  'posts.no_more': 'No more posts.',
  'posts.no_results': 'No posts to display.',
  'posts.search': 'Search',
  'posts.view': 'View',
  'posts.top': 'Top',
  'posts.new': 'New',
  'posts.best': 'Best',
  'posts.pending': 'Pending',
  'posts.rejected': 'Rejected',
  'posts.scheduled': 'Scheduled',
  'posts.daily': 'Daily',
  'posts.clear_thumbnail': 'Clear Thumbnail',
  'posts.clear_thumbnail?': 'Clear thumbnail?',
  'posts.enter_thumbnail_url': 'Enter URL',
  'posts.created_message': 'Post created.',
  'posts.rate_limit_error': 'Please wait {value} seconds before posting again.',
  'posts.sign_up_or_log_in_first': 'Please sign up or log in first.',
  'posts.postedAt': 'Posted at',
  'posts.dateNotDefined': 'Date not defined',
  'posts.subscribe': 'Subscribe',
  'posts.unsubscribe': 'Unsubscribe',
  'posts.subscribed': 'You have subscribed to “{name}” comments.',
  'posts.unsubscribed': 'You have unsubscribed from “{name}” comments.',
  'posts.subscribed_posts' : 'Posts subscribed to',
  'posts.link_already_posted': 'This link has already been posted.',
  'posts.max_per_day': 'Sorry you cannot submit more than {value} posts per day.',
  'posts.like': 'Like',

  'comments.comments': 'Comments',
  'comments.count': '{count, plural, =0 {No comments} one {# comment} other {# comments}}',
  'comments.count_0': 'No comments',
  'comments.count_1': '1 comment',
  'comments.count_2': '{count} comments',
  'comments.new': 'New Comment',
  'comments.no_comments': 'No comments to display.',
  'comments.reply': 'Reply',
  'comments.edit': 'Edit',
  'comments.delete': 'Delete',
  'comments.delete_confirm': 'Delete this comment?',
  'comments.delete_success': 'Comment deleted.',
  'comments.please_log_in': 'Please log in to comment.',
  'comments.parentCommentId': 'Parent Comment ID',
  'comments.topLevelCommentId': 'Top Level Comment ID',
  'comments.rate_limit_error': 'Please wait {value} seconds before commenting again.',

  'categories': 'Categories',
  'categories.all': 'All Categories',
  'categories.edit': 'Edit Category',
  'categories.edit_success': 'Category “{name}” edited.',
  'categories.new': 'New Category',
  'categories.new_success': 'Category “{name}” created.',
  'categories.delete': 'Delete Category',
  'categories.name': 'Name',
  'categories.description': 'Description',
  'categories.order': 'Order',
  'categories.slug': 'Slug',
  'categories.image': 'Image',
  'categories.parentId': 'Parent ID',
  'categories.subscribe': 'Subscribe to this category\'s posts',
  'categories.unsubscribe': 'Unsubscribe to this category\'s posts',
  'categories.subscribed': 'You have subscribed to “{name}” posts.',
  'categories.unsubscribed': 'You have unsubscribed from “{name}” posts.',
  'categories.subscribed_categories' : 'Categories subscribed to',
  'categories.delete_confirm': 'Delete category “{title}”?',
  'categories.delete_success': 'Category “{name}” deleted.',
  'categories.invalid': 'Invalid category',

  'admin.categories': 'Categories (admin)',
  'admin.users': 'Users (admin)',

  // LessWrong strings
  "posts.drafts": "My Drafts",
  "posts.all_drafts": "All Drafts",

  "Incorrect password": "Wrong password (If you've just come from LW 1.0 you'll need to reset your password, using the email address associated with your LW 1.0 account.)",
  "User not found": "User not found (Use the intercom if you think that user should exist already)",
  "User has no password set": "LW 1.0 account detected. Please reset your password with the link above",
  "Email already exists.": "Email already exists. If you have an LW 1.0 account, please reset your password with the link above",

  "moderation-easy-going": "Easy Going - I just delete obvious spam and trolling",
  "moderation-norm-enforcing": "Norm Enforcing - I try to enforce particular rules",
  "moderation-reign-of-terror": "Reign of Terror - I delete anything I judge to be annoying or counterproductive",
  "short-moderation-easy-going": " Easy Going",
  "short-moderation-norm-enforcing": " Norm Enforcing",
  "short-moderation-reign-of-terror": " Reign of Terror",

  "localgroups.subscribe": "Subscribe to group",
  "localgroups.unsubscribe": "Unsubscribe from group",
  "localgroups.subscribed": "Successfully subscribed to events & posts in this group",
  "localgroups.unsubscribed": "Successfully unsubscribed from events & posts in this group",
  "accounts.error_error_too_many_requests_please_slow_down_you_must_wait_8_seconds_before_trying_again":"Error, too many requests. Please slow down. You must wait 8 seconds before trying again.",
  "accounts.error_legacy_account_wrong_password": "Wrong password",
  "comments.author_has_banned_you": "This post's author has blocked you from commenting.",

  "alignment.comments.please_log_in": "Please log in to comment. (Commenting is limited to AI Alignment Forum members. Non-members should comment on LessWrong.com)",
  "alignment.remove_comment": "Comment and its children removed from AI Alignment Forum",
  "alignment.move_comment": "Comment and its parents moved to AI Alignment Forum",
  "alignment.suggest_comment": "Comment has been suggested for the AI Alignment Forum",
  "alignment.unsuggest_comment": "You are no longer suggesting this comment for AI Alignment Forum",

  "questions.comments.moved_to_answers": "Comment moved to the Answers section.",
  "questions.comments.moved_to_comments": "Answer moved to the Comments section.",
}
