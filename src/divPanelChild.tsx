import React, { FC } from 'react';
import { DivPanelChildProps } from './types';
import { css } from 'emotion';
import * as GrafanaUI from '@grafana/ui';
import { PanelData } from '@grafana/data';

type ComponentProps = {
  data: PanelData;
};

export const DivPanelChild = (props: DivPanelChildProps) => {
  const { options, data } = props;

  const ReactComponent: FC<ComponentProps> = new Function(
    `React, GrafanaUI, css, ${options.exportedFn}`,
    `${options.transformed}; 
    return ${options.exportedFn}`
  )(React, GrafanaUI, css, new Function());
  return <ReactComponent data={data} />;
};
