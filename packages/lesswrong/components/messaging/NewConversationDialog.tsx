import React, { useCallback, useEffect, useState } from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib";
import { AnalyticsContext } from "../../lib/analyticsEvents";
import { Configure, Hits, SearchBox } from "react-instantsearch-dom";
import { getElasticIndexNameWithSorting, getSearchClient } from "../../lib/search/searchUtil";
import { useCurrentUser } from "../common/withUser";
import { useInitiateConversation } from "../hooks/useInitiateConversation";
import { useNavigate } from "../../lib/reactRouterWrapper";
import { Hit } from "react-instantsearch-core";
import Chip from "@material-ui/core/Chip";
import { InstantSearch } from "../../lib/utils/componentsWithChildren";

const styles = (theme: ThemeType) => ({
  paper: {
    width: 600,
    margin: '48px 24px'
  },
  root: {
    maxWidth: 600,
    width: 'min(600px, 100%)',
    maxHeight: 800,
    flex: 1,
    minHeight: 0,
    display: "flex",
    flexDirection: "column",
  },
  titleRow: {
    fontFamily: theme.palette.fonts.sansSerifStack,
    color: theme.palette.grey[1000],
    fontSize: 20,
    fontWeight: 700,
    padding: '20px 20px 14px 20px',
    display: "flex",
    justifyContent: "space-between",
  },
  resultsColumn: {
    display: "flex",
    flex: "1",
    flexDirection: "column",
    minHeight: 0,
  },
  searchIcon: {
    marginLeft: 12,
    marginRight: 6,
    color: theme.palette.grey[600],
    fontSize: 16
  },
  searchBoxRow: {
    display: "flex",
    alignItems: "center",
    marginBottom: 15,
    gap: "16px",
    padding: "0px 20px",
    [theme.breakpoints.down("xs")]: {
      marginBottom: 12,
    },
  },
  modWarning: {
    padding: '0px 20px 12px 20px',
    color: theme.palette.grey[600],
    fontSize: 14,
  },
  searchInputArea: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    maxWidth: 625,
    minHeight: 48,
    padding: 4,
    backgroundColor: theme.palette.grey[120],
    borderRadius: theme.borderRadius.default,
  },
  searchInputContents: {
    flex: 1,
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    "& .ais-SearchBox": {
      display: "inline-block",
      position: "relative",
      marginLeft: 2,
      height: 40,
      whiteSpace: "nowrap",
      boxSizing: "border-box",
      flex: "1 1 auto",
    },
    "& .ais-SearchBox-form": {
      height: "100%",
    },
    "& .ais-SearchBox-submit": {
      display: "none",
    },
    // This is a class generated by React InstantSearch, which we don't have direct control over so
    // are doing a somewhat hacky thing to style it.
    "& .ais-SearchBox-input": {
      height: "100%",
      width: "100%",
      paddingRight: 0,
      verticalAlign: "bottom",
      borderStyle: "none",
      boxShadow: "none",
      backgroundColor: "transparent",
      fontSize: "inherit",
      "-webkit-appearance": "none",
      cursor: "text",
      ...theme.typography.body2,
    },
  },
  searchHelp: {
    [theme.breakpoints.down("sm")]: {
      display: "none",
    },
  },
  infoIcon: {
    fontSize: 20,
    fill: theme.palette.grey[800],
  },
  usersList: {
    overflowY: "auto",
    // Not the actual height, but makes it fill the space when there are no results
    height: 1000,
  },
  hit: {
    paddingLeft: 20,
    paddingRight: 20,
  },
  closeIcon: {
    color: theme.palette.grey[600],
    width: 20,
    height: 20,
    cursor: "pointer",
  },
  chip: {
    margin: 2,
    height: 28,
    borderRadius: theme.borderRadius.default,
    backgroundColor: theme.palette.background.primarySlightlyDim,
    fontWeight: 500,
    color: theme.palette.grey[900],
    fontSize: 13,
    '& svg': {
      fontSize: '18px'
    }
  },
  submitRow: {
    padding: "16px 20px",
    borderTop: theme.palette.border.grey300,
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-end"
  },
});

