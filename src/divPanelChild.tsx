import React from 'react';
import { DivPanelChildProps } from './types';
import { css } from 'emotion';
import * as GrafanaUI from '@grafana/ui';

export const DivPanelChild = (props: DivPanelChildProps) => {
  const { options } = props;

  const reactComponent = new Function(
    `React, GrafanaUI, css, ${options.exportedFn}`,
    `${options.transformed}; 
    // if (data && typeof onDivPanelDataUpdate === 'function') {
    //   onDivPanelDataUpdate(data, elem);
    // }
    return ${options.exportedFn}`
  )(React, GrafanaUI, css, new Function());
  return reactComponent();
};
