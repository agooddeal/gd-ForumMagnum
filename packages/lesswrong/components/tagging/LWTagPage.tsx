import { useApolloClient } from "@apollo/client";
import classNames from 'classnames';
import React, { FC, Fragment, useCallback, useEffect, useRef, useState } from 'react';
import { AnalyticsContext, useTracking } from "../../lib/analyticsEvents";
import { userHasNewTagSubscriptions } from "../../lib/betas";
import { subscriptionTypes } from '../../lib/collections/subscriptions/schema';
import { tagGetHistoryUrl, tagGetUrl, tagMinimumKarmaPermissions, tagUserHasSufficientKarma } from '../../lib/collections/tags/helpers';
import { useMulti, UseMultiOptions } from '../../lib/crud/withMulti';
import { truncate } from '../../lib/editor/ellipsize';
import { Link } from '../../lib/reactRouterWrapper';
import { useLocation } from '../../lib/routeUtil';
import { useGlobalKeydown, useOnSearchHotkey } from '../common/withGlobalKeydown';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useCurrentUser } from '../common/withUser';
import { EditTagForm } from './EditTagPage';
import { taggingNameCapitalSetting, taggingNamePluralCapitalSetting, taggingNamePluralSetting } from '../../lib/instanceSettings';
import truncateTagDescription from "../../lib/utils/truncateTagDescription";
import { getTagStructuredData } from "./TagPageRouter";
import { isFriendlyUI } from "../../themes/forumTheme";
import DeferRender from "../common/DeferRender";
import { RelevanceLabel, tagPageHeaderStyles, tagPostTerms } from "./TagPageUtils";
import { useStyles, defineStyles } from "../hooks/useStyles";
import { HEADER_HEIGHT } from "../common/Header";
import { MAX_COLUMN_WIDTH } from "../posts/PostsPage/PostsPage";
import { DocumentContributorsInfo, DocumentContributorWithStats, MAIN_TAB_ID, TagLens, useTagLenses } from "@/lib/arbital/useTagLenses";
import { quickTakesTagsEnabledSetting } from "@/lib/publicSettings";
import { isClient } from "@/lib/executionEnvironment";
import qs from "qs";
import { useTagOrLens } from "../hooks/useTagOrLens";
import { useTagEditingRestricted } from "./TagPageButtonRow";
import { useMultiClickHandler } from "../hooks/useMultiClickHandler";
import HistoryIcon from '@material-ui/icons/History';
import { FieldsNotNull, filterWhereFieldsNotNull } from "@/lib/utils/typeGuardUtils";
import isEmpty from "lodash/isEmpty";
import { TagPageContext } from "./TagPageContext";
import type { ContentItemBody } from "../common/ContentItemBody";
import { useVote } from "../votes/withVote";
import { getVotingSystemByName } from "@/lib/voting/votingSystems";

const sidePaddingStyle = (theme: ThemeType) => ({
  paddingLeft: 42,
  paddingRight: 42,
  [theme.breakpoints.down('xs')]: {
    paddingLeft: '8px',
    paddingRight: '8px',
  },
})

