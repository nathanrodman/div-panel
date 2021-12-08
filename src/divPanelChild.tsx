import React, { FC } from 'react';
import { DivPanelChildProps } from './types';
import { css } from 'emotion';
import * as GrafanaUI from '@grafana/ui';
import * as functions from './utils/functions';
import * as ReactDOM from 'react-dom';
import { PanelData } from '@grafana/data';

type ComponentProps = {
  data: PanelData;
};

export const DivPanelChild = (props: DivPanelChildProps) => {
  const { options, data } = props;

  const ReactComponent: FC<ComponentProps> = new Function(
    `React, functions, ReactDom, GrafanaUI, css, props`,
    `${options.transformed}; 
    return ${options.exportedFn}`
  )(React, functions, ReactDOM, GrafanaUI, css, props);
  return <ReactComponent data={data} />;
};
