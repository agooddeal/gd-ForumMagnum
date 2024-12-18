import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { defineStyles, useStyles } from '../hooks/useStyles';
import type { WikiTagNode } from './types';

const styles = defineStyles("WikiTagNestedList", (theme: ThemeType) => ({
  root: {
    width: "100%",
  },
  childrenList: {
    display: "flex",
    flexDirection: "column",
    width: "100%",
  },
  showMoreChildren: {
    fontSize: 12,
    fontWeight: 400,
    // TODO: put this into a theme
    color: "#426c46",
    marginBottom: 8,
    marginTop: 2,
    marginLeft: 16,
    width: "100%",
  },
}));

interface WikiTagNestedListProps {
  pages: WikiTagNode[];
  nestingLevel?: number;
  maxInitialShow?: number;
  totalChildrenCount?: number;
  onHover?: (wikitag: WikiTagNode | null) => void;
  onClick?: (wikitag: WikiTagNode) => void;
  showArbitalIcons?: boolean;
}

const WikiTagNestedList = ({
  pages,
  nestingLevel = 0,
  maxInitialShow = 40,
  totalChildrenCount,
  onHover,
  onClick,
  showArbitalIcons = false,
}: WikiTagNestedListProps) => {
  const { ConceptItem } = Components;
  const classes = useStyles(styles);

  return (
    <div className={classes.childrenList}>
      {pages.slice(0, maxInitialShow).map(page => (
        <ConceptItem 
          key={page._id} 
          wikitag={page} 
          nestingLevel={nestingLevel} 
          onHover={onHover}
          onClick={onClick}
          showArbitalIcon={showArbitalIcons}
        />
      ))}
      {pages.length > maxInitialShow && (
        <div className={classes.showMoreChildren}>
          {`Show more (${(totalChildrenCount ?? pages.length) - maxInitialShow} nested pages)`}
        </div>
      )}
    </div>
  );
}

const WikiTagNestedListComponent = registerComponent('WikiTagNestedList', WikiTagNestedList);

export default WikiTagNestedListComponent;

declare global {
  interface ComponentTypes {
    WikiTagNestedList: typeof WikiTagNestedListComponent
  }
}