const styles = defineStyles("LWTagPage", (theme: ThemeType) => ({
  rootGivenImage: {
    marginTop: 185,
    [theme.breakpoints.down('sm')]: {
      marginTop: 130,
    },
  },
  imageContainer: {
    width: '100%',
    '& > picture > img': {
      height: 300,
      objectFit: 'cover',
      width: '100%',
    },
    position: 'absolute',
    top: HEADER_HEIGHT,
    [theme.breakpoints.down('sm')]: {
      width: 'unset',
      '& > picture > img': {
        height: 200,
        width: '100%',
      },
      left: -4,
      right: -4,
    },
  },
  centralColumn: {
    marginLeft: "auto",
    marginRight: "auto",
    maxWidth: MAX_COLUMN_WIDTH,
    [theme.breakpoints.up('md')]: {
      paddingLeft: 42,
      paddingRight: 42,
    },
  },
  header: {
    paddingBottom: 5,
    ...sidePaddingStyle(theme),
    background: theme.palette.panelBackground.default,
    borderTopLeftRadius: theme.borderRadius.default,
    borderTopRightRadius: theme.borderRadius.default,
  },
  titleRow: {
    [theme.breakpoints.up('md')]: {
      display: 'flex',
      justifyContent: 'space-between',
    }
  },
  title: {
    ...theme.typography[isFriendlyUI ? "display2" : "display3"],
    ...theme.typography[isFriendlyUI ? "headerStyle" : "commentStyle"],
    marginTop: 0,
    fontWeight: isFriendlyUI ? 700 : 600,
    ...theme.typography.smallCaps,
    [theme.breakpoints.down('sm')]: {
      fontSize: '27px',
    },
  },
  notifyMeButton: {
    [theme.breakpoints.down('xs')]: {
      marginTop: 6,
    },
  },
  nonMobileButtonRow: {
    [theme.breakpoints.down('sm')]: {
      // Ensure this takes priority over the properties in TagPageButtonRow
      display: 'none !important',
    },
    position: 'absolute',
    top: 74,
    right: 8,
  },
  mobileButtonRow: {
    [theme.breakpoints.up('md')]: {
      display: 'none !important',
    },
    marginTop: 8,
    marginBottom: 8,
  },
  editMenu: {},
  wikiSection: {
    paddingTop: 5,
    ...sidePaddingStyle(theme),
    marginBottom: 24,
    background: theme.palette.panelBackground.default,
    borderBottomLeftRadius: theme.borderRadius.default,
    borderBottomRightRadius: theme.borderRadius.default,
  },
  subHeading: {
    ...sidePaddingStyle(theme),
    marginTop: -2,
    background: theme.palette.panelBackground.default,
    ...theme.typography.body2,
    ...theme.typography.postStyle,
  },
  subHeadingInner: {
    paddingTop: 2,
    paddingBottom: 2,
    borderTop: theme.palette.border.extraFaint,
    borderBottom: theme.palette.border.extraFaint,
  },
  relatedTag : {
    display: '-webkit-box',
    "-webkit-line-clamp": 2,
    "-webkit-box-orient": 'vertical',
    overflow: 'hidden',
    fontFamily: isFriendlyUI ? theme.palette.fonts.sansSerifStack : undefined,
  },
  relatedTagLink : {
    color: theme.palette.lwTertiary.dark
  },
  tagHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 8,
    ...theme.typography.body2,
    ...theme.typography.commentStyle,
  },
  postsTaggedTitle: {
    color: theme.palette.grey[600]
  },
  pastRevisionNotice: {
    ...theme.typography.commentStyle,
    fontStyle: 'italic'
  },
  nextLink: {
    ...theme.typography.commentStyle
  },
  description: {
    lineHeight: "21px",
    // These styles are for the hard-coded Bayes' Rule Guide multiple choice question and path description elements
    '& .question-container': {
      maxWidth: 800,
      margin: '20px auto',
    },
    '& .options': {
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
    },
    '& .option': {
      display: 'flex',
      alignItems: 'flex-start',
      gap: '8px',
      cursor: 'pointer',
      padding: 2,
      '& input': {
        marginTop: 3,
      },
    },
    '& .path-description': {
      backgroundColor: theme.palette.grey[140],
      padding: 20,
      marginTop: 20,
      borderRadius: theme.borderRadius.small * 1.5,
    },
  },
  contributorRow: {
    ...theme.typography.body1,
    color: theme.palette.grey[600],
    display: 'flex',
    flexDirection: 'column',
    fontSize: '17px',
    lineHeight: 'inherit',
    marginBottom: 8,
  },
  contributorNameWrapper: {
    flex: 1,
    [theme.breakpoints.down('sm')]: {
      fontSize: '15px',
    },
  },
  contributorName: {
    fontWeight: 550,
  },
  lastUpdated: {
    ...theme.typography.body2,
    color: theme.palette.grey[600],
    fontWeight: 550,
  },
  alternativeArrowIcon: {
    width: 16,
    height: 16,
  },
  rightColumn: {
    [theme.breakpoints.down('md')]: {
      display: 'none',
    },
    width: 300,
    '&:hover': {
      '& $rightColumnOverflowFade': {
        opacity: 0,
        pointerEvents: 'none',
      },
    },
    paddingRight: 30,
  },
  rightColumnContent: {},
  rightColumnOverflowFade: {
    position: "relative",
    zIndex: 2,
    height: 140,
    width: "100%",
    // background: `linear-gradient(0deg, 
    //   ${theme.palette.background.pageActiveAreaBackground} 30%,
    //   ${theme.palette.panelBackground.translucent} 70%,
    //   transparent 100%
    // )`,
    opacity: 1,
  },
  tocContributors: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    marginBottom: 12
  },
  tocContributor: {
    marginLeft: 16,
    fontFamily: theme.palette.fonts.sansSerifStack,
    color: theme.palette.greyAlpha(0.5),
  },
  unselectedEditForm: {
    display: 'none',
  },
  selectedEditForm: {
    display: 'block',
  },
  descriptionContainerEditing: {
    display: 'none',
  },
  contributorRatio: {},
  ...tagPageHeaderStyles(theme),
  revisionNotice: {
    ...theme.typography.body2,
    display: 'flex',
    alignItems: 'center',
    color: theme.palette.error.dark,
    fontWeight: 550,
    marginBottom: 16,
  },
  historyIcon: {
    height: 18,
    width: 18,
    marginRight: 4,
  },
}));

type ArbitalTagPageFragmentNames =
  | "TagPageWithArbitalContentFragment"
  | "TagPageRevisionWithArbitalContentFragment"
  | "TagPageWithArbitalContentAndLensRevisionFragment";

/**
 * If we're on the main tab (or on a tag without any lenses), we want to display the tag name.
 * Otherwise, we want to display the selected lens title.
 */
function useDisplayedTagTitle(tag: TagPageFragment | TagPageWithRevisionFragment | null, lenses: TagLens[], selectedLens?: TagLens) {
  if (!tag) return '';

  if (!selectedLens || selectedLens._id === 'main-tab' || lenses.length === 0) {
    return tag.name;
  }

  return selectedLens.title;
}

