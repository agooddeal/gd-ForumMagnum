import React from "react";
import { Components, registerComponent } from "@/lib/vulcan-lib";
import { useForumWrappedContext } from "./hooks";

const styles = (_theme: ThemeType) => ({
  root: {
    maxWidth: 480,
    margin: "60px auto 0",
  },
});

const WrappedThankYouSection = ({classes}: {
  classes: ClassesType<typeof styles>,
}) => {
  const {currentUser} = useForumWrappedContext();
  const {WrappedSection, WrappedHeading} = Components;
  return (
    <WrappedSection pageSectionContext="thankYou">
      <div className={classes.root}>
        <WrappedHeading>
          Thanks for being part of the EA Forum {currentUser?.displayName}
        </WrappedHeading>
        <div>
          You’re helping the community think about how to do the most good in
          the world
        </div>
      </div>
    </WrappedSection>
  );
}

const WrappedThankYouSectionComponent = registerComponent(
  "WrappedThankYouSection",
  WrappedThankYouSection,
  {styles},
);

declare global {
  interface ComponentTypes {
    WrappedThankYouSection: typeof WrappedThankYouSectionComponent
  }
}