const NewConversationDialog = ({
  isModInbox = false,
  classes,
  onClose,
}: {
  isModInbox?: boolean;
  classes: ClassesType<typeof styles>
  onClose: () => void;
}) => {
  const {
    LWDialog,
    ErrorBoundary,
    ExpandedUsersConversationSearchHit,
    ForumIcon,
    Typography,
    EAButton
  } = Components;
  const currentUser = useCurrentUser();
  const [query, setQuery] = useState<string>("");
  const navigate = useNavigate();

  const { conversation, initiateConversation } = useInitiateConversation({ includeModerators: isModInbox });
  const [selectedUsers, setSelectedUsers] = useState<Hit<AnyBecauseTodo>[]>([])

  useEffect(() => {
    if (conversation) {
      navigate({ pathname: `/${isModInbox ? "moderatorInbox" : "inbox"}/${conversation._id}`, search: "?from=new_conversation_dialog" });
      onClose();
    }
  }, [conversation, navigate, isModInbox, onClose]);

  const toggleUserSelected = useCallback((user: Hit<AnyBecauseTodo>) => {
    const prevSelectedUserIds = selectedUsers.map(u => u._id)
    const newUserId = user._id

    if (prevSelectedUserIds.includes(newUserId)) {
      setSelectedUsers((prev) => prev.filter(v => v._id !== newUserId))
    } else {
      setSelectedUsers((prev) => [...prev, user])
    }
  }, [selectedUsers])

  if (!currentUser) return null;

  return (
    <AnalyticsContext pageSectionContext="newConversationDialog">
      <LWDialog
        open={true}
        onClose={onClose}
        dialogClasses={{
          paper: classes.paper,
        }}
      >
        <div className={classes.root}>
          <div className={classes.titleRow}>
            <div>New conversation</div>
            <ForumIcon icon="Close" className={classes.closeIcon} onClick={onClose} />
          </div>
          <InstantSearch
            indexName={getElasticIndexNameWithSorting("Users", "relevance")}
            searchClient={getSearchClient()}
            searchState={{ query }}
            onSearchStateChange={(x) => setQuery(x.query)}
          >
            <div className={classes.resultsColumn}>
              <div className={classes.searchBoxRow}>
                <div className={classes.searchInputArea}>
                  <ForumIcon icon="Search" className={classes.searchIcon} />
                  <div className={classes.searchInputContents}>
                    {selectedUsers.map((u) => (
                      <Chip
                        key={u._id}
                        onDelete={() => toggleUserSelected(u)}
                        className={classes.chip}
                        label={u.displayName}
                      />
                    ))}
                    <SearchBox
                      defaultRefinement={query}
                      // Ignored because SearchBox is incorrectly annotated as not taking null for its reset prop,
                      // when null is the only option that actually suppresses the extra X button.
                      // @ts-ignore
                      reset={null}
                      focusShortcuts={[]}
                      autoFocus={true}
                      translations={{ placeholder: "Search for user..." }}
                    />
                  </div>
                </div>
              </div>
              {isModInbox && (
                <Typography variant="body2" className={classes.modWarning}>
                  Moderators will be included in this conversation
                </Typography>
              )}
              <ErrorBoundary>
                <div className={classes.usersList}>
                  {/* Speed seems to be roughly proportional to hitsPerPage here */}
                  <Configure hitsPerPage={50} />
                  <Hits
                    hitComponent={(props) => (
                      <ExpandedUsersConversationSearchHit
                        {...props}
                        currentUser={currentUser}
                        onClose={onClose}
                        onSelect={(u) => {
                          toggleUserSelected(u);
                          setQuery("");
                        }}
                        isModInbox={isModInbox}
                        className={classes.hit}
                      />
                    )}
                  />
                </div>
              </ErrorBoundary>
            </div>
          </InstantSearch>
          <div className={classes.submitRow}>
            <EAButton onClick={() => initiateConversation(selectedUsers.map((u) => u._id))}>
              Create conversation
            </EAButton>
          </div>
        </div>
      </LWDialog>
    </AnalyticsContext>
  );
};

const NewConversationDialogComponent = registerComponent("NewConversationDialog", NewConversationDialog, { styles });

declare global {
  interface ComponentTypes {
    NewConversationDialog: typeof NewConversationDialogComponent;
  }
}
