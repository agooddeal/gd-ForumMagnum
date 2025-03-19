import React, { useState, useEffect } from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import { useOnNavigate } from '../hooks/useOnNavigate';
import { SearchBox, connectMenu } from 'react-instantsearch-dom';
import classNames from 'classnames';
import CloseIcon from '@/lib/vendor/@material-ui/icons/src/Close';
import Portal from '@/lib/vendor/@material-ui/core/src/Portal';
import IconButton from '@/lib/vendor/@material-ui/core/src/IconButton';
import withErrorBoundary from '../common/withErrorBoundary';
import { getSearchIndexName, getSearchClient, isSearchEnabled } from '../../lib/search/searchUtil';
import { isAF } from '../../lib/instanceSettings';
import qs from 'qs'
import { useSearchAnalytics } from '../search/useSearchAnalytics';
import { useCurrentUser } from './withUser';
import { isFriendlyUI } from '../../themes/forumTheme';
import { useNavigate } from '../../lib/routeUtil';
import { InstantSearch } from '../../lib/utils/componentsWithChildren';

const VirtualMenu = connectMenu(() => null);

const styles = (theme: ThemeType) => ({
  root: {
    display: 'flex',
    alignItems: 'center',
  },
  rootChild: {
    height: 'fit-content'
  },
  searchInputArea: {
    display: "block",
    position: "relative",
    minWidth: 48,
    height: 48,

    "& .ais-SearchBox": {
      display: 'inline-block',
      position: 'relative',
      maxWidth: 300,
      width: '100%',
      height: 46,
      whiteSpace: 'nowrap',
      boxSizing: 'border-box',
      fontSize: 14,
    },
    "& .ais-SearchBox-form": {
      height: '100%'
    },
    "& .ais-SearchBox-submit":{
      display: "none"
    },
    // This is a class generated by React InstantSearch, which we don't have direct control over so
    // are doing a somewhat hacky thing to style it.
    "& .ais-SearchBox-input": {
      display:"none",

      height: "100%",
      width: "100%",
      paddingTop: isFriendlyUI ? 5 : undefined,
      paddingRight: 0,
      paddingLeft: 48,
      verticalAlign: "bottom",
      borderStyle: "none",
      boxShadow: "none",
      backgroundColor: "transparent",
      fontSize: 'inherit',
      "-webkit-appearance": "none",
      cursor: "text",
      borderRadius: 5,
    },
    "&.open .ais-SearchBox-input": {
      display:"inline-block",
    },
    "&.open .SearchBar-searchIconButton": {
      position: 'fixed',
    },
  },
  searchInputAreaSmall: isFriendlyUI ? {
    minWidth: 34,
  } : {},
  searchIcon: {
    "--icon-size": "24px",
  },
  searchIconButton: {
    color: isFriendlyUI ? theme.palette.grey[600] : theme.palette.header.text,
  },
  searchIconButtonSmall: isFriendlyUI ? {
    padding: 6,
    marginTop: 6,
  } : {},
  closeSearchIcon: {
    fontSize: 14,
  },
  searchBarClose: {
    display: "inline-block",
    position: "absolute",
    top: isFriendlyUI ? 18 : 15,
    right: 5,
    cursor: "pointer"
  },
  alignmentForum: {
    "& .ais-SearchBox-input": {
      color: theme.palette.panelBackground.default,
    },
    "& .ais-SearchBox-input::placeholder": {
      color: theme.palette.text.invertedBackgroundText3,
    },
  },
})

const SearchBar = ({onSetIsActive, searchResultsArea, classes}: {
  onSetIsActive: (active: boolean) => void,
  searchResultsArea: any,
  classes: ClassesType<typeof styles>
}) => {
  const currentUser = useCurrentUser()
  const [inputOpen,setInputOpen] = useState(false);
  const [searchOpen,setSearchOpen] = useState(false);
  const [currentQuery,setCurrentQuery] = useState("");
  const navigate = useNavigate();
  const captureSearch = useSearchAnalytics();

  const handleSubmit = () => {
    navigate({pathname: `/search`, search: `?${qs.stringify({query: currentQuery})}`});
    closeSearch()
  }
  
  useOnNavigate(() => {
    closeSearch();
  });


  const openSearchResults = () => setSearchOpen(true);
  const closeSearchResults = () => setSearchOpen(false);

  const closeSearch = () => {
    setSearchOpen(false);
    setInputOpen(false);
    if (onSetIsActive)
      onSetIsActive(false);
  }

  const handleSearchTap = () => {
    setInputOpen(true);
    setSearchOpen(!!currentQuery);
    if (onSetIsActive)
      onSetIsActive(true);
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') closeSearch();
    if (event.keyCode === 13) handleSubmit()
  }

  const queryStateControl = (searchState: any): void => {
    if (searchState.query !== currentQuery) {
      setCurrentQuery(searchState.query);
      if (searchState.query) {
        openSearchResults();
      } else {
        closeSearchResults();
      }
    }
  }

  useEffect(() => {
    if (currentQuery) {
      captureSearch("searchBar", {query: currentQuery});
    }
  }, [currentQuery, captureSearch])

  const { SearchBarResults, ForumIcon } = Components

  if (!isSearchEnabled()) {
    return <div>Search is disabled (ElasticSearch not configured on server)</div>
  }

  return <div className={classes.root} onKeyDown={handleKeyDown}>
    <div className={classes.rootChild}>
      <InstantSearch
        indexName={getSearchIndexName("Posts")}
        searchClient={getSearchClient({emptyStringSearchResults: "empty"})}
        onSearchStateChange={queryStateControl}
      >
        <div className={classNames(
          classes.searchInputArea,
          {"open": inputOpen},
          {[classes.alignmentForum]: isAF, [classes.searchInputAreaSmall]: !currentUser}
        )}>
          {isAF && <VirtualMenu attribute="af" defaultRefinement="true" />}
          <div onClick={handleSearchTap}>
            <IconButton className={classNames(classes.searchIconButton, {[classes.searchIconButtonSmall]: !currentUser})}>
              <ForumIcon icon="Search" className={classes.searchIcon} />
            </IconButton>
            {/* Ignored because SearchBox is incorrectly annotated as not taking null for its reset prop, when
              * null is the only option that actually suppresses the extra X button.
             // @ts-ignore */}
            {inputOpen && <SearchBox reset={null} focusShortcuts={[]} autoFocus={true} />}
          </div>
          { inputOpen && <div className={classes.searchBarClose} onClick={closeSearch}>
            <CloseIcon className={classes.closeSearchIcon}/>
          </div>}
          <div>
            { searchOpen && <Portal container={searchResultsArea.current}>
                <SearchBarResults closeSearch={closeSearch} currentQuery={currentQuery} />
              </Portal> }
          </div>
        </div>
      </InstantSearch>
    </div>
  </div>
}

const SearchBarComponent = registerComponent("SearchBar", SearchBar, {
  styles,
  hocs: [withErrorBoundary],
  areEqual: "auto",
});

declare global {
  interface ComponentTypes {
    SearchBar: typeof SearchBarComponent
  }
}
