import React, { ReactNode } from "react";
import { registerComponent } from "@/lib/vulcan-lib";
import { AnalyticsContext } from "@/lib/analyticsEvents";
import classNames from "classnames";

const styles = (theme: ThemeType) => ({
  root: {
    position: "relative",
    display: "flex",
    flexDirection: "column",
    justifyContent: "flex-start",
    width: "100%",
  },
  container: {
    width: 700,
    maxWidth: "100%",
    minHeight: "100%",
    margin: "0 auto",
  },
  padding: {
    paddingTop: 40 + theme.spacing.mainLayoutPaddingTop,
    paddingLeft: 40,
    paddingRight: 40,
    paddingBottom: 60,
    [theme.breakpoints.down("sm")]: {
      paddingLeft: 20,
      paddingRight: 20,
    },
    [theme.breakpoints.down("xs")]: {
      paddingLeft: 12,
      paddingRight: 12,
    },
  },
  center: {
    alignItems: "center",
  },
  left: {
    alignItems: "flex-start",
  },
  fullHeight: {
    height: "100%",
  },
});

/**
 * Wrapped component for all wrapped sections. It is _not_ safe to use
 * ForumWrappedContext here as this component is also used when the page is
 * still loading.
 */
const WrappedSection = ({
  pageSectionContext,
  align = "center",
  fullHeight,
  noPadding,
  children,
  className,
  classes,
}: {
  pageSectionContext: string,
  align?: "left" | "center",
  fullHeight?: boolean,
  noPadding?: boolean,
  children?: ReactNode,
  className?: string,
  classes: ClassesType<typeof styles>,
}) => {
  return (
    <AnalyticsContext pageSectionContext={pageSectionContext}>
      <section className={classNames(
        classes.root,
        className,
        !noPadding && classes.padding,
        align === "left" && classes.left,
        align === "center" && classes.center,
        fullHeight && classes.fullHeight,
      )}>
        <div className={classes.container}>
          {children}
        </div>
      </section>
    </AnalyticsContext>
  );
}

const WrappedSectionComponent = registerComponent(
  "WrappedSection",
  WrappedSection,
  {styles},
);

declare global {
  interface ComponentTypes {
    WrappedSection: typeof WrappedSectionComponent
  }
}
