import React from "react";
import { registerComponent } from "../../lib/vulcan-lib";
import { styles as postInfoStyles } from "../posts/NewPostHowToGuides";
import { AnalyticsContext } from "@/lib/analyticsEvents";
import { taggingNameSetting } from "@/lib/instanceSettings";
import { Link } from "@/lib/reactRouterWrapper";
import classNames from "classnames";

const wikiFaqLink = "/topics/ea-wiki-faq";

const styles = (theme: ThemeType) => ({
  ...postInfoStyles(theme),
  width: {
    width: 250,
    marginRight: 0,
    "@media (max-width: 1400px)": {
      width: 200,
    },
  },
  content: {
    fontWeight: 500,
    fontSize: 14,
    lineHeight: "140%",
    "& li": {
      marginLeft: -16,
      "&:not(:last-child)": {
        marginBottom: 8,
      },
    },
    "& a": {
      fontWeight: 600,
      color: theme.palette.primary.main,
    },
  },
});

const NewTagInfoBox = ({classes}: {classes: ClassesType<typeof styles>}) => {
  const tag = taggingNameSetting.get();
  return (
    <AnalyticsContext pageElementContext="newTagInfoBox">
      <div className={classNames(classes.root, classes.width)}>
        <div className={classes.title}>
          Adding a new {tag}
        </div>
        <div className={classes.content}>
          <p>
            Your {tag} may be rejected if:
          </p>
          <ol>
            <li>
              A similar {tag} already exists.
            </li>
            <li>
              The {tag} isn’t applied to three relevant posts by different
              authors (not counting your own) after you create it.
            </li>
            <li>
              You haven’t included at least a sentence defining the {tag}.
            </li>
          </ol>
          <p>
            Check out the <Link to={wikiFaqLink}>Wiki FAQ</Link> for more tips
            and explanations.
          </p>
        </div>
      </div>
    </AnalyticsContext>
  );
}

const NewTagInfoBoxComponent = registerComponent(
  "NewTagInfoBox",
  NewTagInfoBox,
  {styles},
);

declare global {
  interface ComponentTypes {
    NewTagInfoBox: typeof NewTagInfoBoxComponent
  }
}
