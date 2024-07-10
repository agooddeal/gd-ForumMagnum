import React, { useCallback, useState } from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib";
import { usePeopleDirectory } from "./usePeopleDirectory";
import classNames from "classnames";

const styles = (theme: ThemeType) => ({
  root: {
    fontFamily: theme.palette.fonts.sansSerifStack,
  },
  rootMain: {
    padding: 4,
  },
  rootFilter: {
    position: "relative",
  },
  filterName: {
    cursor: "pointer",
    userSelect: "none",
    fontSize: 14,
    fontWeight: 500,
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: 12,
    borderRadius: theme.borderRadius.default,
    "& > *:first-child": {
      flexGrow: 1,
    },
    "&:hover": {
      background: theme.palette.grey[100],
    },
  },
  icon: {
    width: 16,
    height: 16,
    marginLeft: 16,
    color: theme.palette.grey[600],
  },
  backButton: {
    position: "absolute",
    top: 14,
    left: 8,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 18,
    width: 24,
    height: 24,
    userSelect: "none",
    cursor: "pointer",
    color: theme.palette.grey[600],
    borderRadius: theme.borderRadius.default,
    "&:hover": {
      background: theme.palette.grey[100],
    },
  },
  selectedTitle: {
    textAlign: "center",
    fontSize: 16,
    fontWeight: 600,
    padding: 16,
  },
  staticWrapper: {
    padding: 4,
  },
});

const PeopleDirectoryAllFiltersDropdown = ({classes}: {
  classes: ClassesType<typeof styles>,
}) => {
  const {filters} = usePeopleDirectory();
  const [selectedFilterName, setSelectedFilterName] = useState<string | null>(null);
  const selectedFilter = filters.find(
    ({filter}) => filter.title === selectedFilterName,
  );

  const clearSelection = useCallback(() => setSelectedFilterName(null), []);

  const {
    LWClickAwayListener, ForumIcon, PeopleDirectorySearchableFilter,
    PeopleDirectoryStaticFilter,
  } = Components;

  if (selectedFilter) {
    const {type, filter} = selectedFilter;
    return (
      <LWClickAwayListener onClickAway={clearSelection}>
        <div className={classNames(classes.root, classes.rootFilter)}>
          <div onClick={clearSelection} className={classes.backButton}>
            &lt;-
          </div>
          <div className={classes.selectedTitle}>
            {filter.title}
          </div>
          <div className={type === "static" ? classes.staticWrapper : undefined}>
            {type === "searchable"
              ? <PeopleDirectorySearchableFilter filter={filter} justContent />
              : <PeopleDirectoryStaticFilter filter={filter} justContent />
            }
          </div>
        </div>
      </LWClickAwayListener>
    );
  }

  return (
    <LWClickAwayListener onClickAway={clearSelection}>
      <div className={classNames(classes.root, classes.rootMain)}>
        {filters.map(({filter}) => (
          <div
            key={filter.title}
            className={classes.filterName}
            onClick={setSelectedFilterName.bind(null, filter.title)}
          >
            <span>{filter.title}</span>
            <ForumIcon icon="ThickChevronRight" className={classes.icon} />
          </div>
        ))}
      </div>
    </LWClickAwayListener>
  );
}

const PeopleDirectoryAllFiltersDropdownComponent = registerComponent(
  "PeopleDirectoryAllFiltersDropdown",
  PeopleDirectoryAllFiltersDropdown,
  {styles},
);

declare global {
  interface ComponentTypes {
    PeopleDirectoryAllFiltersDropdown: typeof PeopleDirectoryAllFiltersDropdownComponent
  }
}
