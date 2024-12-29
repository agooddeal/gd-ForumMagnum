import { Command, Plugin } from '@ckeditor/ckeditor5-core';
import type { Element } from '@ckeditor/ckeditor5-engine';
import { ButtonView } from '@ckeditor/ckeditor5-ui';
import insertClaimIcon from './ckeditor5-insert-claim-icon.svg';
import type { ClaimsPluginConfiguration } from "../../packages/lesswrong/components/editor/claims/elicitClaims";
import type { DowncastConversionApi } from '@ckeditor/ckeditor5-engine';

export default class ClaimsPlugin extends Plugin {
  init() {
    this.editor.commands.add('insertClaim', new InsertClaimCommand(this.editor));
    
    this.editor.ui.componentFactory.add('insertClaimButton', (locale) => {
      const command: InsertClaimCommand = this.editor.commands.get('insertClaim');
      const buttonView = new ButtonView(locale);
      
      buttonView.set({
        label: 'Insert Claim',
        icon: insertClaimIcon,
        tooltip: true,
      });
      
      this.listenTo(buttonView, 'execute', () => this.editor.execute('insertClaim'));
      return buttonView;
    });
    
    this._defineSchema();
    this._defineConverters();
  }
  
  private _defineSchema() {
    const schema = this.editor.model.schema;
    
    schema.register('claim', {
      allowWhere: '$block',
      allowAttributes: ['claimId'],
    });
  }

  private _defineConverters() {
    const config: ClaimsPluginConfiguration = this.editor.config.get('claims');
    const editor = this.editor;
    const conversion = editor.conversion;

    conversion.for('upcast').elementToElement({
      model: (viewElement, {writer}) => {
        return writer.createElement("claim", {
          claimId: viewElement.getAttribute("data-elicit-id"),
        });
      },
      view: {name: "div", classes: "elicit-binary-prediction"},
    });
    conversion.for('editingDowncast').elementToStructure({
      model: {
        name: "claim",
      },
      view: (modelElement: Element, conversionApi: DowncastConversionApi) => {
        const { writer: downcastWriter } = conversionApi;
        
        const reactWrapper = downcastWriter.createRawElement('div', {},
          (domElement) => {
            const claimId = modelElement.getAttribute("claimId");
            config.renderClaimPreviewInto(domElement, claimId);
          }
        );
        return downcastWriter.createContainerElement('div', {}, [
          reactWrapper
        ]);
      }
    });
    conversion.for('dataDowncast').elementToStructure({
      model: {
        name: "claim",
      },
      view: (modelElement: Element, conversionApi: DowncastConversionApi) => {
        const { writer } = conversionApi;
        return writer.createContainerElement('div', {
          class: "elicit-binary-prediction",
          "data-elicit-id": modelElement.getAttribute("claimId"),
        }, [
          writer.createText("Prediction"),
        ]);
      }
    });
  }
}

export class InsertClaimCommand extends Command {
  execute() {
    const config: ClaimsPluginConfiguration = this.editor.config.get('claims');

    // Get the selected range, and convert it to text
    const selection = this.editor.model.document.selection;
    if (selection.isCollapsed) return;
    const range = selection.getFirstRange();

    // Gather the text content from text nodes.
    let textContent = '';

    for (const item of range.getItems({ shallow: false })) {
      // item could be "textNode" or "$textProxy", both have a `.data` property
      if (item.is('$textProxy') || item.is('$text')) {
        textContent += item.data;
      }
    }


    // Open the create-claim dialog, pre-populated with the selected text
    config.openNewClaimDialog({
      initialTitle: textContent,
      onSubmit: (claim: ElicitQuestionFragment) => {
        // Replace the selection with an embedded claim
        this.editor.model.change(writer => {
          writer.remove(range);
          //writer.insertText(claim.title, range.start);
          
          const claimElement = writer.createElement("claim", {
            claimId: claim._id,
          });
          writer.insert(claimElement, range.start);
        });
      },
      onCancel: () => {
        console.log("Cancelled");
      },
    });
  }
}
