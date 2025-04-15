import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import { UltraFeedSettingsType, DEFAULT_SETTINGS, DEFAULT_SOURCE_WEIGHTS } from './ultraFeedSettingsTypes';
import { defineStyles, useStyles } from '../hooks/useStyles';
import classNames from 'classnames';
import { FeedItemSourceType } from './ultraFeedTypes';
import { useTracking } from '@/lib/analyticsEvents';

const styles = defineStyles('UltraFeedSettings', (theme: ThemeType) => ({
  root: {
    width: '100%',
  },
  settingGroup: {
    marginBottom: 16,
  },
  groupTitle: {
    fontSize: '1.1rem',
    fontWeight: 600,
    marginBottom: 4,
    fontFamily: theme.palette.fonts.sansSerifStack,
  },
  groupDescription: {
    marginBottom: 12,
    color: theme.palette.text.dim,
    fontSize: '0.9rem',
    fontFamily: theme.palette.fonts.sansSerifStack,
  },
  inputContainer: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: 10,
    flexWrap: 'wrap',
  },
  inputLabel: {
    marginRight: 12,
    fontFamily: theme.palette.fonts.sansSerifStack,
    flex: '0 0 180px',
    fontSize: '0.95rem',
  },
  inputDescription: {
    flex: '1 0 100%',
    marginTop: 4,
    marginBottom: 8,
    color: theme.palette.text.dim,
    fontSize: '0.85rem',
    fontFamily: theme.palette.fonts.sansSerifStack,
  },
  arrayInput: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  numberInput: {
    width: 70,
    padding: 6,
    border: '1px solid ' + theme.palette.grey[400],
    borderRadius: 4,
  },
  selectInput: {
    minWidth: 250,
    padding: 6,
    border: '1px solid ' + theme.palette.grey[400],
    borderRadius: 4,
    fontFamily: theme.palette.fonts.sansSerifStack,
  },
  buttonRow: {
    display: 'flex',
    justifyContent: 'flex-end',
    marginTop: 16,
  },
  button: {
    padding: '6px 12px',
    border: 'none',
    borderRadius: 4,
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.primary.contrastText,
    cursor: 'pointer',
    fontFamily: theme.palette.fonts.sansSerifStack,
    fontSize: '0.9rem',
    '&:hover': {
      backgroundColor: theme.palette.primary.dark,
    },
    '&:not(:last-child)': {
      marginRight: 12,
    },
  },
  resetButton: {
    backgroundColor: theme.palette.grey[400],
    color: theme.palette.grey[900],
    '&:hover': {
      backgroundColor: theme.palette.grey[500],
    },
  },
  invalidInput: {
    borderColor: theme.palette.error.main,
  },
  errorMessage: {
    color: theme.palette.error.main,
    fontSize: '0.8rem',
    marginTop: 4,
  },
  buttonDisabled: {
    backgroundColor: theme.palette.grey[400],
    color: theme.palette.grey[800],
    cursor: 'not-allowed',
    '&:hover': {
      backgroundColor: theme.palette.grey[400],
    },
  },
  disabled: {
    opacity: 0.5,
    pointerEvents: 'none',
  },
  sourceWeightInputContainer: {
    display: 'grid',
    gridTemplateColumns: '180px auto',
    gap: '8px 12px',
    alignItems: 'center',
    marginBottom: 12,
  },
  sourceWeightLabel: {
    fontFamily: theme.palette.fonts.sansSerifStack,
    fontSize: '0.95rem',
    textAlign: 'right',
  },
  sourceWeightInput: {
    width: 70,
    padding: 6,
    border: '1px solid ' + theme.palette.grey[400],
    borderRadius: 4,
    justifySelf: 'start',
  },
  sourceWeightDescription: {
    gridColumn: '2 / 3',
    color: theme.palette.text.dim,
    fontSize: '0.85rem',
    fontFamily: theme.palette.fonts.sansSerifStack,
  },
}));

