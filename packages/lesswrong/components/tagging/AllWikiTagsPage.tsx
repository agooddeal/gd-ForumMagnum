import React, { useState, useMemo } from 'react';
import { registerComponent, Components, fragmentTextForQuery } from '../../lib/vulcan-lib';
import { useCurrentUser } from '../common/withUser';
import { AnalyticsContext } from "../../lib/analyticsEvents";
import { Link } from '../../lib/reactRouterWrapper';
import { useLocation } from '../../lib/routeUtil';
import AddBoxIcon from '@material-ui/icons/AddBox';
import { useDialog } from '../common/withDialog';
import { tagCreateUrl, tagUserHasSufficientKarma } from '../../lib/collections/tags/helpers';
import { defineStyles, useStyles } from '../hooks/useStyles';
import SearchIcon from '@material-ui/icons/Search';
import { InstantSearch } from '../../lib/utils/componentsWithChildren';
import { Configure, SearchBox, connectStateResults } from 'react-instantsearch-dom';
import { getSearchIndexName, getSearchClient } from '../../lib/search/searchUtil';
import { useSingle } from '@/lib/crud/withSingle';
import { ArbitalLogo } from '../icons/ArbitalLogo';
import { filterNonnull } from '@/lib/utils/typeGuardUtils';
import { useMulti } from '@/lib/crud/withMulti';

const ARBITAL_GREEN_DARK = "#004d40"

const styles = defineStyles("AllWikiTagsPage", (theme: ThemeType) => ({
  root: {
    maxWidth: 900,
    margin: "0 auto",
    position: 'relative',
    paddingLeft: 10,
    paddingRight: 10,
  },
  topSection: {
    marginBottom: 20,
    display: "flex",
    flexDirection: "column",
    gap: "32px",
  },
  titleSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    flexShrink: 0,
  },
  addTagSection: {
    position: 'absolute',
    top: 78,
    right: 20,
  },
  addTagButton: {
    marginBottom: -10,
    display: 'flex',
    alignItems: 'center',
    '& svg': {
      marginRight: 4,
    },
    '& span': {
      '@media (max-width: 400px)': {
        display: 'none',
      },
    }
  },
  titleClass: {
    fontSize: "4rem",
    fontWeight: 300,
    marginBottom: 0,
  },
  searchContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    width: "100%",
    height: "100%",
    maxWidth: 600,
    position: "relative",
  },
  searchInputArea: {
    display: "block",
    position: "relative",
    width: "100%",
    height: 48,
    marginBottom: 24,

    "& .ais-SearchBox": {
      display: 'inline-block',
      position: 'relative',
      width: '100%',
      height: 46,
      whiteSpace: 'nowrap',
      boxSizing: 'border-box',
      fontSize: 14,
    },
    "& .ais-SearchBox-form": {
      height: '100%'
    },
    "& .ais-SearchBox-submit": {
      display: "none"
    },
    "& .ais-SearchBox-reset": {
      position: "absolute",
      top: "50%",
      right: 12,
      transform: "translateY(-50%)",
      border: "none",
      background: "none",
      cursor: "pointer",
      opacity: 0.8,
      padding: 4,
      "&:hover": {
        color: theme.palette.grey[700]
      }
    },
    "& .ais-SearchBox-input": {
      height: "100%",
      width: "100%",
      padding: "12px 48px",
      paddingRight: 40,
      verticalAlign: "bottom",
      borderStyle: "none",
      boxShadow: "none",
      backgroundColor: "white",
      fontSize: '1.4rem',
      "-webkit-appearance": "none",
      cursor: "text",
      borderRadius: 12,
    },
  },
  searchIcon: {
    color: theme.palette.grey[500],
    position: 'absolute',
    left: 12,
    top: '50%',
    transform: 'translateY(-50%)',
    zIndex: 1,
    pointerEvents: 'none',
  },
  mainContent: {
    display: "flex",
    gap: "32px",
    flexGrow: 1,
    flexDirection: "column",
    width: "100%",
  },
  wikiTagNestedList: {
    flexShrink: 0,
    width: "100%",
    marginLeft: 0,
    maxWidth: 600,
    alignSelf: "flex-start",
  },
  arbitalRedirectNotice: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: '16px',
    padding: "16px",
    borderRadius: 12,
    backgroundColor: ARBITAL_GREEN_DARK,
    marginBottom: 24,
    // fontFamily: theme.palette.fonts.sansSerifStack,
    // make <a> children have the following styles
    ...theme.typography.commentStyle,
    color: "white",
    "& a": {
      color: "white",
      //dotted underline
      textDecoration: "underline",
      textDecorationStyle: "dotted",
    },
    '&& h2': {
      fontSize: '1.7rem',
      marginTop: '0rem',
      marginBottom: '.5rem',
      fontWeight:500,
    },
  },
  arbitalLogo: {
    width: 100,
    // don't hide overflow
    overflow: 'visible',
    padding: 8
  },
  dismissButtonContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    alignSelf: 'stretch',
  },
  dismissButton: {
    background: 'transparent',
    border: 'none',
    fontSize: '2rem',
    cursor: 'pointer',
    color: 'white',
    '&:hover': {
      color: theme.palette.grey[300],
    },
    '&:focus': {
      outline: 'none',
    },
  },
}))


// Create the artificial "Uncategorized" tags
const uncategorizedRootTag = {
  _id: 'uncategorized-root',
  core: true,
  name: 'Uncategorized',
  slug: 'uncategorized-root',
  oldSlugs: [],
  description: {
    _id: 'uncategorized-root',
    wordCount: 0,
  },
  postCount: 0,
  baseScore: 0,
  coreTagId: null,
  parentTagId: null,
  isArbitalImport: false,
};