function useDisplayedContributors(contributorsInfo: DocumentContributorsInfo | null) {
  const contributors = filterWhereFieldsNotNull(contributorsInfo?.contributors ?? [], 'user');
  if (!contributors.some(({ currentAttributionCharCount }) => currentAttributionCharCount)) {
    return { topContributors: contributors, smallContributors: [] };
  }

  const totalAttributionChars = contributors.reduce((acc: number, contributor: DocumentContributorWithStats) => acc + (contributor.currentAttributionCharCount ?? 0), 0);

  if (totalAttributionChars === 0) {
    return { topContributors: contributors, smallContributors: [] };
  }

  const sortedContributors = [...contributors].sort((a, b) => (b.currentAttributionCharCount ?? 0) - (a.currentAttributionCharCount ?? 0));
  const initialTopContributors = sortedContributors.filter(({ currentAttributionCharCount }) => ((currentAttributionCharCount ?? 0) / totalAttributionChars) > 0.1);
  const topContributors = initialTopContributors.length <= 3 
    ? sortedContributors.filter(({ currentAttributionCharCount }) => ((currentAttributionCharCount ?? 0) / totalAttributionChars) > 0.05)
    : initialTopContributors;
  const smallContributors = sortedContributors.filter(contributor => !topContributors.includes(contributor));

  return { topContributors, smallContributors };
}

const PostsListHeading: FC<{
  tag: TagPageFragment|TagPageWithRevisionFragment,
  query: Record<string, string>,
}> = ({tag, query}) => {
  const classes = useStyles(styles);
  const {SectionTitle, PostsListSortDropdown} = Components;
  if (isFriendlyUI) {
    return (
      <>
        <SectionTitle title={`Posts tagged ${tag.name}`} />
        <div className={classes.postListMeta}>
          <PostsListSortDropdown value={query.sortedBy || "relevance"} />
          <div className={classes.relevance}>
            <RelevanceLabel />
          </div>
        </div>
      </>
    );
  }
  return (
    <div className={classes.tagHeader}>
      <div className={classes.postsTaggedTitle}>Posts tagged <em>{tag.name}</em></div>
      <PostsListSortDropdown value={query.sortedBy || "relevance"}/>
    </div>
  );
}

const EditLensForm = ({lens, successCallback, changeCallback, cancelCallback}: {
  lens: TagLens,
  successCallback: () => Promise<void>,
  changeCallback: () => void,
  cancelCallback: () => void,
}) => {
  const { WrappedSmartForm } = Components;
  const [mountKey, setMountKey] = useState(0);

  return <WrappedSmartForm
    key={lens._id + mountKey}
    collectionName="MultiDocuments"
    documentId={lens._id}
    queryFragmentName="MultiDocumentEdit"
    mutationFragmentName="MultiDocumentEdit"
    {...(lens.originalLensDocument ? { prefetchedDocument: lens.originalLensDocument } : {})}
    addFields={['summaries']}
    warnUnsavedChanges={true}
    successCallback={() => successCallback().then(() => setMountKey(mountKey + 1))}
    changeCallback={changeCallback}
    cancelCallback={cancelCallback}
  />
}

const pathDescriptions = {
  basic_theoretical: {
    content: `
        <p>Your path will teach you the basic odds form of Bayes' rule at a reasonable pace. It will contain 3 pages:</p>
        <ul>
            <li>Frequency diagrams: A first look at Bayes</li>
            <li>Waterfall diagrams and relative odds</li>
            <li>Introduction to Bayes' rule: Odds form</li>
        </ul>
    `,
    pathId: "62c",
  },
  quick: {
    content: `
        <p>No time to waste! Let's plunge directly into <a href="/w/693">a single-page abbreviated introduction to Bayes' rule</a>.</p>
    `,
    // pathId: "693",
    pathId: null,
  },
  theoretical: {
    content: `
        <p>Your path will teach you the basic odds form of Bayes' rule at a reasonable pace and then delve into the deep mysteries of the Bayes' Rule! Your path will contain 8 pages:</p>
        <ul>
            <li>Frequency diagrams: A first look at Bayes</li>
            <li>Waterfall diagrams and relative odds</li>
            <li>Introduction to Bayes' rule: Odds form</li>
            <li>Belief revision as probability elimination</li>
            <li>Extraordinary claims require extraordinary evidence</li>
            <li>Ordinary claims require ordinary evidence</li>
            <li>Shift towards the hypothesis of least surprise</li>
            <li>Bayesian view of scientific virtues</li>
        </ul>
    `,
    pathId: "62f",
  },
  deep: {
    content: `
        <p>Your path will go over all forms of Bayes' Rule, along with developing deep appreciation for its scientific usefulness. Your path will contain 12 pages:</p>
        <ul>
            <li>Frequency diagrams: A first look at Bayes</li>
            <li>Waterfall diagrams and relative odds</li>
            <li>Introduction to Bayes' rule: Odds form</li>
            <li>Bayes' rule: Proportional form</li>
            <li>Extraordinary claims require extraordinary evidence</li>
            <li>Ordinary claims require ordinary evidence</li>
            <li>Bayes' rule: Log-odds form</li>
            <li>Shift towards the hypothesis of least surprise</li>
            <li>Bayes' rule: Vector form</li>
            <li>Belief revision as probability elimination</li>
            <li>Bayes' rule: Probability form</li>
            <li>Bayesian view of scientific virtues</li>
        </ul>
    `,
    pathId: "61b",
  },
};


