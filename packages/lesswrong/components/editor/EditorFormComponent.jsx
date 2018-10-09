import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Components, registerComponent, getDynamicComponent } from 'meteor/vulcan:core';
import Users from 'meteor/vulcan:users';
import { withStyles } from '@material-ui/core/styles';
import { editorStyles, postBodyStyles, commentBodyStyles } from '../../themes/stylePiping'
import Typography from '@material-ui/core/Typography';
import withUser from '../common/withUser';
import DraftJSEditor from '../async/EditorFormContainer'

const styles = theme => ({
  postEditor: {
    minHeight:250,
    ...editorStyles(theme, postBodyStyles)
  },
  commentEditor: {
    minHeight: 100,
    ...editorStyles(theme, commentBodyStyles)
  },
  markdownEditor: {
    fontSize: '1.4rem',
  },
  errorTextColor: {
    color: theme.palette.error.main
  }
})

class EditorFormComponent extends Component {
  constructor (props,context) {
    super(props,context);
    this.state  = {
      editor: (props) => <Components.Loading />,
      editorOverride: null,
    }
  }

  UNSAFE_componentWillMount() {
    this.setState({editor: DraftJSEditor});

    const removeUnusedFields = (data) => {
      let { content, body, htmlBody, ...newData } = data
      switch(this.getCurrentEditorType()) {
        case "draft-js":
          return {...newData, content}
        case "markdown":
          return {...newData, body}
        case "html":
          return {...newData, htmlBody}
      }
    }
    this.context.addToSubmitForm(removeUnusedFields);
  }

  handleEditorOverride = (e) => {
    const { currentUser } = this.props
    this.setState({editorOverride: this.getUserDefaultEditor(currentUser)})
  }

  renderEditorWarning = () => {
    const { classes, currentUser, document } = this.props
    return <Typography variant="body2" color="primary">
      This document was last edited in {document.lastEditedAs} format. Showing {this.getCurrentEditorType()} editor.
      <a className={classes.errorTextColor} onClick={this.handleEditorOverride}> Click here </a>
      to switch to {this.getUserDefaultEditor(currentUser)} editor (your default editor).
    </Typography>
  }

  getCurrentEditorType = () => {
    const { editorOverride } = this.state
    const { document, currentUser, enableMarkDownEditor } = this.props
    // If there is an override, return that
    if (editorOverride) {return editorOverride}
    // Otherwise, default to rich-text, but maybe show others
    if (document && (document.lastEditedAs === "html")) {
      return "html"
    } else if (document && (document.lastEditedAs === "markdown")) {
      return "markdown"
    } else if (document && (document.lastEditedAs === "draft-js")){
      return "draft-js"
    } else if (enableMarkDownEditor && Users.useMarkdownPostEditor(currentUser)){
      return "markdown"
    } else {
      return "draft-js"
    }
  }

  getUserDefaultEditor = (user) => {
    if (Users.useMarkdownPostEditor(user)) {
      return "markdown"
    } else {
      return "draft-js"
    }
  }

  render() {
    const AsyncEditor = this.state.editor
    const { editorOverride } = this.state
    const { document, currentUser, formType } = this.props
    const commentStyles = this.props.form && this.props.form.commentStyles
    const { classes, ...passedDownProps } = this.props
    return (
      <div className={commentStyles ? classes.commentEditor : classes.postEditor}>
        {!editorOverride && formType !== "new" && document && document.lastEditedAs && document.lastEditedAs !== this.getUserDefaultEditor(currentUser) && this.renderEditorWarning()}
        { this.getCurrentEditorType() === "markdown" &&
          <Components.MuiInput {...passedDownProps} className={classes.markdownEditor} name="body" />
        }
        { this.getCurrentEditorType() === "html" &&
          <Components.MuiInput {...passedDownProps} className={classes.markdownEditor} name="htmlBody" />
        }
        { this.getCurrentEditorType() === "draft-js" &&
          <div> <AsyncEditor {...passedDownProps}/> </div>
        }
      </div>

    )
  }
}

EditorFormComponent.contextTypes = {
  addToSubmitForm: PropTypes.func,
};

registerComponent('EditorFormComponent', EditorFormComponent, withUser, withStyles(styles, { name: "EditorFormComponent" }));