// TODO: we really need to figure out a better way to handle this than slugs, especially with the merged rationality page
const prioritySlugs = [
  'rationality', 'rationality-1', 'ai', 'world-modeling', 
  'world-optimization', 'practical', 'community', 'site-meta'
] as const;

const ArbitalRedirectNotice = ({ classes, onDismiss }: {
  classes: ClassesType,
  onDismiss: () => void,
}) => {
  const { Loading } = Components

  // TODO: put in database setting?
  const documentId = "nDavoyZ2EobkpZNAs"

  const { document, loading } = useSingle({
    documentId,
    collectionName: "Comments",
    fragmentName: "CommentsList",
    skip: !documentId
  });

  const { html = "" } = document?.contents || {}

  return (
    <div className={classes.arbitalRedirectNotice}>
      <ArbitalLogo className={classes.arbitalLogo} />
      <div className={classes.arbitalRedirectNoticeContent}>
        {loading && <Loading />}
        {html && <div dangerouslySetInnerHTML={{ __html: html }} />}
        {!html && !loading && <div><em>You have been redirected from Arbital.com</em></div>}
      </div>
      <div className={classes.dismissButtonContainer}>
        <button className={classes.dismissButton} onClick={onDismiss}>×</button>
      </div>
    </div>
  );
}

const AllWikiTagsPage = () => {
  const classes = useStyles(styles);

  const { WikiTagGroup, Loading, SectionButton, LWTooltip } = Components;

  const { query } = useLocation();
  const isArbitalRedirect = query.ref === 'arbital';

  const currentUser = useCurrentUser();
  const { openDialog } = useDialog();

  const { results: priorityTagsRaw } = useMulti({
    collectionName: "Tags",
    fragmentName: "ConceptItemFragment",
    terms: { 
      view: "tagsBySlugs",
      slugs: [...prioritySlugs]
    },
    fetchPolicy: 'cache-and-network',
    ssr: true,
  });

  const priorityTags = useMemo(() => {
    if (!priorityTagsRaw) return [];
    const tags = filterNonnull(priorityTagsRaw);
    if (!tags.length) return [];
    
    return [...tags].sort((a: ConceptItemFragment, b: ConceptItemFragment) => {
      const indexA = prioritySlugs.indexOf(a.slug as typeof prioritySlugs[number]);
      const indexB = prioritySlugs.indexOf(b.slug as typeof prioritySlugs[number]);
      return indexA - indexB;
    });
  }, [priorityTagsRaw]);

  const [currentQuery, setCurrentQuery] = useState('');
  const [showArbitalRedirectNotice, setShowArbitalRedirectNotice] = useState(isArbitalRedirect);

  // Function to handle search state changes
  const handleSearchStateChange = (searchState: any) => {
    setCurrentQuery(searchState.query || '');
  };

  const CustomStateResults = connectStateResults(({ searchResults, isSearchStalled }) => {
    const hits = (searchResults && searchResults.hits) || [];
    const tagIds = hits.map(hit => hit.objectID);

    if (!priorityTags) return null;

    if (isSearchStalled) {
      return <Loading />;
    }

    return (
      <div className={classes.mainContent}>
        {priorityTags.map((tag: ConceptItemFragment) => (
          tag && <WikiTagGroup
            key={tag._id}
            parentTag={tag}
            searchTagIds={currentQuery ? tagIds : null}
          />
        ))}
        <WikiTagGroup
          parentTag={uncategorizedRootTag}
          searchTagIds={currentQuery ? tagIds : null}
        />
      </div>
    );
  });

  return (
    <AnalyticsContext pageContext="allWikiTagsPage">
      <div>
        <div className={classes.addTagSection}>
          <SectionButton>
            {currentUser && tagUserHasSufficientKarma(currentUser, "new") && <LWTooltip title="A WikiTag is a combination of a wiki page and a tag. It has either a wiki entry, a list of posts with that tag, or both!">
              <Link
                to={tagCreateUrl}
                className={classes.addTagButton}
              >
                <AddBoxIcon/>
                <span>New WikiTag</span>
              </Link>
            </LWTooltip>}
            {!currentUser && <a 
              onClick={(ev) => {
                openDialog({
                  componentName: "LoginPopup",
                  componentProps: {}
                });
                ev.preventDefault();
              }}
              className={classes.addTagButton}
            >
              <AddBoxIcon/>
              <span>New Wiki Page</span>
            </a>}
          </SectionButton>
        </div>
        <div className={classes.root}>
          <div className={classes.topSection}>
            <div className={classes.titleSection}>
              <div className={classes.titleClass}>Concepts</div>
            </div>

            <div className={classes.searchContainer}>
              <InstantSearch
                indexName={getSearchIndexName('Tags')}
                searchClient={getSearchClient()}
                onSearchStateChange={handleSearchStateChange}
              >
                <div className={classes.searchInputArea}>
                  <Configure hitsPerPage={200} />
                  <SearchIcon className={classes.searchIcon} />
                  <SearchBox 
                    translations={{ placeholder: 'What would you like to read about?' }}
                  />
                </div>
                {isArbitalRedirect && showArbitalRedirectNotice && (
                  <ArbitalRedirectNotice
                    classes={classes}
                    onDismiss={() => setShowArbitalRedirectNotice(false)}
                  />
                )}
                <CustomStateResults />
              </InstantSearch>
            </div>
          </div>
        </div>
      </div>
    </AnalyticsContext>
  );
};

const AllWikiTagsPageComponent = registerComponent("AllWikiTagsPage", AllWikiTagsPage);

export default AllWikiTagsPageComponent;

declare global {
  interface ComponentTypes {
    AllWikiTagsPage: typeof AllWikiTagsPageComponent
  }
}