interface UltraFeedSettingsComponentProps {
  settings: UltraFeedSettingsType;
  updateSettings: (newSettings: Partial<UltraFeedSettingsType>) => void;
  resetSettingsToDefault: () => void;
  classes: Record<string, string>;
  onClose?: () => void;
}

type AlgorithmFieldValidationRules = Pick<UltraFeedSettingsType, 
  'commentDecayFactor' | 
  'commentDecayBiasHours' | 
  'commentSeenPenalty' | 
  'quickTakeBoost'
>;

// Rename state type to reflect new field names
type FormValuesState = Omit<UltraFeedSettingsType, 'collapsedCommentTruncation' | 'lineClampNumberOfLines' | 'postTruncationBreakpoints' | 'commentTruncationBreakpoints' | 'sourceWeights' | 'commentDecayFactor' | 'commentDecayBiasHours' | 'commentSeenPenalty' | 'quickTakeBoost'> & {
  collapsedCommentTruncation: number | '';
  lineClampNumberOfLines: number | '';
  postTruncationBreakpoints: (number | '')[];
  commentTruncationBreakpoints: (number | '')[];
  sourceWeights: Record<FeedItemSourceType, number | '' >;
  commentDecayFactor: number | '';
  commentDecayBiasHours: number | '';
  commentSeenPenalty: number | '';
  quickTakeBoost: number | '';
};

