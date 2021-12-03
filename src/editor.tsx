import React, { useEffect, useCallback } from 'react';
import { StandardEditorProps } from '@grafana/data';
import { DivPanelOptions, defaultContent, getDivPanelState, setDivPanelState, defaults } from './types';
import { CodeEditor, Button } from '@grafana/ui';
//import { Console, Hook, Unhook } from 'console-feed';

export const DivMonacoEditor: React.FC<StandardEditorProps<DivPanelOptions>> = ({ value, onChange }) => {
  const options = value || defaults;
  const content = options?.content || defaultContent;
  // const [logs, setLogs] = useState<any[]>([]);
  // onChange({
  //   ...value,
  //   editMode: true,
  // });

  // run once!
  // useEffect((): any => {
  //   const hookedConsole = Hook(
  //     window.console,
  //     (log: any) => setLogs((currLogs: Console[]): any => [...currLogs, log]),
  //     false
  //   );
  //   return () => Unhook(hookedConsole);
  // }, []);

  const commitContent = (content: string) => {
    onChange({
      ...value,
      content,
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

  const onRunClick = () => {
    setDivPanelState({
      ...getDivPanelState(),
      command: 'render',
    });
    commitContent(content);
  };

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
      <CodeEditor language="html" width="100%" height="50vh" value={content} onSave={onSave} showLineNumbers />
      <Button onClick={onRunClick}>Run</Button>
      <Button onClick={onClearClick}>Clear</Button>
      {/* <Console logs={logs} variant="dark" /> */}
    </>
  );
};
