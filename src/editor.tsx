import React, { useEffect, useCallback, useState } from 'react';
import { StandardEditorProps } from '@grafana/data';
import { DivPanelOptions, getDivPanelState, setDivPanelState, defaults } from './types';
import { CodeEditor, Button } from '@grafana/ui';
import * as buble from 'buble';
import { css } from 'emotion';
//import { Console, Hook, Unhook } from 'console-feed';

const styles = {
  marginRight: css`
    margin-right: 10px;
  `,
  verticalSpace: css`
    margin-top: 10px;
    margin-bottom: 10px;
  `,
};

export const DivMonacoEditor: React.FC<StandardEditorProps<DivPanelOptions>> = ({ value, onChange }) => {
  const options = value || defaults;
  const { content } = options;

  const [editorContent, setEditorContent] = useState(content);

  const commitContent = (content: string) => {
    let cleanContent = '';
    let exportedFn = '';
    console.log('content', content);
    const isMatch = content.match(
      /export\s+(var|const|let)\s+([a-zA-Z0-9]+)\s*=\s*(?:function?(.*))?\s*\(\.*?\)\s*(?:=>?(.*))?\s*\{[^\}]+\}/s
    );
    if (isMatch) {
      cleanContent = content.replace('export', '');
      exportedFn = isMatch[2];
    }

    const transformed = buble.transform(cleanContent, {
      transforms: { dangerousTaggedTemplateString: true },
    });
    onChange({
      ...value,
      content,
      transformed: [transformed.code],
      exportedFn,
    });
  };

  const onSave = (content: string) => {
    commitContent(content);
  };

  const onClearClick = () => {
    setDivPanelState({
      ...getDivPanelState(),
      command: 'clear',
    });

    commitContent(content);
  };

  const onRunClick = useCallback(() => {
    setDivPanelState({
      ...getDivPanelState(),
      command: 'render',
    });
    commitContent(editorContent);
  }, [editorContent]);

  const onEditModeChange = useCallback((editMode: boolean) => {
    setDivPanelState({
      ...getDivPanelState(),
      editMode,
    });
  }, []);

  useEffect(() => {
    onEditModeChange(true);
    return () => {
      onEditModeChange(false);
    };
  });

  return (
    <>
      <CodeEditor
        language="javascript"
        width="100%"
        height="50vh"
        value={content}
        onSave={onSave}
        showLineNumbers
        onBlur={(value) => setEditorContent(value)}
      />
      <div className={styles.verticalSpace}>
        <Button onClick={onRunClick} className={styles.marginRight}>
          Run
        </Button>
        <Button onClick={onClearClick}>Clear</Button>
      </div>
      {/* <Console logs={logs} variant="dark" /> */}
    </>
  );
};