let currentPathId: string | null = null;

function startPath() {
  if (currentPathId) {
    window.location.href = tagGetUrl({slug: currentPathId}) + `/?startPath`;
  }
}

function handleRadioChange(radio: HTMLInputElement) {
  const wants = radio.dataset.wants?.split(",") || [];
  const notWants = radio.dataset.notWants?.split(",") || [];

  let pathKey;
  if (wants.includes("62d") && wants.includes("62f")) {
    pathKey = "deep";
  } else if (wants.includes("62d") && notWants.includes("62f")) {
    pathKey = "quick";
  } else if (wants.includes("62f") && notWants.includes("62d")) {
    pathKey = "theoretical";
  } else {
    pathKey = "basic_theoretical";
  }

  const pathDescription = document.getElementById("pathDescription");
  const content = pathDescription?.querySelector(".content");
  const startButton = pathDescription?.querySelector(".start-reading") as HTMLElement;

  if (content) {
    content.innerHTML = pathDescriptions[pathKey as keyof typeof pathDescriptions].content;
  }
  currentPathId = pathDescriptions[pathKey as keyof typeof pathDescriptions].pathId;

  if (pathDescription) {
    pathDescription.style.display = "block";
  }
  if (startButton) {
    if (currentPathId) {
      startButton.style.display = "block";
    } else {
      startButton.style.display = "none";
    }
  }
}

function initializeRadioHandlers() {
  const cleanupFunctions: (() => void)[] = [];
  const radioElements = Array.from(document.querySelectorAll('input[name="preference"]'));
  radioElements.forEach((radio: HTMLInputElement) => {
    const listenerFunction = function() {
      handleRadioChange(radio);
    }
    radio.addEventListener("change", listenerFunction);
    cleanupFunctions.push(() => radio.removeEventListener("change", listenerFunction));
  });

  const checkedRadio = document.querySelector('input[name="preference"]:checked') as HTMLInputElement|null;
  if (checkedRadio) {
    handleRadioChange(checkedRadio);
  }

  return () => cleanupFunctions.forEach((cleanup) => cleanup());
}

if (isClient) {
  Object.assign(window, { startPath });
  Object.assign(window, { handleRadioChange });
}

const ContributorsList = ({ contributors, onHoverContributor, endWithComma }: { contributors: FieldsNotNull<DocumentContributorWithStats, 'user'>[], onHoverContributor: (userId: string | null) => void, endWithComma: boolean }) => {
  const { UsersNameDisplay } = Components;
  const classes = useStyles(styles);

  return <>{contributors.map(({ user }, idx) => (<span key={user._id} onMouseOver={() => onHoverContributor(user._id)} onMouseOut={() => onHoverContributor(null)}>
    <UsersNameDisplay user={user} tooltipPlacement="top" className={classes.contributorName} />
    {endWithComma || idx < contributors.length - 1 ? ', ' : ''}
  </span>))}</>;
}

function getTagQueryOptions(
  revision: string | null,
  lensSlug: string | null,
  contributorsLimit: number
): {
  tagFragmentName: ArbitalTagPageFragmentNames;
  tagQueryOptions: Partial<UseMultiOptions<ArbitalTagPageFragmentNames, "Tags">>;
} {
  let tagFragmentName: ArbitalTagPageFragmentNames = "TagPageWithArbitalContentFragment";
  let tagQueryOptions: Required<Pick<UseMultiOptions<ArbitalTagPageFragmentNames, "Tags">, "extraVariables" | "extraVariablesValues">> = {
    extraVariables: {
      contributorsLimit: 'Int',
    },
    extraVariablesValues: {
      contributorsLimit,
    },
  };

  if (revision && !lensSlug) {
    tagFragmentName = "TagPageRevisionWithArbitalContentFragment";

    tagQueryOptions.extraVariables.version = 'String';
    tagQueryOptions.extraVariablesValues.version = revision;
  }

  if (revision && lensSlug) {
    tagFragmentName = "TagPageWithArbitalContentAndLensRevisionFragment";
    
    tagQueryOptions.extraVariables.version = 'String';
    tagQueryOptions.extraVariables.lensSlug = 'String';

    tagQueryOptions.extraVariablesValues.version = revision;
    tagQueryOptions.extraVariablesValues.lensSlug = lensSlug;
  }

  return { tagFragmentName, tagQueryOptions };
}

