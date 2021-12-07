import React, { useEffect, useCallback, useState } from 'react';
import { StandardEditorProps } from '@grafana/data';
import { DivPanelOptions, getDivPanelState, setDivPanelState, defaults, AcornNode, Comment } from './types';
import { CodeEditor, Button } from '@grafana/ui';
import * as buble from 'buble';
import { css } from 'emotion';
import * as acorn from 'acorn';
import jsx from 'acorn-jsx';
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

const findIdentifier = (nodes: AcornNode[]): AcornNode | undefined => {
  for (var i = 0; i < nodes.length; i++) {
    if (nodes[i].type === 'VariableDeclarator' && nodes[i].id?.type === 'Identifier') {
      return nodes[i].id;
    }

    if (nodes[i].declaration) {
      return findIdentifier([nodes[i].declaration!]);
    }

    if (nodes[i].declarations) {
      return findIdentifier(nodes[i].declarations!);
    }
  }

  return undefined;
};

export const DivMonacoEditor: React.FC<StandardEditorProps<DivPanelOptions>> = ({ value, onChange }) => {
  const options = value || defaults;
  const { content } = options;
  const jsParser = acorn.Parser.extend(jsx());

  const [editorContent, setEditorContent] = useState(content);

  const commitContent = (content: string) => {
    let comments: Comment[] = [];
    let cleanContent = content;
    let exportedFn = '';
    const parsedJS: AcornNode | undefined = jsParser.parse(content, {
      ecmaVersion: 'latest',
      sourceType: 'module',
      onComment: comments,
    }) as AcornNode;

    // Filter out comments incase they include strings that could break the parser
    if (comments.length > 0) {
      comments.forEach((comment: Comment) => {
        cleanContent = cleanContent.replace(comment.value, '');
      });
    }

    if (parsedJS?.body && Array.isArray(parsedJS.body)) {
      const exportNamedDecl: AcornNode[] | undefined = parsedJS.body.filter(
        (n: AcornNode) => n.type === 'ExportNamedDeclaration'
      );
      const exportDefaultDecl: AcornNode[] | undefined = parsedJS.body.filter(
        (n: AcornNode) => n.type === 'ExportDefaultDeclaration'
      );
      if (exportNamedDecl && exportNamedDecl.length === 1) {
        cleanContent = cleanContent.replace('export', '');
        const idNode: AcornNode | undefined = findIdentifier(exportNamedDecl);
        if (idNode) {
          exportedFn = idNode.name!;
        }
      } else if (exportDefaultDecl && exportDefaultDecl.length === 1) {
        exportedFn = exportDefaultDecl[0].declaration?.name!;
        cleanContent = cleanContent.replace(/export\s+default.*?$/s, '');
      }
    } else {
      throw 'Parse error';
    }

    const transformed = buble.transform(cleanContent, {
      transforms: {
        dangerousTaggedTemplateString: true,
      },
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
