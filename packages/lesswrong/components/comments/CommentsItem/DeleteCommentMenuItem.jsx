import React, { PureComponent } from 'react';
import { registerComponent, withMessages, Components } from 'meteor/vulcan:core';
import { MenuItem } from 'material-ui';
import PropTypes from 'prop-types';
import withModerateComment from './withModerateComment.js'
import Dialog from 'material-ui/Dialog';
import FlatButton from 'material-ui/FlatButton';
import TextField from 'material-ui/TextField';

class DeleteCommentMenuItem extends PureComponent {

  constructor(props) {
    super(props);

    this.state = {
      open: false,
      deletedReason: "",
    };
  }

  handleDelete = (event) => {
    event.preventDefault();
    this.props.moderateCommentMutation({
      commentId: this.props.comment._id,
      deleted: true,
      deletedPublic: false,
      deletedReason: this.state.deletedReason,
    }).then(()=>this.props.flash("Successfully deleted comment", "success")).catch(/* error */);
    this.setState({open:false})
  }

  handleDeletePublic = (event) => {
    event.preventDefault();
    this.props.moderateCommentMutation({
      commentId: this.props.comment._id,
      deleted: true,
      deletedPublic: true,
      deletedReason: this.state.deletedReason,
    }).then(()=>this.props.flash("Successfully deleted comment", "success")).catch(/* error */);
    this.setState({open:false})
  }

  handleUndoDelete = (event) => {
    event.preventDefault();
    this.props.moderateCommentMutation({
      commentId: this.props.comment._id,
      deleted:false,
      deletedReason:"",
    }).then(()=>this.props.flash("Successfully restored comment", "success")).catch(/* error */);
  }

  render() {

    const modalActions = [
      <FlatButton
        label="Cancel"
        primary={true}
        onClick={()=>{this.setState({open:false})}}
      />,
      <FlatButton
        label="Delete Without Trace"
        primary={true}
        style={{float:"left"}}
        onClick={this.handleDelete}
      />,
      <FlatButton
        label="Delete"
        primary={false}
        onClick={this.handleDeletePublic}
      />,
    ]

    if (!this.props.comment.deleted) {
      return (
        <MenuItem
          className="comment-menu-item-delete"
          onTouchTap={()=>{this.setState({open:true})}}
          primaryText="Delete"
        >
          <Dialog
            style={{zIndex:2101}}
            contentStyle={{maxWidth:"540px"}}
            title="Delete Comment"
            actions={modalActions}
            open={this.state.open}
            onRequestClose={this.handleClose}
          >
            <p>Are you sure you want to delete this comment?</p>
            <TextField
              id="comment-menu-item-delete-reason"
              hintText="Reason for deleting (optional)"
              multiLine={true}
              underlineShow={false}
              value={this.state.deletedReason}
              onChange={((event,newValue)=> {this.setState({deletedReason:newValue})})}
              />
          </Dialog>
        </MenuItem>
      )
    } else if (this.props.comment.deleted) {
      return <MenuItem onTouchTap={ this.handleUndoDelete } primaryText="Undo Delete" />
    }
  }
}

const mutationOptions = {
  fragmentName: "CommentsList"
};

registerComponent('DeleteCommentMenuItem', DeleteCommentMenuItem, [withModerateComment, mutationOptions], withMessages);
export default DeleteCommentMenuItem;
