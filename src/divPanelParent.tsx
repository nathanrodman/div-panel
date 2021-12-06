import React, { useRef } from 'react';
import { DivPanelChild } from './divPanelChild';
import { DivPanelType, getDivPanelState, DivPanelOptions, defaults } from './types';
import { hasEditModeFunctions } from './utils/functions';
import { PanelProps } from '@grafana/data';
import { parseHtml } from './utils/functions';

interface Props extends PanelProps<DivPanelType> {}

export const DivPanelParent = (props: Props) => {
  const ref = useRef(null);
  const onChangeChild = (newOptions: DivPanelOptions) => {
    const { onOptionsChange, options } = props;

    onOptionsChange({
      ...options,
      editor: newOptions,
    });
  };

  const render = () => {
    const { data } = props;
    const { editor } = props.options;
    const { content, error } = editor || defaults;
    const { command, editMode } = getDivPanelState();

    if (command === 'clear') {
      return <div>Clear and unmount complete</div>;
    }

    const parsed = parseHtml(content, error);
    if (editMode && hasEditModeFunctions(content)) {
      return <DivPanelChild onChange={onChangeChild} options={editor} parsed={parsed} data={data} parentRef={ref} />;
    }

    return (
      <div ref={ref}>
        <DivPanelChild onChange={onChangeChild} options={editor} parsed={parsed} data={data} parentRef={ref} />
      </div>
    );
  };

  return render();
};