const UltraFeedSettings = ({ settings, updateSettings, resetSettingsToDefault, onClose }: UltraFeedSettingsComponentProps) => {
  const { captureEvent } = useTracking();
  const classes = useStyles(styles);
  const [formValues, setFormValues] = useState<FormValuesState>(() => { 
    // Use new field names
    const { collapsedCommentTruncation, lineClampNumberOfLines, postTruncationBreakpoints, commentTruncationBreakpoints, commentDecayFactor, commentDecayBiasHours, commentSeenPenalty, quickTakeBoost } = settings;

    return {
      collapsedCommentTruncation,
      lineClampNumberOfLines,
      postTruncationBreakpoints,
      commentTruncationBreakpoints,
      sourceWeights: { ...DEFAULT_SOURCE_WEIGHTS, ...(settings.sourceWeights || {}) },
      commentDecayFactor,
      commentDecayBiasHours,
      commentSeenPenalty,
      quickTakeBoost,
    };
  });

  useEffect(() => {
    const updatedSourceWeights: Record<FeedItemSourceType, number | '' > = {
      ...DEFAULT_SOURCE_WEIGHTS,
      ...(settings.sourceWeights || {}),
    };
      
    setFormValues({
      ...settings,
      collapsedCommentTruncation: settings.collapsedCommentTruncation,
      lineClampNumberOfLines: settings.lineClampNumberOfLines,
      postTruncationBreakpoints: settings.postTruncationBreakpoints,
      commentTruncationBreakpoints: settings.commentTruncationBreakpoints,
      sourceWeights: updatedSourceWeights,
      commentDecayFactor: settings.commentDecayFactor,
      commentDecayBiasHours: settings.commentDecayBiasHours,
      commentSeenPenalty: settings.commentSeenPenalty,
      quickTakeBoost: settings.quickTakeBoost,
    });
  }, [settings]);

  const [errors, setErrors] = useState(() => {
    const initialErrors: Record<string, boolean> = {};
    Object.keys(DEFAULT_SOURCE_WEIGHTS).forEach(key => {
      initialErrors[key] = false;
    });
    return {
      postTruncationBreakpoints: [] as number[],
      commentTruncationBreakpoints: [] as number[],
      collapsedCommentTruncation: false,
      lineClampNumberOfLines: false,
      sourceWeights: initialErrors,
      commentDecayFactor: false,
      commentDecayBiasHours: false,
      commentSeenPenalty: false,
      quickTakeBoost: false,
    }
  });

  const handleArrayChange = useCallback((
    key: 'postTruncationBreakpoints' | 'commentTruncationBreakpoints',
    index: number,
    value: string
  ) => {
    setFormValues(prev => {
      const newArray: (number | '')[] = [...prev[key]];
      
      if (value === '') {
        newArray[index] = ''; 
        setErrors(prevErrors => {
          const newErrors = [...prevErrors[key]];
          if (!newErrors.includes(index)) {
            newErrors.push(index);
          }
          return { 
            ...prevErrors,
            [key]: newErrors
          };
        });
      } else {
        const numValue = parseInt(value, 10);
        newArray[index] = isNaN(numValue) ? '' : numValue; 
        
        if (!isNaN(numValue)) {
           setErrors(prevErrors => {
             const newErrors = [...prevErrors[key]].filter(i => i !== index);
             return { 
               ...prevErrors,
               [key]: newErrors
             };
           });
        } else {
           setErrors(prevErrors => {
             const fieldErrors = [...prevErrors[key]];
             if (!fieldErrors.includes(index)) fieldErrors.push(index);
             return { 
                ...prevErrors,
                [key]: fieldErrors 
            };
           });
        }
      }
      return {
        ...prev,
        [key]: newArray
      };
    });
  }, []);

  const handleNumberChange = useCallback((
    key: 'collapsedCommentTruncation' | 'lineClampNumberOfLines',
    value: string
  ) => {
    if (value === '') {
      setFormValues(prev => ({ ...prev, [key]: '' })); 
      setErrors(prev => ({ ...prev, [key]: true }));
    } else {
      const numValue = parseInt(value, 10);
      const newValue = isNaN(numValue) ? '' : numValue;
      setFormValues(prev => ({ ...prev, [key]: newValue })); 
      
      if (!isNaN(numValue)) {
        setErrors(prev => ({ ...prev, [key]: false }));
      } else {
         setErrors(prev => ({ ...prev, [key]: true })); 
      }
    }
  }, []);
  
  const handleSourceWeightChange = useCallback((key: FeedItemSourceType, value: string) => {
    let numValue: number | '' = '';
    let isValid = true;

    if (value === '') {
      numValue = '';
      isValid = true; 
    } else {
      const parsedValue = parseInt(value, 10);
      if (!isNaN(parsedValue) && parsedValue >= 0) {
        numValue = parsedValue;
        isValid = true;
      } else {
        numValue = ''; 
        isValid = false;
      }
    }

    setFormValues(prev => ({
      ...prev,
      sourceWeights: {
        ...prev.sourceWeights,
        [key]: numValue, 
      },
    }));

    
    setErrors(prev => ({
      ...prev,
      sourceWeights: {
        ...prev.sourceWeights,
        [key]: !isValid && value !== '',
      },
    }));
  }, []);

  // Rename handler and update keys
  const handleNumericSettingChange = useCallback(( 
    key: 'commentDecayFactor' | 'commentDecayBiasHours' | 'commentSeenPenalty' | 'quickTakeBoost' | 'collapsedCommentTruncation' | 'lineClampNumberOfLines',
    value: string,
    min?: number,
    max?: number
  ) => {
    if (value === '') {
      setFormValues(prev => ({ ...prev, [key]: '' })); 
      setErrors(prev => ({ ...prev, [key]: true }));
    } else {
      // Use parseFloat for decayFactor, seenPenalty, quickTakeBoost, AND decayBiasHours
      const useFloat = key === 'commentDecayFactor' || key === 'commentSeenPenalty' || key === 'quickTakeBoost' || key === 'commentDecayBiasHours';
      const numValue = useFloat ? parseFloat(value) : parseInt(value, 10);
      const newValue = isNaN(numValue) ? '' : numValue;
      let isValid = !isNaN(numValue);

      if (isValid) {
        if (min !== undefined && numValue < min) isValid = false;
        if (max !== undefined && numValue > max) isValid = false;
      }

      setFormValues(prev => ({ ...prev, [key]: newValue })); 
      setErrors(prev => ({ ...prev, [key]: !isValid }));
    }
  }, []);

  const hasErrors = useMemo(() => {
    const sourceWeightErrors = Object.entries(errors.sourceWeights).some(([key, hasError]) => {
      return hasError && String(formValues.sourceWeights[key as FeedItemSourceType]) !== '';
    });
    
    return errors.postTruncationBreakpoints.length > 0 ||
           errors.commentTruncationBreakpoints.length > 0 ||
           errors.collapsedCommentTruncation ||
           errors.lineClampNumberOfLines ||
           sourceWeightErrors ||
           errors.commentDecayFactor ||
           errors.commentDecayBiasHours ||
           errors.commentSeenPenalty ||
           errors.quickTakeBoost;
  }, [errors, formValues.sourceWeights]);

  const handleSave = useCallback(() => {
    let hasValidationErrors = false;
    const validatedValues: Partial<UltraFeedSettingsType> = {};
    const validatedWeights: Record<FeedItemSourceType, number> = Object.keys(DEFAULT_SOURCE_WEIGHTS).reduce((acc, key) => {
      acc[key as FeedItemSourceType] = 0;
      return acc;
    }, {} as Record<FeedItemSourceType, number>);

    ['postTruncationBreakpoints', 'commentTruncationBreakpoints'].forEach(key => {
      const arrKey = key as 'postTruncationBreakpoints' | 'commentTruncationBreakpoints';
      const arr: (number|string)[] = formValues[arrKey]; 
      const validArr: number[] = [];
      arr.forEach((val, index) => {
        const numVal = parseInt(String(val), 10);
        if (isNaN(numVal)) {
           hasValidationErrors = true; 
           setErrors(prev => {
            const fieldErrors = [...prev[arrKey]];
            if (!fieldErrors.includes(index)) fieldErrors.push(index);
            return { ...prev, [arrKey]: fieldErrors };
           });
        } else {
          validArr.push(numVal);
        }
      });
      if (hasValidationErrors) { validatedValues[arrKey] = undefined } 
      else { validatedValues[arrKey] = validArr; }
    });
    
    ['collapsedCommentTruncation', 'lineClampNumberOfLines'].forEach(key => {
       const numKey = key as 'collapsedCommentTruncation' | 'lineClampNumberOfLines';
       const val: number | string = formValues[numKey];
       const numVal = parseInt(String(val), 10);
      if (isNaN(numVal)) {
         hasValidationErrors = true;
         setErrors(prev => ({ ...prev, [numKey]: true }));
      } 
      
      if (hasValidationErrors) { validatedValues[numKey] = undefined }
      else { validatedValues[numKey] = numVal; }
    });
    

    Object.entries(formValues.sourceWeights).forEach(([key, val]) => {
      const sourceKey = key as FeedItemSourceType;
      let weightValue = 0;
      
      if (String(val) === '') { 
        weightValue = 0;
      } else {
        const numVal = parseInt(String(val), 10);
        if (isNaN(numVal) || numVal < 0) {
          hasValidationErrors = true;
          setErrors(prev => ({
            ...prev,
            sourceWeights: { ...prev.sourceWeights, [sourceKey]: true }
          }));
          return;
        } else {
          weightValue = numVal;
        }
      }
      if (!isNaN(parseInt(String(val), 10)) || String(val) === '') { 
         validatedWeights[sourceKey] = weightValue;
      }
    });
    
    
    if (!hasValidationErrors) {
       validatedValues.sourceWeights = validatedWeights;
    } else {
        validatedValues.sourceWeights = undefined; 
    }

    // Validate Algorithm Fields
    const algorithmFields: (keyof AlgorithmFieldValidationRules)[] = [
      'commentDecayFactor', 
      'commentDecayBiasHours',
      'commentSeenPenalty',
      'quickTakeBoost'
    ];
    // Use renamed specific type
    const algorithmFieldValidation: Record<keyof AlgorithmFieldValidationRules, {min?: number, max?: number}> = {
      commentDecayFactor: { min: 0.1 },
      commentDecayBiasHours: { min: 0 },
      commentSeenPenalty: { min: 0.0, max: 1.0 },
      quickTakeBoost: { min: 0.1 }
    };

    algorithmFields.forEach(key => {
      const val = formValues[key];
      const validation = algorithmFieldValidation[key]; 
      const numVal = parseFloat(String(val)); // Use parseFloat here
      let fieldError = isNaN(numVal);

      if (!fieldError && validation) {
        if (validation.min !== undefined && numVal < validation.min) fieldError = true;
        if (validation.max !== undefined && numVal > validation.max) fieldError = true;
      }

      if (fieldError) {
        hasValidationErrors = true;
        setErrors(prev => ({ ...prev, [key]: true }));
      } else {
        validatedValues[key] = numVal;
      }
    });

    if (hasValidationErrors) {
      return; 
    }

    const finalSettingsToUpdate: Partial<UltraFeedSettingsType> = {};
    if (validatedValues.postTruncationBreakpoints !== undefined) {
      finalSettingsToUpdate.postTruncationBreakpoints = validatedValues.postTruncationBreakpoints;
    }
    if (validatedValues.commentTruncationBreakpoints !== undefined) {
      finalSettingsToUpdate.commentTruncationBreakpoints = validatedValues.commentTruncationBreakpoints;
    }
    if (validatedValues.collapsedCommentTruncation !== undefined) {
      finalSettingsToUpdate.collapsedCommentTruncation = validatedValues.collapsedCommentTruncation;
    }
    if (validatedValues.lineClampNumberOfLines !== undefined) {
      finalSettingsToUpdate.lineClampNumberOfLines = validatedValues.lineClampNumberOfLines;
    }
    if (validatedValues.sourceWeights !== undefined) {
      finalSettingsToUpdate.sourceWeights = validatedValues.sourceWeights;
    }
    if (validatedValues.commentDecayFactor !== undefined) {
      finalSettingsToUpdate.commentDecayFactor = validatedValues.commentDecayFactor;
    }
    if (validatedValues.commentDecayBiasHours !== undefined) {
      finalSettingsToUpdate.commentDecayBiasHours = validatedValues.commentDecayBiasHours;
    }
    if (validatedValues.commentSeenPenalty !== undefined) {
      finalSettingsToUpdate.commentSeenPenalty = validatedValues.commentSeenPenalty;
    }
    if (validatedValues.quickTakeBoost !== undefined) {
      finalSettingsToUpdate.quickTakeBoost = validatedValues.quickTakeBoost;
    }

    if (Object.keys(finalSettingsToUpdate).length > 0) {
       updateSettings(finalSettingsToUpdate);
    }

    captureEvent("ultraFeedSettingsUpdated", {
      oldSettings: settings,
      newSettings: finalSettingsToUpdate
    });
    
  }, [formValues, updateSettings, setErrors, captureEvent, settings]);
  
  const handleReset = useCallback(() => {
    resetSettingsToDefault();
  }, [resetSettingsToDefault]);
  
  return (
    <div className={classes.root}>
      <div className={classes.settingGroup}>
        <h3 className={classes.groupTitle}>Source Weights</h3>
        <div className={classes.groupDescription}>
          Relative weights (not %) determining how frequently items from different sources appear in the feed.
        </div>
        <div className={classes.sourceWeightInputContainer}>
          {Object.keys(DEFAULT_SOURCE_WEIGHTS).map((key) => {
            const sourceKey = key as FeedItemSourceType;
            return (
              <React.Fragment key={sourceKey}>
                <label className={classes.sourceWeightLabel}>{sourceKey}:</label>
                <input
                  type="number"
                  className={classNames(classes.sourceWeightInput, {
                    [classes.invalidInput]: errors.sourceWeights[sourceKey]
                  })}
                  value={formValues.sourceWeights[sourceKey] ?? ''}
                  onChange={(e) => handleSourceWeightChange(sourceKey, e.target.value)}
                  min={0}
                />
                {errors.sourceWeights[sourceKey] && (
                   <p className={classNames(classes.errorMessage, classes.sourceWeightDescription)}>Weight must be a non-negative number.</p>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
      
      <div className={classes.settingGroup}>
        <h3 className={classes.groupTitle}>Truncation / Expansion</h3>
        <div className={classes.groupDescription}>
          Word count limits for expanding content. Lower values show less initially.
        </div>
        
        <div className={classes.inputContainer}>
          <label className={classes.inputLabel}>Post truncation levels:</label>
          <div className={classes.arrayInput}>
            {formValues.postTruncationBreakpoints.map((value, index) => (
              <input
                key={index}
                type="number"
                className={classNames(classes.numberInput, {
                  [classes.invalidInput]: errors.postTruncationBreakpoints.includes(index)
                })}
                value={value}
                onChange={(e) => handleArrayChange('postTruncationBreakpoints', index, e.target.value)}
                min={1}
              />
            ))}
          </div>
          <p className={classes.inputDescription}>
            Default: {DEFAULT_SETTINGS.postTruncationBreakpoints.join(', ')} words
          </p>
          {errors.postTruncationBreakpoints.length > 0 && (
            <p className={classes.errorMessage}>All fields must contain a valid number</p>
          )}
        </div>
        <div className={classes.inputContainer}>
          <div>
            <label className={classes.inputLabel} style={{ display: 'block', marginBottom: '4px' }}>Comment Line Clamp Lines:</label>
            <input
              type="number"
              className={classNames(classes.numberInput, {
                [classes.invalidInput]: errors.lineClampNumberOfLines
              })}
              value={formValues.lineClampNumberOfLines}
              onChange={(e) => handleNumberChange('lineClampNumberOfLines', e.target.value)}
              min={0}
              max={10}
            />
            <p className={classes.inputDescription} style={{ paddingLeft: 0, marginTop: '4px' }}>
              Number of lines to show in collapsed comments (0 disables line clamp, 2-10 lines recommended)
            </p>
            {errors.lineClampNumberOfLines && (
              <p className={classes.errorMessage}>Field must contain a valid number between 0 and 10</p>
            )}
          </div>
        </div>
        <div className={classes.inputContainer}>
          <div>
            <label className={classes.inputLabel} style={{ display: 'block', marginBottom: '4px' }}>Collapsed comment:</label>
            <div className={classes.arrayInput}>
              <input
                type="number"
                className={classNames(classes.numberInput, {
                  [classes.invalidInput]: errors.collapsedCommentTruncation
                })}
                value={formValues.collapsedCommentTruncation}
                onChange={(e) => handleNumberChange('collapsedCommentTruncation', e.target.value)}
                min={1}
              />
            </div>
            <p className={classes.inputDescription} style={{ paddingLeft: 0, marginTop: '4px' }}>
              Only applies if line clamp set to 0. Default: {DEFAULT_SETTINGS.collapsedCommentTruncation} words
            </p>
            {errors.collapsedCommentTruncation && (
              <p className={classes.errorMessage}>Field must contain a valid number</p>
            )}
          </div>
        </div>
        <div className={classes.inputContainer}>
          <label className={classes.inputLabel}>Expanded comments:</label>
          <div className={classes.arrayInput}>
            {formValues.commentTruncationBreakpoints.map((value, index) => (
              <input
                key={index}
                type="number"
                className={classNames(classes.numberInput, {
                  [classes.invalidInput]: errors.commentTruncationBreakpoints.includes(index)
                })}
                value={value}
                onChange={(e) => handleArrayChange('commentTruncationBreakpoints', index, e.target.value)}
                min={1}
              />
            ))}
          </div>
          <p className={classes.inputDescription}>
            Default: {DEFAULT_SETTINGS.commentTruncationBreakpoints.join(', ')} words
          </p>
          {errors.commentTruncationBreakpoints.length > 0 && (
            <p className={classes.errorMessage}>All fields must contain a valid number</p>
          )}
        </div>
      </div>
      
      <div className={classes.settingGroup}>
        <h3 className={classes.groupTitle}>Algorithm Tuning</h3>
        <div className={classes.groupDescription}>
          Parameters for comment scoring and ranking.
        </div>

        <div className={classes.inputContainer}>
           <label className={classes.inputLabel}>Comment Decay Factor:</label>
           <input
             type="number"
             step="0.1"
             className={classNames(classes.numberInput, { [classes.invalidInput]: errors.commentDecayFactor })}
             value={formValues.commentDecayFactor}
             onChange={(e) => handleNumericSettingChange('commentDecayFactor', e.target.value, 0.1)}
             min={0.1}
           />
           <p className={classes.inputDescription}>
             HN-style decay exponent (e.g., 1.8). Higher values decay faster. Must be {`>`} 0.
           </p>
           {errors.commentDecayFactor && (
             <p className={classes.errorMessage}>Must be a number greater than 0.</p>
           )}
        </div>

        <div className={classes.inputContainer}>
           <label className={classes.inputLabel}>Comment Decay Bias (Hours):</label>
           <input
             type="number"
             step="0.5"
             className={classNames(classes.numberInput, { [classes.invalidInput]: errors.commentDecayBiasHours })}
             value={formValues.commentDecayBiasHours}
             onChange={(e) => handleNumericSettingChange('commentDecayBiasHours', e.target.value, 0)}
             min={0}
           />
           <p className={classes.inputDescription}>
             HN-style age offset in hours (e.g., 2). Prevents infinite scores at age 0. Cannot be negative.
           </p>
           {errors.commentDecayBiasHours && (
             <p className={classes.errorMessage}>Must be a non-negative number.</p>
           )}
        </div>

        <div className={classes.inputContainer}>
           <label className={classes.inputLabel}>Comment Seen Penalty:</label>
           <input
             type="number"
             step="0.05"
             className={classNames(classes.numberInput, { [classes.invalidInput]: errors.commentSeenPenalty })}
             value={formValues.commentSeenPenalty}
             onChange={(e) => handleNumericSettingChange('commentSeenPenalty', e.target.value, 0.0, 1.0)}
             min={0.0}
             max={1.0}
           />
           <p className={classes.inputDescription}>
             Multiplier applied to comment score if viewed (e.g., 0.6 means 60% score retained). Range 0.0 - 1.0.
           </p>
           {errors.commentSeenPenalty && (
             <p className={classes.errorMessage}>Must be a number between 0.0 and 1.0.</p>
           )}
        </div>

        <div className={classes.inputContainer}>
           <label className={classes.inputLabel}>Quick Take Boost:</label>
           <input
             type="number"
             step="0.1"
             className={classNames(classes.numberInput, { [classes.invalidInput]: errors.quickTakeBoost })}
             value={formValues.quickTakeBoost}
             onChange={(e) => handleNumericSettingChange('quickTakeBoost', e.target.value, 0.1)} 
             min={0.1}
           />
           <p className={classes.inputDescription}>
             Score multiplier for shortform comments/quick takes (e.g., 1.5 = 50% boost). Must be {`>`} 0.
           </p>
           {errors.quickTakeBoost && ( 
             <p className={classes.errorMessage}>Must be a number greater than 0.</p>
           )}
        </div>
      </div>
      
      <div className={classes.buttonRow}>
        <button 
          className={`${classes.button} ${classes.resetButton}`}
          onClick={handleReset}
        >
          Reset to Defaults
        </button>
        <button 
          className={classNames(classes.button, {
            [classes.buttonDisabled]: hasErrors
          })}
          onClick={handleSave}
          disabled={hasErrors}
        >
          Save Changes
        </button>
      </div>
    </div>
  );
};

const UltraFeedSettingsComponent = registerComponent('UltraFeedSettings', UltraFeedSettings);

export default UltraFeedSettingsComponent;

declare global {
  interface ComponentTypes {
    UltraFeedSettings: typeof UltraFeedSettingsComponent
  }
} 