const LWTagPage = () => {
  const {
    PostsList2, ContentItemBody, Loading, AddPostsToTag, Error404, Typography,
    PermanentRedirect, HeadTags, UsersNameDisplay, TagFlagItem, TagDiscussionSection,
    TagPageButtonRow, ToCColumn, SubscribeButton, CloudinaryImage2, TagIntroSequence,
    TagTableOfContents, ContentStyles, CommentsListCondensed,
    MultiToCLayout, TableOfContents, FormatDate, LWTooltip, HoverPreviewLink, TagsTooltip,
    PathInfo, ArbitalLinkedPagesRightSidebar, ArbitalRelationshipsSmallScreen, ParentsAndChildrenSmallScreen
  } = Components;
  const classes = useStyles(styles);

  const currentUser = useCurrentUser();
  const { query, params: { slug } } = useLocation();
  const lensSlug = query.lens ?? query.l;
  // const { onOpenEditor } = useContext(TagEditorContext);
  
  // Support URLs with ?version=1.2.3 or with ?revision=1.2.3 (we were previously inconsistent, ?version is now preferred)
  const { version: queryVersion, revision: queryRevision } = query;
  const revision = queryVersion ?? queryRevision ?? null;
  const [editing, _setEditing] = useState(!!query.edit);
  const [formDirty, setFormDirty] = useState(false);

  // Usually, we want to warn the user before closing the editor when they have unsaved changes
  // There are some exceptions; in those cases, we can pass warnBeforeClosing=false
  const setEditing = useCallback((editing: boolean, warnBeforeClosing = true) => {
    _setEditing((previouslyEditing) => {
      if (!editing && previouslyEditing && warnBeforeClosing && formDirty) {
        const confirmed = confirm("Discard changes?");
        if (!confirmed) {
          return previouslyEditing;
        }
      }
      setFormDirty(false);
      return editing;
    })
  }, [formDirty]);

  const contributorsLimit = 16;

  const { tagFragmentName, tagQueryOptions } = getTagQueryOptions(revision, lensSlug, contributorsLimit);
  const { tag, loadingTag, tagError, refetchTag, lens, loadingLens } = useTagOrLens(slug, tagFragmentName, tagQueryOptions);

  const [truncated, setTruncated] = useState(false)
  const [hoveredContributorId, setHoveredContributorId] = useState<string|null>(null);
  const { captureEvent } =  useTracking()
  const client = useApolloClient()

  const { canEdit } = useTagEditingRestricted(tag, editing, currentUser);

  const openInlineEditor = () => {
    if (currentUser && canEdit) {
      setEditing(true);
    }
    // onOpenEditor();
  };

  const handleTripleClick = useMultiClickHandler({
    clickCount: 3,
    timeout: 300,
    onMultiClick: openInlineEditor,
  });

  const multiTerms: AnyBecauseTodo = {
    allPages: {view: "allPagesByNewest"},
    myPages: {view: "userTags", userId: currentUser?._id},
    //tagFlagId handled as default case below
  }

  const { results: otherTagsWithNavigation } = useMulti({
    terms: ["allPages", "myPages"].includes(query.focus) ? multiTerms[query.focus] : {view: "tagsByTagFlag", tagFlagId: query.focus},
    collectionName: "Tags",
    fragmentName: 'TagWithFlagsFragment',
    limit: 1500,
    skip: !query.flagId
  })

  useOnSearchHotkey(() => setTruncated(false));

  useGlobalKeydown((ev) => {
    // If the user presses escape while editing, we want to cancel the edit
    if (editing && ev.key === 'Escape') {
      setEditing(false);
    }
  });

  const { selectedLensId, selectedLens, updateSelectedLens, getSelectedLensUrlPath, lenses } = useTagLenses(tag);
  const displayedTagTitle = useDisplayedTagTitle(tag, lenses, selectedLens);

  const switchLens = useCallback((lensId: string) => {
    // We don't want to warn before closing the editor using this mechanism when switching lenses
    // because we already do it inside of Form.tsx because of the route change
    setEditing(false, false);
    updateSelectedLens(lensId);
  }, [setEditing, updateSelectedLens]);

  const tagPositionInList = otherTagsWithNavigation?.findIndex(tagInList => tag?._id === tagInList._id);
  // We have to handle updates to the listPosition explicitly, since we have to deal with three cases
  // 1. Initially the listPosition is -1 because we don't have a list at all yet
  // 2. Then we have the real position
  // 3. Then we remove the tagFlag, we still want it to have the right next button
  const [nextTagPosition, setNextTagPosition] = useState<number | null>(null);
  useEffect(() => {
    // Initial list position setting
    if (tagPositionInList && tagPositionInList >= 0) {
      setNextTagPosition(tagPositionInList + 1)
    }
    if (nextTagPosition !== null && tagPositionInList && tagPositionInList < 0) {
      // Here we want to decrement the list positions by one, because we removed the original tag and so
      // all the indices are moved to the next
      setNextTagPosition(nextTagPosition => (nextTagPosition || 1) - 1)
    }
    //eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tagPositionInList])
  const nextTag = otherTagsWithNavigation && (nextTagPosition !== null && nextTagPosition >= 0) && otherTagsWithNavigation[nextTagPosition]
  
  const expandAll = useCallback(() => {
    setTruncated(false)
  }, []);

  const onHoverContributor = useCallback((userId: string | null) => {
    setHoveredContributorId(userId);
  }, []);

  const htmlWithAnchors = selectedLens?.tableOfContents?.html ?? selectedLens?.contents?.html ?? "";

  let description = htmlWithAnchors;
  // EA Forum wants to truncate much less than LW
  if (isFriendlyUI) {
    description = truncated
      ? truncateTagDescription(htmlWithAnchors, tag?.descriptionTruncationCount)
      : htmlWithAnchors;
  } else {
    description = (truncated && !tag?.wikiOnly)
    ? truncate(htmlWithAnchors, tag?.descriptionTruncationCount || 4, "paragraphs", "<span>...<p><a>(Read More)</a></p></span>")
    : htmlWithAnchors
  }

  const { topContributors, smallContributors } = useDisplayedContributors(selectedLens?.contributors ?? null);

  if (loadingTag && !tag)
    return <Loading/>
  if (tagError) {
    return <Loading/> //TODO
  }
  if (!tag) {
    if (loadingLens && !lens) {
      return <Loading/>
    }
    if (lens?.parentTag) {
      const baseTagUrl = tagGetUrl(lens.parentTag);
      const newQuery = {
        ...query,
        lens: lens.slug,
      }
      const newUrl = `${baseTagUrl}?${qs.stringify(newQuery)}`;
      return <PermanentRedirect url={newUrl} />
    }
  }
  if (!tag || tag.isPlaceholderPage) {
    return <Components.RedlinkTagPage tag={tag} slug={slug} />
  }

  // If the slug in our URL is not the same as the slug on the tag, redirect to the canonical slug page
  if (tag.oldSlugs?.filter(slug => slug !== tag.slug)?.includes(slug)) {
    const baseTagUrl = tagGetUrl(tag);
    const queryString = !isEmpty(query) ? `?${qs.stringify(query)}` : '';
    return <PermanentRedirect url={`${baseTagUrl}${queryString}`} />
  }
  if (editing && !tagUserHasSufficientKarma(currentUser, "edit")) {
    throw new Error(`Sorry, you cannot edit ${taggingNamePluralSetting.get()} without ${tagMinimumKarmaPermissions.edit} or more karma.`)
  }

  // if no sort order was selected, try to use the tag page's default sort order for posts
  if (query.sortedBy || tag.postsDefaultSortOrder) {
    query.sortedBy = query.sortedBy || tag.postsDefaultSortOrder
  }

  const terms = {
    ...tagPostTerms(tag, query),
    limit: 15
  }

  const clickReadMore = () => {
    setTruncated(false)
    captureEvent("readMoreClicked", {tagId: tag._id, tagName: tag.name, pageSectionContext: "wikiSection"})
  }

  const headTagDescription = tag.description?.plaintextDescription || `All posts related to ${tag.name}, sorted by relevance`
  
  const tagFlagItemType: AnyBecauseTodo = {
    allPages: "allPages",
    myPages: "userPages"
  }

  const parentAndSubTags = (tag.parentTag || tag.subTags.length)
    ? (
      <div className={classNames(classes.subHeading,classes.centralColumn)}>
        <div className={classes.subHeadingInner}>
          {tag.parentTag && <div className={classes.relatedTag}>Parent {taggingNameCapitalSetting.get()}: <Link className={classes.relatedTagLink} to={tagGetUrl(tag.parentTag)}>{tag.parentTag.name}</Link></div>}
          {/* For subtags it would be better to:
              - put them at the bottom of the page
              - truncate the list
              for our first use case we only need a small number of subtags though, so I'm leaving it for now
          */}
          {tag.subTags.length ? <div className={classes.relatedTag}><span>Sub-{tag.subTags.length > 1 ? taggingNamePluralCapitalSetting.get() : taggingNameCapitalSetting.get()}:&nbsp;{
              tag.subTags.map((subTag, idx) => {
              return <Fragment key={idx}>
                <Link className={classes.relatedTagLink} to={tagGetUrl(subTag)}>{subTag.name}</Link>
                {idx < tag.subTags.length - 1 ? <>,&nbsp;</>: <></>}
              </Fragment>
            })}</span>
          </div> : <></>}
        </div>
      </div>
    )
    : <></>;

  let editForm;
  if (selectedLens?._id === MAIN_TAB_ID) {
    editForm = (
      <span className={classNames(classes.unselectedEditForm, editing && classes.selectedEditForm)}>
        <EditTagForm
          tag={tag}
          warnUnsavedChanges={true}
          successCallback={async () => {
            setEditing(false, false);
            await client.resetStore();
          }}
          cancelCallback={() => setEditing(false)}
          changeCallback={() => setFormDirty(true)}
        />
      </span>
    );
  } else if (selectedLens) {
    editForm = (
      <span className={classNames(classes.unselectedEditForm, editing && classes.selectedEditForm)}>
        <EditLensForm
          lens={selectedLens}
          successCallback={async () => {
            setEditing(false, false);
            await refetchTag();
          }}
          changeCallback={() => setFormDirty(true)}
          cancelCallback={() => setEditing(false)}
        />
      </span>
    );
  }

  const tagBodySection = (
    <div id="tagContent" className={classNames(classes.wikiSection,classes.centralColumn)}>
      <AnalyticsContext pageSectionContext="wikiSection">
        { revision && tag.description && (tag.description as TagRevisionFragment_description).user && <div className={classes.pastRevisionNotice}>
          You are viewing revision {tag.description.version}, last edited by <UsersNameDisplay user={(tag.description as TagRevisionFragment_description).user}/>
        </div>}
        {/* <TagEditorProvider> */}
        <DeferRender ssr={false}>
          {editForm}
        </DeferRender>
        {/* </TagEditorProvider> */}
        <div
          className={classNames(editing && classes.descriptionContainerEditing)}
          onClick={(e) => {
            handleTripleClick(e);
            clickReadMore();
          }}
        >
          <ContentStyles contentType="tag">
            <TagOrLensBody tag={tag} selectedLens={selectedLens} description={description}/>
          </ContentStyles>
        </div>
      </AnalyticsContext>
      <AnalyticsContext pageSectionContext="parentsAndChildrenSmallScreenNavigationButtons">
        <ParentsAndChildrenSmallScreen arbitalLinkedPages={selectedLens?.arbitalLinkedPages ?? undefined} tagOrLensName={selectedLens?.title ?? tag.name} />
      </AnalyticsContext>
    </div>
  );

  const tagPostsAndCommentsSection = (
    <div className={classes.centralColumn}>
      {editing && <TagDiscussionSection
        key={tag._id}
        tag={tag}
      />}
      {tag.sequence && <TagIntroSequence tag={tag} />}
      {!tag.wikiOnly && <>
        <AnalyticsContext pageSectionContext="tagsSection">
          <PostsList2
            header={<PostsListHeading tag={tag} query={query} />}
            terms={terms}
            enableTotal
            tagId={tag._id}
            itemsPerPage={200}
            showNoResults={false}
          >
            <AddPostsToTag tag={tag} />
          </PostsList2>
        </AnalyticsContext>
        {quickTakesTagsEnabledSetting.get() && <DeferRender ssr={false}>
          <AnalyticsContext pageSectionContext="quickTakesSection">
            <CommentsListCondensed
              label="Quick takes"
              terms={{
                view: "tagSubforumComments" as const,
                tagId: tag._id,
                sortBy: 'new',
              }}
              initialLimit={8}
              itemsPerPage={20}
              showTotal
              hideTag
            />
          </AnalyticsContext>
        </DeferRender>}
      </>}
    </div>
  );

  const tocContributors = <div className={classes.tocContributors}>
    {topContributors.map(({ user }: { user: UsersMinimumInfo }, idx: number) => (
      <span className={classes.tocContributor} key={user._id} onMouseOver={() => onHoverContributor(user._id)} onMouseOut={() => onHoverContributor(null)}>
        <UsersNameDisplay key={user._id} user={user} className={classes.contributorName} />
      </span>
    ))}
  </div>;

  const fixedPositionTagToc = (
    <TableOfContents
      sectionData={selectedLens?.tableOfContents ?? tag.tableOfContents}
      title={tag.name}
      heading={tocContributors}
      onClickSection={expandAll}
      fixedPositionToc
      hover
    />
  );

  const tagHeader = (
    <div className={classNames(classes.header,classes.centralColumn)}>
      {query.flagId && <span>
        <Link to={`/${taggingNamePluralSetting.get()}/dashboard?focus=${query.flagId}`}>
          <TagFlagItem 
            itemType={["allPages", "myPages"].includes(query.flagId) ? tagFlagItemType[query.flagId] : "tagFlagId"}
            documentId={query.flagId}
          />
        </Link>
        {nextTag && <span onClick={() => setEditing(true)}><Link
          className={classes.nextLink}
          to={tagGetUrl(nextTag, {flagId: query.flagId, edit: true})}>
            Next Tag ({nextTag.name})
        </Link></span>}
      </span>}
      {revision && <Link to={tagGetUrl(tag, {lens: selectedLens?.slug})} className={classes.revisionNotice}>
        <HistoryIcon className={classes.historyIcon} />
        You are viewing version {revision} of this page.
        Click here to view the latest version.
      </Link>}
      {(lenses.length > 1) && <Components.LensTabBar
        lenses={lenses}
        selectedLens={selectedLens}
        switchLens={switchLens}
        getSelectedLensUrlPath={getSelectedLensUrlPath}
      />}
      <div className={classes.titleRow}>
        <Typography variant="display3" className={classes.title}>
          {selectedLens?.deleted ? "[Deleted] " : ""}{displayedTagTitle}
        </Typography>
        {/* intentionally don't pass in refetchTag or updateSelectedLens here to avoid showing newLens button mobile for clutter reasons */}
        <TagPageButtonRow
          tag={tag}
          selectedLens={selectedLens}
          editing={editing}
          setEditing={setEditing}
          hideLabels={true}
          className={classNames(classes.editMenu, classes.mobileButtonRow)}
        />
        {!tag.wikiOnly && !editing && userHasNewTagSubscriptions(currentUser) &&
          <SubscribeButton
            tag={tag}
            className={classes.notifyMeButton}
            subscribeMessage="Subscribe"
            unsubscribeMessage="Subscribed"
            subscriptionType={subscriptionTypes.newTagPosts}
          />
        }
      </div>
      {(topContributors.length > 0 || smallContributors.length > 0) && <div className={classes.contributorRow}>
        <div className={classes.contributorNameWrapper}>
          <span>Written by </span>
          <ContributorsList 
            contributors={topContributors} 
            onHoverContributor={onHoverContributor} 
            endWithComma={smallContributors.length > 0} 
          />
          {smallContributors.length > 0 && <LWTooltip 
            title={<ContributorsList contributors={smallContributors} onHoverContributor={onHoverContributor} endWithComma={false} />} 
            clickable 
            placement="top"
          >
            et al.
          </LWTooltip>
          }
        </div>
        {selectedLens?.contents?.editedAt && <div className={classes.lastUpdated}>
          {'last updated '}
          {selectedLens?.contents?.editedAt && <FormatDate date={selectedLens.contents.editedAt} format="Do MMM YYYY" tooltip={false} />}
        </div>}
      </div>}
      <ArbitalRelationshipsSmallScreen arbitalLinkedPages={selectedLens?.arbitalLinkedPages ?? undefined} />
    </div>
  );

  const rightColumn = (<div className={classes.rightColumn}>
    <div className={classes.rightColumnContent}>
      <ArbitalLinkedPagesRightSidebar tag={tag} selectedLens={selectedLens} arbitalLinkedPages={selectedLens?.arbitalLinkedPages ?? undefined} />
      <Components.SideItemsSidebar/>
    </div>
    <div className={classes.rightColumnOverflowFade} />
  </div>);

  const multiColumnToc = (
    <MultiToCLayout
      segments={[
        {
          centralColumn: parentAndSubTags,
        },
        {
          centralColumn: tagHeader,
          toc: fixedPositionTagToc,
        },
        {
          centralColumn: tagBodySection,
          rightColumn
        },
        {
          centralColumn: tagPostsAndCommentsSection,
        },
      ]}
      tocRowMap={[0, 1, 1, 1]}
    />
  );
  
  return <AnalyticsContext
    pageContext='tagPage'
    tagName={tag.name}
    tagId={tag._id}
    sortedBy={query.sortedBy || "relevance"}
    limit={terms.limit}
  >
    <TagPageContext.Provider value={{selectedLens: selectedLens ?? null}}>
      <HeadTags
        description={headTagDescription}
        structuredData={getTagStructuredData(tag)}
        noIndex={tag.noindex}
      />
      {hoveredContributorId && <style>
        {`.by_${hoveredContributorId} {background: rgba(95, 155, 101, 0.35);}`}
      </style>}
      {tag.bannerImageId && <div className={classes.imageContainer}>
        <CloudinaryImage2
          publicId={tag.bannerImageId}
          height={300}
          fullWidthHeader
        />
      </div>}
      <div className={tag.bannerImageId ? classes.rootGivenImage : ''}>
        {/* {originalToc} */}
        <TagPageButtonRow
          tag={tag}
          selectedLens={selectedLens}
          editing={editing}
          setEditing={setEditing}
          hideLabels={true}
          className={classNames(classes.editMenu, classes.nonMobileButtonRow)}
          refetchTag={refetchTag}
          updateSelectedLens={updateSelectedLens}
        />
        <Components.SideItemsContainer>
          {multiColumnToc}
        </Components.SideItemsContainer>
      </div>
    </TagPageContext.Provider>
  </AnalyticsContext>
}

const TagOrLensBody = ({tag, selectedLens, description}: {
  tag: TagPageFragment,
  selectedLens: TagLens|undefined,
  description: string,
}) => {
  const { ContentItemBody, InlineReactSelectionWrapper, HoveredReactionContextProvider, PathInfo } = Components;
  const classes = useStyles(styles);

  const contentRef = useRef<ContentItemBody>(null);
  const votingSystem = getVotingSystemByName("reactionsAndLikes");
  const mainLensIsSelected = !selectedLens || selectedLens?._id === 'main-tab';
  const voteProps = useVote(
    mainLensIsSelected ? tag : selectedLens,
    mainLensIsSelected ? "Tags" : "MultiDocuments",
    votingSystem
  );
  const inlineReactHighlights = votingSystem.getTagOrLensHighlights?.({
    tagOrLens: selectedLens ?? tag,
    voteProps
  });

  return <HoveredReactionContextProvider voteProps={voteProps}>
    <InlineReactSelectionWrapper
      voteProps={voteProps}
      contentRef={contentRef}
      styling="tag"
    >
      <>
        <ContentItemBody
          ref={contentRef}
          dangerouslySetInnerHTML={{__html: description||"<em>This page is a stub.</em>"}}
          description={`tag ${tag.name}`}
          className={classes.description}
          replacedSubstrings={inlineReactHighlights}
          onContentReady={initializeRadioHandlers}
        />
        <PathInfo tag={tag} lens={selectedLens ?? null} />
      </>
    </InlineReactSelectionWrapper>
  </HoveredReactionContextProvider>
}

const LWTagPageComponent = registerComponent("LWTagPage", LWTagPage);

export default LWTagPageComponent;

declare global {
  interface ComponentTypes {
    LWTagPage: typeof LWTagPageComponent
  }
}
