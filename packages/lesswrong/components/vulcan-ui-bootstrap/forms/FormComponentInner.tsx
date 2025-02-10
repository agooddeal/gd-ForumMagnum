import React, { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { registerComponent, instantiateComponent, Components } from '../../../lib/vulcan-lib';
import classNames from 'classnames';
import { HIGHLIGHT_DURATION } from '../../comments/CommentFrame';
import { useLocation } from '../../../lib/routeUtil';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';

const styles = defineStyles("FormComponentInner", (theme: ThemeType) => ({
  formComponentClear: {
    "& span": {
      position: "relative",
      top: 20,
      padding: 10,
    },
  },
  '@keyframes higlight-animation': {
    from: {
      // In most cases it would look better with a border. But because this has to support so many different components, it's hard to know what the border should be, so instead just use a background color.
      backgroundColor: theme.palette.panelBackground.commentHighlightAnimation,
      borderRadius: 5,
    },
    to: {
      backgroundColor: "none",
      borderRadius: 5,
    }
  },
  highlightAnimation: {
    animation: `higlight-animation ${HIGHLIGHT_DURATION}s ease-in-out 0s;`
  },
}));

const FormComponentInner = (props: any) => {
  const [highlight, setHighlight] = useState(false);
  const classes = useStyles(styles);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { query } = useLocation();

  const {
    inputClassName,
    name,
    input,
    beforeComponent,
    afterComponent,
    errors,
  } = props;


  // If highlightField is set to this field, scroll it into view and highlight it
  useEffect(() => {
    // NOTE: If you are grepping for highlightField because you tried it and it didn't work, it's possible that
    // this is because the field is of type FormNestedArray or FormNestedObject. Currently these fields don't
    // support highlighting (see packages/lesswrong/components/vulcan-forms/FormComponent.tsx for where these fields are rendered)
    if (name && name === query?.highlightField) {
      scrollRef.current?.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
      setHighlight(true);
      setTimeout(() => {
        setHighlight(false);
      }, HIGHLIGHT_DURATION * 1000);
    }
  }, []);

  const renderClear = () => {
    if (
      ['datetime', 'time', 'select', 'radiogroup', 'SelectLocalgroup'].includes(props.input) &&
      !props.hideClear
    ) {
      return (
        <a
          className={classes.formComponentClear}
          title="Clear field"
          onClick={props.clearField}
        >
          <span>✕</span>
        </a>
      );
    }
  };

  const getProperties = () => {
    const { name, path, options, label, onChange, value, disabled, inputType } = props;

    // these properties are whitelisted so that they can be safely passed to the actual form input
    // and avoid https://facebook.github.io/react/warnings/unknown-prop.html warnings
    const inputProperties = {
      name,
      path,
      options,
      label,
      onChange: (event: AnyBecauseTodo) => {
        // FormComponent's handleChange expects value as argument; look in target.checked or target.value
        const inputValue = inputType === 'checkbox' ? event.target.checked : event.target.value;
        onChange(inputValue);
      },
      value,
      disabled,
      ...props.inputProperties,
    };

    return {
      ...props,
      inputProperties,
    };
  };

  const hasErrors = errors && errors.length;

  const inputName = typeof input === 'function' ? input.name : input;
  const inputClass = classNames(
    'form-input',
    inputClassName,
    `input-${name}`,
    `form-component-${inputName || 'default'}`,
    { 'input-error': hasErrors }
  );
  const properties = getProperties();

  const FormInput = props.formInput;

  return (
    <div className={classNames(inputClass, {[classes.highlightAnimation]: highlight})} ref={scrollRef}>
      {instantiateComponent(beforeComponent, properties)}
      <FormInput {...properties}/>
      {hasErrors ? <Components.FieldErrors errors={errors} /> : null}
      {renderClear()}
      {instantiateComponent(afterComponent, properties)}
    </div>
  );
}

(FormComponentInner as any).propTypes = {
  inputClassName: PropTypes.string,
  name: PropTypes.string.isRequired,
  input: PropTypes.any,
  beforeComponent: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  afterComponent: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  clearField: PropTypes.func.isRequired,
  errors: PropTypes.array.isRequired,
  help: PropTypes.node,
  onChange: PropTypes.func.isRequired,
  inputComponent: PropTypes.func,
  classes: PropTypes.any,
};

const FormComponentInnerComponent = registerComponent('FormComponentInner', FormComponentInner, {styles});

declare global {
  interface ComponentTypes {
    FormComponentInner: typeof FormComponentInnerComponent
  }
}
