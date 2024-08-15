import { registerComponent } from '../../lib/vulcan-lib';
import React, {useCallback, useState} from 'react';
import Input from '@material-ui/core/Input';
import PropTypes from 'prop-types'
import {useMessages} from "../common/withMessages";
import { useUpdate } from '../../lib/crud/withUpdate';
import { PostCategory } from '../../lib/collections/posts/helpers';
import { isFriendlyUI } from '../../themes/forumTheme';
import { isE2E } from '../../lib/executionEnvironment';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    ...theme.typography.display3,
    ...theme.typography.headerStyle,
    ...(isFriendlyUI ? {
      fontWeight: 700,
      fontSize: "3rem",
      marginBottom: 12,
      marginTop: 0,
    }: {
      fontSize: "4.5rem",
      marginTop: 34,
      marginBottom: 64,
    }),
    width: "100%",
    resize: "none",
    textAlign: "left",
    "& textarea": {
      overflowY: "hidden",
    },
  }
})

const placeholders: Record<PostCategory|"event", string> = {
  "post": "Post title",
  "event": "Event name",
  "question": "Question title",
  "linkpost": "Linkpost title"
}

const EditTitle = ({document, value, path, updateCurrentValues, classes}: {
  document: PostsBase,
  value: any,
  path: string,
  placeholder: string,
  updateCurrentValues: Function,
  classes: ClassesType
}) => {
  const { flash } = useMessages()
  const [lastSavedTitle, setLastSavedTitle] = useState<string|undefined>(document.title)
  const {mutate: updatePost} = useUpdate({
    collectionName: "Posts",
    fragmentName: 'PostsMinimumInfo',
  });
  const { isEvent, question, postCategory } = document;

  const effectiveCategory = isEvent ? "event" : question ? "question" as const : postCategory as PostCategory;
  const displayPlaceholder = placeholders[effectiveCategory];

  const handleChangeTitle = useCallback((event: React.FocusEvent<HTMLInputElement>) => {
    if (event.target.value !== lastSavedTitle && !!document._id) {
      setLastSavedTitle(event.target.value)
      void updatePost({
        selector: {_id: document._id},
        data: {title: event.target.value}
      }).then(() => flash({messageString: "Title has been changed."}));
    }
  }, [document, updatePost, lastSavedTitle, flash])

  return <Input
    className={classes.root}
    placeholder={displayPlaceholder}
    value={value}
    onChange={(event) => {
      updateCurrentValues({
        [path]: event.target.value
      })
    }}
    onBlur={handleChangeTitle}
    disableUnderline
    multiline={
      // For reasons we haven't been able to figure out, in a Playwright context
      // in the multi-post-submit test, this input (if it's multiline) winds up
      // zero-height, which causes `getByPlaceholder` to treat it as hidden,
      // which makes the test fail. Investigations suggest this is a bug inside
      // MaterialUI, rather than an issue with our code.
      !isE2E
    }
  />
};

(EditTitle as any).contextTypes = {
  addToSuccessForm: PropTypes.func,
  updateCurrentValues: PropTypes.func,
};

export const EditTitleComponent = registerComponent( "EditTitle", EditTitle, {styles} );

declare global {
  interface ComponentTypes {
    EditTitle: typeof EditTitleComponent
  }
}
